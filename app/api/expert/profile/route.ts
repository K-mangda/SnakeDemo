import { createClient } from '@supabase/supabase-js'
import { getSupabaseAdmin } from '@/lib/supabase/admin'

export async function GET(request: Request) {
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  if (!token) return Response.json({ detail: 'Sign in is required.' }, { status: 401 })
  if (!url || !publishableKey) return Response.json({ detail: 'Workspace configuration is incomplete.' }, { status: 500 })

  const client = createClient(url, publishableKey, { global: { headers: { Authorization: `Bearer ${token}` } } })
  const { data: authData, error: authError } = await client.auth.getUser(token)
  if (authError || !authData.user) return Response.json({ detail: 'Your session has expired.' }, { status: 401 })

  const { data: profile, error } = await getSupabaseAdmin()
    .from('profiles')
    .select('full_name, role, specialty, status')
    .eq('id', authData.user.id)
    .single()
  if (error || !profile || profile.role !== 'expert' || profile.status !== 'active') return Response.json({ detail: 'You do not have access to this workspace.' }, { status: 403 })
  return Response.json({ profile })
}
