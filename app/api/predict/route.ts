export const runtime = 'nodejs'

export async function POST(request: Request) {
  const incoming = await request.formData()
  const image = incoming.get('image')
  if (!(image instanceof File)) {
    return Response.json({ detail: 'An image file is required.' }, { status: 400 })
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
    return Response.json(payload, { status: response.status })
  } catch {
    return Response.json({ detail: 'AI inference service is offline. Start the local model service and try again.' }, { status: 503 })
  }
}
