import { createClient } from '@supabase/supabase-js'
import { getSupabaseAdmin } from '@/lib/supabase/admin'

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

function text(value: unknown, required = false) {
  if (value === undefined || value === null || value === '') return required ? undefined : null
  if (typeof value !== 'string') return undefined
  const normalized = value.normalize('NFC').trim().replace(/\s+/g, ' ')
  return normalized ? normalized.slice(0, 160) : (required ? undefined : null)
}

export async function GET(request: Request) {
  const access = await requireAdmin(request)
  if ('error' in access) return Response.json({ detail: access.error }, { status: access.status })

  const { data, error } = await access.admin
    .from('snake_species')
    .select('id, scientific_name, name_th, name_en, family, created_at')
    .order('scientific_name')
  if (error) return Response.json({ detail: 'Could not load the species catalogue.' }, { status: 500 })
  return Response.json({ species: data ?? [] }, { headers: { 'Cache-Control': 'no-store' } })
}

export async function PATCH(request: Request) {
  const access = await requireAdmin(request)
  if ('error' in access) return Response.json({ detail: access.error }, { status: access.status })

  const body = await request.json().catch(() => null)
  const id = typeof body?.id === 'number' ? body.id : null
  const scientificName = text(body?.species?.scientificName, true)
  const nameTh = text(body?.species?.nameTh)
  const nameEn = text(body?.species?.nameEn)
  const family = text(body?.species?.family)
  if (!id || !scientificName || [nameTh, nameEn, family].some((value) => value === undefined)) return Response.json({ detail: 'A valid scientific name is required.' }, { status: 400 })

  const { data, error } = await access.admin
    .from('snake_species')
    .update({ scientific_name: scientificName, name_th: nameTh, name_en: nameEn, family })
    .eq('id', id)
    .select('id, scientific_name, name_th, name_en, family, created_at')
    .single()
  if (error || !data) return Response.json({ detail: error?.code === '23505' ? 'A species with this scientific name already exists.' : 'Could not update this species.' }, { status: error?.code === '23505' ? 409 : 500 })
  return Response.json({ species: data })
}

export async function DELETE(request: Request) {
  const access = await requireAdmin(request)
  if ('error' in access) return Response.json({ detail: access.error }, { status: access.status })

  const id = Number(new URL(request.url).searchParams.get('id'))
  if (!Number.isInteger(id) || id < 1) return Response.json({ detail: 'A valid species is required.' }, { status: 400 })

  const [{ count: predictedCount }, { count: finalCount }, { count: voteCount }] = await Promise.all([
    access.admin.from('snake_images').select('id', { count: 'exact', head: true }).eq('predicted_species_id', id),
    access.admin.from('snake_images').select('id', { count: 'exact', head: true }).eq('final_species_id', id),
    access.admin.from('verification_history').select('id', { count: 'exact', head: true }).eq('voted_species_id', id),
  ])
  if ((predictedCount ?? 0) + (finalCount ?? 0) + (voteCount ?? 0) > 0) {
    return Response.json({ detail: 'This species is already used by saved images or reviews and cannot be deleted.' }, { status: 409 })
  }

  const { error } = await access.admin.from('snake_species').delete().eq('id', id)
  if (error) return Response.json({ detail: 'Could not delete this species.' }, { status: 500 })
  return Response.json({ deleted: 1 })
}
