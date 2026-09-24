import { createClient } from '@supabase/supabase-js'
import { strToU8, zipSync } from 'fflate'
import { getSupabaseAdmin } from '@/lib/supabase/admin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type Bbox = { x: number; y: number; width: number; height: number }
type StoredImage = { id: string; storage_path: string; original_filename: string; final_species_id: number | null; final_bbox: Bbox | null; final_species: { id: number; scientific_name: string; name_th: string | null; name_en: string | null }[] | null }
type ExportFormat = 'yolo' | 'coco' | 'csv'
type Skip = { id: string; filename: string; reason: string }

async function requireAdmin(request: Request) {
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  if (!token) return { error: 'Sign in is required.', status: 401 as const }
  if (!url || !key) return { error: 'Export configuration is incomplete.', status: 500 as const }
  const client = createClient(url, key, { global: { headers: { Authorization: `Bearer ${token}` } } })
  const { data: authData, error: authError } = await client.auth.getUser(token)
  if (authError || !authData.user) return { error: 'Your session has expired.', status: 401 as const }
  const { data: profiles } = await client.rpc('current_profile')
  const profile = profiles?.[0]
  if (!profile || profile.role !== 'admin' || profile.status !== 'active') return { error: 'Administrator access is required.', status: 403 as const }
  return { admin: getSupabaseAdmin() }
}

