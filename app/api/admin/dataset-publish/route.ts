import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const WORKFLOW_FILE = 'publish-dataset.yml'
const REPOSITORY = process.env.GITHUB_DATASET_REPOSITORY ?? 'K-mangda/SnakeDemo'

type GithubRun = {
  status: string
  conclusion: string | null
  created_at: string
  updated_at: string
  html_url: string
  display_title: string
}

async function requireAdmin(request: Request) {
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  if (!token) return { error: 'Sign in is required.', status: 401 as const }
  if (!url || !key) return { error: 'Admin configuration is incomplete.', status: 500 as const }

  const client = createClient(url, key, { global: { headers: { Authorization: `Bearer ${token}` } } })
  const { data: authData, error: authError } = await client.auth.getUser(token)
  if (authError || !authData.user) return { error: 'Your session has expired.', status: 401 as const }
  const { data: profiles } = await client.rpc('current_profile')
  const profile = profiles?.[0]
  if (!profile || profile.role !== 'admin' || profile.status !== 'active') return { error: 'Administrator access is required.', status: 403 as const }
  return { token }
}

function githubHeaders(token: string) {
  return {
    Accept: 'application/vnd.github+json',
    Authorization: `Bearer ${token}`,
    'X-GitHub-Api-Version': '2022-11-28',
  }
}

async function latestRun(token: string) {
  const response = await fetch(`https://api.github.com/repos/${REPOSITORY}/actions/workflows/${WORKFLOW_FILE}/runs?per_page=1`, {
    headers: githubHeaders(token),
    cache: 'no-store',
  })
  if (!response.ok) throw new Error('Could not read the publish job status from GitHub.')
  const payload = await response.json() as { workflow_runs?: GithubRun[] }
  const run = payload.workflow_runs?.[0]
  return run ? {
    status: run.status,
    conclusion: run.conclusion,
    createdAt: run.created_at,
    updatedAt: run.updated_at,
    url: run.html_url,
    title: run.display_title,
  } : null
}

export async function GET(request: Request) {
  const access = await requireAdmin(request)
  if ('error' in access) return Response.json({ detail: access.error }, { status: access.status })
  const githubToken = process.env.GITHUB_DATASET_PUBLISH_TOKEN
  if (!githubToken) return Response.json({ configured: false, run: null })

  try {
    return Response.json({ configured: true, run: await latestRun(githubToken) })
  } catch (error) {
    return Response.json({ detail: error instanceof Error ? error.message : 'Could not load publish status.' }, { status: 502 })
  }
}

export async function POST(request: Request) {
  const access = await requireAdmin(request)
  if ('error' in access) return Response.json({ detail: access.error }, { status: access.status })
  const githubToken = process.env.GITHUB_DATASET_PUBLISH_TOKEN
  if (!githubToken) return Response.json({ detail: 'Dataset publisher is not configured yet.' }, { status: 503 })

  const body = await request.json().catch(() => ({}))
  const version = typeof body.version === 'string' ? body.version.trim() : ''
  if (!/^v\d+(?:\.\d+){0,2}$/.test(version)) return Response.json({ detail: 'Use a version like v1, v2.0, or v2.0.0.' }, { status: 400 })

  const response = await fetch(`https://api.github.com/repos/${REPOSITORY}/actions/workflows/${WORKFLOW_FILE}/dispatches`, {
    method: 'POST',
    headers: { ...githubHeaders(githubToken), 'Content-Type': 'application/json' },
    body: JSON.stringify({ ref: 'main', inputs: { version } }),
  })
  if (!response.ok) {
    const detail = await response.text()
    console.error('Could not dispatch dataset publish workflow.', detail)
    return Response.json({ detail: 'Could not start the dataset publish job. Check the GitHub publisher configuration.' }, { status: 502 })
  }
  return Response.json({ queued: true, version })
}
