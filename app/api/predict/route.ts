import { getSupabaseAdmin } from '@/lib/supabase/admin'

export const runtime = 'nodejs'

const MAX_IMAGE_BYTES = 10 * 1024 * 1024

function originalFilename(filename: string) {
  return filename.normalize('NFC').replace(/[\\/:*?"<>|\u0000-\u001F]/g, '_').slice(-120) || 'scan.jpg'
}

function safeFilename(filename: string) {
  return originalFilename(filename).replace(/[^a-zA-Z0-9._-]/g, '_')
}

async function savePrediction(image: File, payload: { top_detection: { scientific: string; confidence: number; bbox: unknown } | null }) {
  const admin = getSupabaseAdmin()
  const storagePath = `pending/${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}-${safeFilename(image.name)}`
  const imageBytes = new Uint8Array(await image.arrayBuffer())
  const { error: uploadError } = await admin.storage.from('prediction-images').upload(storagePath, imageBytes, {
    contentType: image.type,
    upsert: false,
  })
  if (uploadError) throw uploadError

  let speciesId: number | null = null
  if (payload.top_detection) {
    const { data: species } = await admin
      .from('snake_species')
      .select('id')
      .eq('scientific_name', payload.top_detection.scientific)
      .maybeSingle()
    speciesId = species?.id ?? null
  }

  const { error: insertError } = await admin.from('snake_images').insert({
    storage_path: storagePath,
    original_filename: originalFilename(image.name),
    predicted_species_id: speciesId,
    predicted_scientific: payload.top_detection?.scientific ?? null,
    confidence: payload.top_detection?.confidence ?? null,
    predicted_bbox: payload.top_detection?.bbox ?? null,
    status: payload.top_detection ? 'pending' : 'unclear',
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

    try {
      await savePrediction(image, payload)
      return Response.json({ ...payload, recorded: true })
    } catch (error) {
      console.error('Prediction completed but could not be stored.', error)
      return Response.json({ ...payload, recorded: false })
    }
  } catch {
    return Response.json({ detail: 'AI inference service is offline. Start the local model service and try again.' }, { status: 503 })
  }
}
