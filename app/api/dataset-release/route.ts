const REPOSITORY = 'K-MangDa/nstru-thai-snake-dataset'
const VERSION_PATTERN = /^v\d+(?:\.\d+){0,2}$/

type TreeEntry = {
  type: string
  path: string
}

type DatasetManifest = {
  release_version: string
  created_at: string
  images: number
  classes: number
}

function compareVersions(left: string, right: string) {
  const leftParts = left.slice(1).split('.').map(Number)
  const rightParts = right.slice(1).split('.').map(Number)
  const size = Math.max(leftParts.length, rightParts.length)

  for (let index = 0; index < size; index += 1) {
    const difference = (rightParts[index] ?? 0) - (leftParts[index] ?? 0)
    if (difference !== 0) return difference
  }
  return 0
}

function downloadUrl(version: string, filename: string) {
  return `https://huggingface.co/datasets/${REPOSITORY}/resolve/main/releases/${version}/${filename}?download=true`
}

export async function GET() {
  try {
    const treeResponse = await fetch(`https://huggingface.co/api/datasets/${REPOSITORY}/tree/main/releases?recursive=false&expand=false`, {
      next: { revalidate: 120 },
    })
    if (!treeResponse.ok) throw new Error('Could not find a published dataset release.')

    const entries = await treeResponse.json() as TreeEntry[]
    const versions = entries
      .filter(entry => entry.type === 'directory')
      .map(entry => entry.path.split('/').at(-1) ?? '')
      .filter(version => VERSION_PATTERN.test(version))
      .sort(compareVersions)
    const version = versions[0]
    if (!version) throw new Error('No dataset release is available yet.')

    const manifestResponse = await fetch(downloadUrl(version, 'manifest.json'), { next: { revalidate: 120 } })
    if (!manifestResponse.ok) throw new Error('Could not read the dataset release manifest.')
    const manifest = await manifestResponse.json() as DatasetManifest

    return Response.json({
      version,
      createdAt: manifest.created_at,
      imageCount: manifest.images,
      classCount: manifest.classes,
      repositoryUrl: `https://huggingface.co/datasets/${REPOSITORY}`,
      formats: [
        { format: 'YOLO', url: downloadUrl(version, 'yolo.zip') },
        { format: 'COCO', url: downloadUrl(version, 'coco.zip') },
        { format: 'CSV', url: downloadUrl(version, 'csv.zip') },
      ],
    }, {
      headers: { 'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=60' },
    })
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'Could not load the published dataset release.'
    return Response.json({ detail }, { status: 502 })
  }
}