function validBox(value: Bbox | null): value is Bbox {
  if (!value || ![value.x, value.y, value.width, value.height].every(Number.isFinite)) return false
  return value.x >= 0 && value.y >= 0 && value.width > 0 && value.height > 0 && value.x + value.width <= 100 && value.y + value.height <= 100
}
function normalizedBox(box: Bbox) { return { x: box.x / 100, y: box.y / 100, width: box.width / 100, height: box.height / 100 } }
function safeFilename(filename: string, id: string) { const clean = filename.normalize('NFC').replace(/[\\/:*?"<>|\u0000-\u001F]/g, '_').replace(/\s+/g, '_').slice(-120) || 'image.jpg'; return `${id}-${clean}${/\.(jpe?g|png)$/i.test(clean) ? '' : '.jpg'}` }
function csvValue(value: string) { return `"${value.replace(/"/g, '""')}"` }

function imageDimensions(bytes: Uint8Array): { width: number; height: number } | null {
  if (bytes.length >= 24 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) { const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength); return { width: view.getUint32(16), height: view.getUint32(20) } }
  if (bytes[0] !== 0xff || bytes[1] !== 0xd8) return null
  let offset = 2
  while (offset + 9 < bytes.length) { if (bytes[offset] !== 0xff) { offset += 1; continue }; const marker = bytes[offset + 1]; const length = (bytes[offset + 2] << 8) + bytes[offset + 3]; if (length < 2 || offset + length + 2 > bytes.length) return null; if (marker >= 0xc0 && marker <= 0xc3) return { height: (bytes[offset + 5] << 8) + bytes[offset + 6], width: (bytes[offset + 7] << 8) + bytes[offset + 8] }; offset += length + 2 }
  return null
}

async function verifiedImages(admin: ReturnType<typeof getSupabaseAdmin>) {
  const images: StoredImage[] = []
  for (let from = 0; ; from += 1000) { const { data, error } = await admin.from('snake_images').select('id, storage_path, original_filename, final_species_id, final_bbox, final_species:snake_species!snake_images_final_species_id_fkey(id, scientific_name, name_th, name_en)').eq('status', 'verified').order('created_at', { ascending: true }).range(from, from + 999); if (error) throw error; const page = (data ?? []) as StoredImage[]; images.push(...page); if (page.length < 1000) return images }
}
function eligibility(images: StoredImage[]) { const skipped: Skip[] = []; const ready = images.filter(image => { const species = image.final_species?.[0]; if (!image.final_species_id || !species) { skipped.push({ id: image.id, filename: image.original_filename, reason: 'missing_final_species' }); return false }; if (!validBox(image.final_bbox)) { skipped.push({ id: image.id, filename: image.original_filename, reason: 'missing_or_invalid_final_bbox' }); return false }; return true }); return { ready, skipped } }

export async function GET(request: Request) {
  const access = await requireAdmin(request)
  if ('error' in access) return Response.json({ detail: access.error }, { status: access.status })
  try { const allVerified = await verifiedImages(access.admin); const { ready, skipped } = eligibility(allVerified); return Response.json({ verified: allVerified.length, ready: ready.length, classes: new Set(ready.map(image => image.final_species_id)).size, skipped: skipped.length }) } catch (error) { console.error('Could not prepare export summary.', error); return Response.json({ detail: 'Could not load verified dataset records.' }, { status: 500 }) }
}

export async function POST(request: Request) {
  const access = await requireAdmin(request)
  if ('error' in access) return Response.json({ detail: access.error }, { status: access.status })
  const body = await request.json().catch(() => null); const format = body?.format as ExportFormat
  if (!['yolo', 'coco', 'csv'].includes(format)) return Response.json({ detail: 'Choose YOLO, COCO, or CSV.' }, { status: 400 })
  try {
    const { ready, skipped } = eligibility(await verifiedImages(access.admin))
    const species = [...new Map(ready.map(image => [image.final_species_id!, image.final_species![0]])).entries()].sort(([, left], [, right]) => left.scientific_name.localeCompare(right.scientific_name))
    const classIds = new Map(species.map(([id], index) => [id, index])); const entries: Record<string, Uint8Array> = {}; const exported: Array<{ image: StoredImage; filename: string; width: number; height: number }> = []
    for (const image of ready) { const { data, error } = await access.admin.storage.from('prediction-images').download(image.storage_path); if (error || !data) { skipped.push({ id: image.id, filename: image.original_filename, reason: 'image_download_failed' }); continue }; const bytes = new Uint8Array(await data.arrayBuffer()); const dimensions = imageDimensions(bytes); if (!dimensions || !dimensions.width || !dimensions.height) { skipped.push({ id: image.id, filename: image.original_filename, reason: 'unsupported_or_invalid_image' }); continue }; const filename = safeFilename(image.original_filename, image.id); entries[`images/${filename}`] = bytes; exported.push({ image, filename, ...dimensions }) }
    if (format === 'yolo') { for (const item of exported) { const box = normalizedBox(item.image.final_bbox!); const classId = classIds.get(item.image.final_species_id!); entries[`labels/${item.filename.replace(/\.[^.]+$/, '')}.txt`] = strToU8(`${classId} ${(box.x + box.width / 2).toFixed(6)} ${(box.y + box.height / 2).toFixed(6)} ${box.width.toFixed(6)} ${box.height.toFixed(6)}\n`) }; const names = species.map(([, item], index) => `  ${index}: ${JSON.stringify(item.scientific_name)}`).join('\n'); entries['data.yaml'] = strToU8(`path: .\ntrain: images\nval: images\nnc: ${species.length}\nnames:\n${names}\n`) }
    if (format === 'coco') { const annotations = exported.map((item, index) => { const box = normalizedBox(item.image.final_bbox!); return { id: index + 1, image_id: index + 1, category_id: classIds.get(item.image.final_species_id!)! + 1, bbox: [box.x * item.width, box.y * item.height, box.width * item.width, box.height * item.height], area: box.width * item.width * box.height * item.height, iscrowd: 0 } }); entries['annotations.json'] = strToU8(JSON.stringify({ images: exported.map((item, index) => ({ id: index + 1, file_name: item.filename, width: item.width, height: item.height })), annotations, categories: species.map(([, item], index) => ({ id: index + 1, name: item.scientific_name, supercategory: 'snake' })) }, null, 2)) }
    if (format === 'csv') { const rows = ['filename,species,bbox_normalized', ...exported.map(item => `${csvValue(item.filename)},${csvValue(item.image.final_species![0].scientific_name)},${csvValue(JSON.stringify(normalizedBox(item.image.final_bbox!)))}`)]; entries['dataset.csv'] = strToU8(`${rows.join('\n')}\n`) }
    entries['manifest.json'] = strToU8(JSON.stringify({ generated_at: new Date().toISOString(), format, source_filter: { status: 'verified', required_fields: ['final_species_id', 'final_bbox'], bbox_source: 'final_bbox' }, exported_images: exported.length, classes: species.map(([id, item], index) => ({ id, class_id: format === 'coco' ? index + 1 : index, scientific_name: item.scientific_name, image_count: exported.filter(entry => entry.image.final_species_id === id).length })), skipped }, null, 2))
    const archive = zipSync(entries, { level: 6 }); const stamp = new Date().toISOString().slice(0, 10)
    return new Response(archive, { headers: { 'content-type': 'application/zip', 'content-disposition': `attachment; filename="snake-verified-${format}-${stamp}.zip"`, 'cache-control': 'no-store' } })
  } catch (error) { console.error('Dataset export failed.', error); return Response.json({ detail: 'Could not create the dataset archive.' }, { status: 500 }) }
}
