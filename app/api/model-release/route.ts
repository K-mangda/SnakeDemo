export const dynamic = 'force-dynamic'

const BUCKET = 'model-releases'

const releaseFiles = [
  { name: 'snake-v1-int8.onnx', format: 'ONNX INT8', runtime: 'ONNX Runtime', recommended: true },
  { name: 'snake-v1.pt', format: 'PyTorch', runtime: 'Ultralytics YOLO', recommended: false },
] as const

function getPublicFileUrl(name: string) {
  const projectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!projectUrl) throw new Error('Missing Supabase project URL.')
  return `${projectUrl.replace(/\/$/, '')}/storage/v1/object/public/${BUCKET}/${encodeURIComponent(name)}`
}

export async function GET() {
  try {
    const artifacts = (await Promise.all(releaseFiles.map(async releaseFile => {
      const url = getPublicFileUrl(releaseFile.name)
      const response = await fetch(url, { method: 'HEAD', cache: 'no-store' })
      if (!response.ok) return null

      const size = Number(response.headers.get('content-length'))
      return {
        ...releaseFile,
        size: Number.isFinite(size) && size > 0 ? size : null,
        updatedAt: response.headers.get('last-modified'),
        url,
      }
    }))).filter((artifact): artifact is NonNullable<typeof artifact> => artifact !== null)

    return Response.json({
      version: 'v1.0.0',
      architecture: 'YOLOv8m',
      classCount: 25,
      metrics: { map50: 0.57607, map50_95: 0.43995 },
      artifacts,
    }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    console.error('Could not load model release.', error)
    return Response.json({ detail: 'Could not load the model release.' }, { status: 500 })
  }
}
