import { createClient } from '@supabase/supabase-js'
import { getSupabaseAdmin } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

async function requireAdmin(request: Request) {
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  if (!token) return { error: 'Sign in is required.', status: 401 as const }
  if (!url || !key) return { error: 'Admin configuration is incomplete.', status: 500 as const }

  const client = createClient(url, key, { global: { headers: { Authorization: 'Bearer ' + token } } })
  const { data: authData, error: authError } = await client.auth.getUser(token)
  if (authError || !authData.user) return { error: 'Your session has expired.', status: 401 as const }
  const { data: profiles } = await client.rpc('current_profile')
  const profile = profiles?.[0]
  if (!profile || profile.role !== 'admin' || profile.status !== 'active') return { error: 'Administrator access is required.', status: 403 as const }
  return { admin: getSupabaseAdmin() }
}

const fields = 'id, version_name, model_path, map50, precision_score, recall_score, is_active, created_at'

export async function GET(request: Request) {
  const access = await requireAdmin(request)
  if ('error' in access) return Response.json({ detail: access.error }, { status: access.status })
  const { data, error } = await access.admin.from('model_versions').select(fields).order('created_at', { ascending: false })
  if (error) return Response.json({ detail: 'Could not load the model registry.' }, { status: 500 })
  return Response.json({ models: data ?? [] }, { headers: { 'Cache-Control': 'no-store' } })
}

export async function PATCH(request: Request) {
  const access = await requireAdmin(request)
  if ('error' in access) return Response.json({ detail: access.error }, { status: access.status })
  const body = await request.json().catch(() => null)
  const id = typeof body?.id === 'number' ? body.id : null
  if (!id || !Number.isInteger(id)) return Response.json({ detail: 'A model version is required.' }, { status: 400 })

  const { data: target, error: targetError } = await access.admin.from('model_versions').select('id').eq('id', id).maybeSingle()
  if (targetError || !target) return Response.json({ detail: 'That model version could not be found.' }, { status: 404 })
  const { error: deactivateError } = await access.admin.from('model_versions').update({ is_active: false }).neq('id', id).eq('is_active', true)
  if (deactivateError) return Response.json({ detail: 'Could not update the active model.' }, { status: 500 })
  const { data, error } = await access.admin.from('model_versions').update({ is_active: true }).eq('id', id).select(fields).single()
  if (error || !data) return Response.json({ detail: 'Could not activate this model version.' }, { status: 500 })
  return Response.json({ model: data })
}
