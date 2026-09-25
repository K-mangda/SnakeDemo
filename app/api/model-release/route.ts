export const dynamic = 'force-dynamic'

const BUCKET = 'model-releases'
const REGISTRY_FILE = 'releases.json'

type ArtifactConfig = {
  name: string
  format: string
  runtime: string
}

type ReleaseConfig = {
  version: string
  architecture: string
  classCount: number
  releasedAt?: string
  metrics: { map50: number; map50_95: number }
  artifacts: ArtifactConfig[]
}

const legacyV1: ReleaseConfig = {
  version: 'v1.0.0',
  architecture: 'YOLOv8m',
  classCount: 25,
  metrics: { map50: 0.57607, map50_95: 0.43995 },
  artifacts: [
    { name: 'snake-v1-int8.onnx', format: 'ONNX INT8', runtime: 'ONNX Runtime' },
    { name: 'snake-v1.pt', format: 'PyTorch', runtime: 'Ultralytics YOLO' },
  ],
}

function getPublicFileUrl(name: string) {
  const projectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!projectUrl) throw new Error('Missing Supabase project URL.')
  return `${projectUrl.replace(/\/$/, '')}/storage/v1/object/public/${BUCKET}/${name.split('/').map(encodeURIComponent).join('/')}`
}

function isReleaseConfig(value: unknown): value is ReleaseConfig {
  if (!value || typeof value !== 'object') return false
  const release = value as Partial<ReleaseConfig>
  return typeof release.version === 'string'
    && typeof release.architecture === 'string'
    && typeof release.classCount === 'number'
    && typeof release.metrics?.map50 === 'number'
    && typeof release.metrics?.map50_95 === 'number'
    && Array.isArray(release.artifacts)
    && release.artifacts.every(artifact => typeof artifact?.name === 'string' && typeof artifact?.format === 'string' && typeof artifact?.runtime === 'string')
}

async function getRegistry() {
  const response = await fetch(getPublicFileUrl(REGISTRY_FILE), { cache: 'no-store' })
  // Supabase returns 400 (rather than 404) when a public object is missing.
  // Keep the first release available until the optional multi-release registry is uploaded.
  if (response.status === 400 || response.status === 404) return [legacyV1]
  if (!response.ok) throw new Error(`Could not load release registry (${response.status}).`)

  const body = await response.json() as { releases?: unknown }
  const releases = Array.isArray(body.releases) ? body.releases.filter(isReleaseConfig) : []
  if (!releases.length) throw new Error('The release registry has no valid releases.')
  return releases
}

function compareReleases(a: ReleaseConfig, b: ReleaseConfig) {
  if (b.metrics.map50_95 !== a.metrics.map50_95) return b.metrics.map50_95 - a.metrics.map50_95
  if (b.metrics.map50 !== a.metrics.map50) return b.metrics.map50 - a.metrics.map50
  return b.version.localeCompare(a.version, undefined, { numeric: true })
}

export async function GET() {
  try {
    const registry = await getRegistry()
    const releases = await Promise.all(registry.map(async release => {
      const artifacts = (await Promise.all(release.artifacts.map(async artifact => {
        const url = getPublicFileUrl(artifact.name)
        const response = await fetch(url, { method: 'HEAD', cache: 'no-store' })
        if (!response.ok) return null

        const size = Number(response.headers.get('content-length'))
        return {
          ...artifact,
          size: Number.isFinite(size) && size > 0 ? size : null,
          updatedAt: response.headers.get('last-modified'),
          url,
        }
      }))).filter((artifact): artifact is NonNullable<typeof artifact> => artifact !== null)

      return { ...release, artifacts }
    }))

    const availableReleases = releases.filter(release => release.artifacts.length > 0).sort(compareReleases)
    if (!availableReleases.length) throw new Error('No release files are available.')

    return Response.json({
      releases: availableReleases,
      recommendedVersion: availableReleases[0].version,
    }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    console.error('Could not load model releases.', error)
    return Response.json({ detail: 'Could not load model releases.' }, { status: 500 })
  }
}
