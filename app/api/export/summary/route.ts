import { createClient } from '@supabase/supabase-js'
import { getSupabaseAdmin } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

type Bbox = { x: number; y: number; width: number; height: number }
type VerifiedImage = {
  id: string
  original_filename: string
  final_species_id: number | null
  final_bbox: Bbox | null
}

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
  if (!profile || profile.role !== 'admin' || profile.status !== 'active') {
    return { error: 'Administrator access is required.', status: 403 as const }
  }

  return { admin: getSupabaseAdmin() }
}

function hasValidFinalBox(box: Bbox | null): box is Bbox {
  if (!box || ![box.x, box.y, box.width, box.height].every(Number.isFinite)) return false
  return box.x >= 0 && box.y >= 0 && box.width > 0 && box.height > 0 && box.x + box.width <= 100 && box.y + box.height <= 100
}

async function getVerifiedImages() {
  const admin = getSupabaseAdmin()
  const images: VerifiedImage[] = []

  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await admin
      .from('snake_images')
      .select('id, original_filename, final_species_id, final_bbox')
      .eq('status', 'verified')
      .order('created_at', { ascending: true })
      .range(offset, offset + 999)

    if (error) throw error
    const page = (data ?? []) as VerifiedImage[]
    images.push(...page)
    if (page.length < 1000) return images
  }
}

export async function GET(request: Request) {
  const access = await requireAdmin(request)
  if ('error' in access) return Response.json({ detail: access.error }, { status: access.status })

  try {
    const verifiedImages = await getVerifiedImages()
    const skipped: Array<{ id: string; filename: string; reason: string }> = []
    const ready = verifiedImages.filter(image => {
      if (!image.final_species_id) {
        skipped.push({ id: image.id, filename: image.original_filename, reason: 'missing_final_species' })
        return false
      }
      if (!hasValidFinalBox(image.final_bbox)) {
        skipped.push({ id: image.id, filename: image.original_filename, reason: 'missing_or_invalid_final_bbox' })
        return false
      }
      return true
    })

    return Response.json({
      verified: verifiedImages.length,
      ready: ready.length,
      classes: new Set(ready.map(image => image.final_species_id)).size,
      skipped,
    })
  } catch (error) {
    console.error('Could not load export summary.', error)
    return Response.json({ detail: 'Could not load verified dataset records.' }, { status: 500 })
  }
}
