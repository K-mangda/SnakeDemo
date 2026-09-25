import { getSupabaseAdmin } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

const BUCKET = 'model-releases'

const releaseFiles = [
  { name: 'snake-v1-int8.onnx', format: 'ONNX INT8', runtime: 'ONNX Runtime', recommended: true },
  { name: 'snake-v1.pt', format: 'PyTorch', runtime: 'Ultralytics YOLO', recommended: false },
] as const

export async function GET() {
  try {
    const storage = getSupabaseAdmin().storage.from(BUCKET)
    const { data: objects, error } = await storage.list('', { limit: 100 })
    if (error) throw error

    const artifacts = releaseFiles.flatMap(releaseFile => {
      const object = objects?.find(candidate => candidate.name === releaseFile.name)
      if (!object) return []

      const { data: publicUrl } = storage.getPublicUrl(releaseFile.name)
      return [{
        ...releaseFile,
        size: typeof object.metadata?.size === 'number' ? object.metadata.size : null,
        updatedAt: object.updated_at,
        url: publicUrl.publicUrl,
      }]
    })

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
