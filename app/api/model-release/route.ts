import { getSupabaseAdmin } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

const BUCKET = 'model-releases'
const supportedExtensions = ['.onnx', '.pt', '.tflite']

type ArtifactConfig = { name: string; format: string; runtime: string }
type ReleaseMetadata = {
  version?: string
  architecture?: string
  classCount?: number
  releasedAt?: string
  metrics?: { map50?: number; map50_95?: number }
}
type ModelRelease = {
  version: string
  architecture: string
  classCount: number | null
  releasedAt: string | null
  metrics: { map50: number | null; map50_95: number | null }
  artifacts: ArtifactConfig[]
}

const knownV1: Omit<ModelRelease, 'artifacts'> = {
  version: 'v1.0.0',
  architecture: 'YOLOv8m',
  classCount: 25,
  releasedAt: '2026-09-25',
  metrics: { map50: 0.57607, map50_95: 0.43995 },
}

function getPublicFileUrl(name: string) {
  const projectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!projectUrl) throw new Error('Missing Supabase project URL.')
  return `${projectUrl.replace(/\/$/, '')}/storage/v1/object/public/${BUCKET}/${name.split('/').map(encodeURIComponent).join('/')}`
}

function getVersion(path: string) {
  const folder = path.split('/')[0]
  if (/^v\d+(?:\.\d+)*$/i.test(folder)) return folder.toLowerCase()
  return path.match(/(?:^|[-_])(v\d+(?:\.\d+)*)(?:[-_.]|$)/i)?.[1]?.toLowerCase() ?? null
}

function isModelFile(path: string) {
  return supportedExtensions.some(extension => path.toLowerCase().endsWith(extension))
}

function getArtifact(path: string): ArtifactConfig {
  const lower = path.toLowerCase()
  if (lower.endsWith('.onnx')) return { name: path, format: lower.includes('int8') ? 'ONNX INT8' : 'ONNX', runtime: 'ONNX Runtime' }
  if (lower.endsWith('.tflite')) return { name: path, format: 'TFLite', runtime: 'TensorFlow Lite' }
  return { name: path, format: 'PyTorch', runtime: 'Ultralytics YOLO' }
}

function compareVersions(a: string, b: string) {
  return b.localeCompare(a, undefined, { numeric: true })
}

function compareReleases(a: ModelRelease, b: ModelRelease) {
  const aScore = a.metrics.map50_95 ?? -1
  const bScore = b.metrics.map50_95 ?? -1
  if (bScore !== aScore) return bScore - aScore
  const aMap50 = a.metrics.map50 ?? -1
  const bMap50 = b.metrics.map50 ?? -1
  if (bMap50 !== aMap50) return bMap50 - aMap50
  return compareVersions(a.version, b.version)
}

function isMetadata(value: unknown): value is ReleaseMetadata {
  return Boolean(value) && typeof value === 'object'
}

async function getMetadata(folder: string): Promise<ReleaseMetadata> {
  const response = await fetch(getPublicFileUrl(`${folder}/release.json`), { cache: 'no-store' })
  if (!response.ok) return {}
  const body: unknown = await response.json()
  return isMetadata(body) ? body : {}
}

async function discoverFiles() {
  try {
    const storage = getSupabaseAdmin().storage.from(BUCKET)
    const { data: rootObjects, error } = await storage.list('', { limit: 1000 })
    if (error) throw error

    const rootFiles = (rootObjects ?? []).map(object => object.name).filter(isModelFile)
    const versionFolders = (rootObjects ?? []).map(object => object.name).filter(name => /^v\d+(?:\.\d+)*$/i.test(name))
    const nestedFiles = await Promise.all(versionFolders.map(async folder => {
      const { data, error: folderError } = await storage.list(folder, { limit: 1000 })
      if (folderError) throw folderError
      return (data ?? []).map(object => `${folder}/${object.name}`).filter(isModelFile)
    }))

    return [...rootFiles, ...nestedFiles.flat()]
  } catch (error) {
    console.warn('Automatic release discovery is unavailable; serving the known v1 files.', error)
    // Support both the original root layout and the organized v1/ folder layout.
    // Missing paths are filtered out by the public-file check below.
    return ['snake-v1-int8.onnx', 'snake-v1.pt', 'v1/snake-v1-int8.onnx', 'v1/snake-v1.pt']
  }
}

export async function GET() {
  try {
    const files = await discoverFiles()
    const grouped = new Map<string, string[]>()
    for (const file of files) {
      const version = getVersion(file)
      if (!version) continue
      grouped.set(version, [...(grouped.get(version) ?? []), file])
    }

    const releases = await Promise.all([...grouped.entries()].map(async ([inferredVersion, artifacts]) => {
      const folder = artifacts[0].includes('/') ? artifacts[0].split('/')[0] : ''
      const metadata = folder ? await getMetadata(folder) : {}
      const fallback = inferredVersion === 'v1' ? knownV1 : null
      return {
        version: metadata.version ?? fallback?.version ?? inferredVersion,
        architecture: metadata.architecture ?? fallback?.architecture ?? '',
        classCount: metadata.classCount ?? fallback?.classCount ?? null,
        releasedAt: metadata.releasedAt ?? fallback?.releasedAt ?? null,
        metrics: {
          map50: metadata.metrics?.map50 ?? fallback?.metrics.map50 ?? null,
          map50_95: metadata.metrics?.map50_95 ?? fallback?.metrics.map50_95 ?? null,
        },
        artifacts: artifacts.map(getArtifact),
      } satisfies ModelRelease
    }))

    const availableReleases = releases.sort(compareReleases)
    if (!availableReleases.length) throw new Error('No model releases were found.')

    const releasesWithFiles = await Promise.all(availableReleases.map(async release => ({
      ...release,
      artifacts: (await Promise.all(release.artifacts.map(async artifact => {
        const url = getPublicFileUrl(artifact.name)
        const response = await fetch(url, { method: 'HEAD', cache: 'no-store' })
        if (!response.ok) return null
        const size = Number(response.headers.get('content-length'))
        return { ...artifact, size: Number.isFinite(size) && size > 0 ? size : null, updatedAt: response.headers.get('last-modified'), url }
      }))).filter((artifact): artifact is NonNullable<typeof artifact> => artifact !== null),
    })))
    const readyReleases = releasesWithFiles.filter(release => release.artifacts.length > 0)
    if (!readyReleases.length) throw new Error('No downloadable model releases were found.')

    return Response.json({ releases: readyReleases, recommendedVersion: readyReleases[0].version }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    console.error('Could not load model releases.', error)
    return Response.json({ detail: 'Could not load model releases.' }, { status: 500 })
  }
}
