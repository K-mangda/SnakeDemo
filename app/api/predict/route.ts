import { getSupabaseAdmin } from '@/lib/supabase/admin'
import type { SpeciesReference } from '@/lib/prediction'

export const runtime = 'nodejs'

const MAX_IMAGE_BYTES = 10 * 1024 * 1024

function originalFilename(filename: string) {
  return filename.normalize('NFC').replace(/[\\/:*?"<>|\u0000-\u001F]/g, '_').slice(-120) || 'scan.jpg'
}

function safeFilename(filename: string) {
  return originalFilename(filename).replace(/[^a-zA-Z0-9._-]/g, '_')
}

async function findReference(scientificName: string): Promise<SpeciesReference | null> {
  const admin = getSupabaseAdmin()
  const { data, error } = await admin
    .from('snake_species')
    .select('scientific_name, accepted_scientific_name, name_th, name_en, family, venom_type, danger_level, taxonomy_source, medical_source, reference_note')
    .eq('scientific_name', scientificName)
    .maybeSingle()

  if (!error) return data

  // Allow the existing prediction endpoint to remain available until the
  // administrator has run the reference-data migration in Supabase.
  const { data: legacyReference, error: legacyError } = await admin
    .from('snake_species')
    .select('scientific_name, name_th, name_en, family')
    .eq('scientific_name', scientificName)
    .maybeSingle()
  if (legacyError) throw legacyError
  if (!legacyReference) return null

  return {
    ...legacyReference,
    accepted_scientific_name: legacyReference.scientific_name,
    venom_type: null,
    danger_level: null,
    taxonomy_source: null,
    medical_source: null,
    reference_note: null,
  }
}

async function savePrediction(image: File, payload: { top_detection: { scientific: string; confidence: number; bbox: unknown } | null }, speciesId: number | null) {
  const admin = getSupabaseAdmin()
  const storagePath = `pending/${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}-${safeFilename(image.name)}`
  const imageBytes = new Uint8Array(await image.arrayBuffer())
  const { error: uploadError } = await admin.storage.from('prediction-images').upload(storagePath, imageBytes, {
    contentType: image.type,
    upsert: false,
  })
  if (uploadError) throw uploadError

  const { error: insertError } = await admin.from('snake_images').insert({
    storage_path: storagePath,
    original_filename: originalFilename(image.name),
    predicted_species_id: speciesId,
    predicted_scientific: payload.top_detection?.scientific ?? null,
    confidence: payload.top_detection?.confidence ?? null,
    predicted_bbox: payload.top_detection?.bbox ?? null,
    status: payload.top_detection ? 'pending' : 'no_detection',
  })
  if (insertError) {
    await admin.storage.from('prediction-images').remove([storagePath])
    throw insertError
  }
}

export async function POST(request: Request) {
  const saveNoDetection = new URL(request.url).searchParams.get('save_no_detection') === '1'
  const incoming = await request.formData()
  const image = incoming.get('image')
  if (!(image instanceof File)) {
    return Response.json({ detail: 'An image file is required.' }, { status: 400 })
  }
  if (!['image/jpeg', 'image/png'].includes(image.type)) {
    return Response.json({ detail: 'Only JPEG and PNG images are accepted.' }, { status: 415 })
  }
  if (!image.size || image.size > MAX_IMAGE_BYTES) {
    return Response.json({ detail: 'Image size must not exceed 10 MB.' }, { status: 413 })
  }

  const backendUrl = process.env.AI_BACKEND_URL
  if (!backendUrl) {
    return Response.json({ detail: 'AI inference service is not configured.' }, { status: 503 })
  }

  const outgoing = new FormData()
  outgoing.append('image', image, image.name)

  try {
    const response = await fetch(`${backendUrl}/predict`, { method: 'POST', body: outgoing })
    const payload = await response.json()
    if (!response.ok) return Response.json(payload, { status: response.status })
    if (!payload.top_detection && !saveNoDetection) return Response.json({ ...payload, recorded: false })

    const reference = payload.top_detection ? await findReference(payload.top_detection.scientific) : null
    const { data: species } = payload.top_detection
      ? await getSupabaseAdmin().from('snake_species').select('id').eq('scientific_name', payload.top_detection.scientific).maybeSingle()
      : { data: null }

    try {
      await savePrediction(image, payload, species?.id ?? null)
      return Response.json({ ...payload, reference, recorded: true })
    } catch (error) {
      console.error('Prediction completed but could not be stored.', error)
      return Response.json({ ...payload, reference, recorded: false })
    }
  } catch {
    return Response.json({ detail: 'AI service is starting. Please try again in about a minute.' }, { status: 503 })
  }
}
