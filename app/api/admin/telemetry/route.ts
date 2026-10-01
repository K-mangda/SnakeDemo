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
  if (!profile || profile.role !== 'admin' || profile.status !== 'active') {
    return { error: 'Administrator access is required.', status: 403 as const }
  }

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
    const fourteenDaysAgo = new Date()
    fourteenDaysAgo.setUTCDate(fourteenDaysAgo.getUTCDate() - 13)
    fourteenDaysAgo.setUTCHours(0, 0, 0, 0)

    const [total, verified, pending, unclear, waitingForNewClass, recentImagesResult, speciesResult] = await Promise.all([
      countImages(),
      countImages('verified'),
      countImages('pending'),
      countImages('unclear'),
      countImages('waiting_for_new_class'),
      access.admin.from('snake_images').select('created_at').gte('created_at', fourteenDaysAgo.toISOString()).order('created_at'),
      access.admin.from('snake_species').select('id, scientific_name, name_en, name_th').order('scientific_name'),
    ])

    if (recentImagesResult.error) throw recentImagesResult.error
    if (speciesResult.error) throw speciesResult.error

    const verifiedSpecies = await Promise.all((speciesResult.data ?? []).map(async (species) => {
      const { count, error } = await access.admin
        .from('snake_images')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'verified')
        .eq('final_species_id', species.id)
      if (error) throw error
      return { name: species.name_en || species.name_th || species.scientific_name, count: count ?? 0 }
    }))

    return Response.json({
      counts: { total, verified, pending, unclear, waitingForNewClass },
      recentImageCreatedAt: (recentImagesResult.data ?? []).map(image => image.created_at),
      verifiedSpecies,
    }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    console.error('Could not load system telemetry.', error)
    return Response.json({ detail: 'Could not load system telemetry.' }, { status: 500 })
  }
}
