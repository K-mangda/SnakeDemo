import { createClient } from '@supabase/supabase-js'
import { getSupabaseAdmin } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

type ImageStatus = 'pending' | 'verified' | 'unclear' | 'waiting_for_new_class'

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
  return { admin: getSupabaseAdmin() }
}

async function countImages(status?: ImageStatus) {
  const query = getSupabaseAdmin().from('snake_images').select('*', { count: 'exact', head: true })
  const { count, error } = status ? await query.eq('status', status) : await query
  if (error) throw error
  return count ?? 0
}

export async function GET(request: Request) {
  const access = await requireAdmin(request)
  if ('error' in access) return Response.json({ detail: access.error }, { status: access.status })
  try {
    const [total, verified, pending, unclear, waitingForNewClass, speciesResult, activeModelResult] = await Promise.all([
      countImages(), countImages('verified'), countImages('pending'), countImages('unclear'), countImages('waiting_for_new_class'),
      access.admin.from('snake_species').select('id, scientific_name, name_en, name_th').order('scientific_name'),
      access.admin.from('model_versions').select('version_name, model_path, map50, precision_score, recall_score, created_at').eq('is_active', true).order('created_at', { ascending: false }).limit(1).maybeSingle(),
    ])
    if (speciesResult.error) throw speciesResult.error
    if (activeModelResult.error) throw activeModelResult.error
    const verifiedCounts = await Promise.all((speciesResult.data ?? []).map(async (species) => {
      const { count, error } = await access.admin.from('snake_images').select('*', { count: 'exact', head: true }).eq('status', 'verified').eq('final_species_id', species.id)
      if (error) throw error
      return { id: species.id, name: species.name_en || species.name_th || species.scientific_name, scientificName: species.scientific_name, count: count ?? 0 }
    }))
    return Response.json({
      counts: { total, verified, pending, unclear, waitingForNewClass }, verifiedSpecies: verifiedCounts,
      activeModel: activeModelResult.data ? { version: activeModelResult.data.version_name, modelPath: activeModelResult.data.model_path, map50: activeModelResult.data.map50, precision: activeModelResult.data.precision_score, recall: activeModelResult.data.recall_score, recordedAt: activeModelResult.data.created_at } : null,
    }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    console.error('Could not load admin overview.', error)
    return Response.json({ detail: 'Could not load the administrative overview.' }, { status: 500 })
  }
}
