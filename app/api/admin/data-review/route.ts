import { createClient } from '@supabase/supabase-js'
import { getSupabaseAdmin } from '@/lib/supabase/admin'

type ReviewStatus = 'unclear' | 'waiting_for_new_class'

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

function validIds(value: unknown) {
  if (!Array.isArray(value) || value.length === 0 || value.length > 100 || value.some((id) => typeof id !== 'string' || !id)) return null
  return [...new Set(value)]
}

export async function GET(request: Request) {
  const access = await requireAdmin(request)
  if ('error' in access) return Response.json({ detail: access.error }, { status: access.status })

  const url = new URL(request.url)
  const requestedStatus = url.searchParams.get('status')
  const page = Math.max(1, Number.parseInt(url.searchParams.get('page') ?? '1', 10) || 1)
  const pageSize = Math.min(48, Math.max(12, Number.parseInt(url.searchParams.get('pageSize') ?? '24', 10) || 24))
  const query = (url.searchParams.get('query') ?? '').trim().slice(0, 120).replace(/[%_]/g, '')

  if (requestedStatus === 'unclear' || requestedStatus === 'waiting_for_new_class') {
    const from = (page - 1) * pageSize
    let pageQuery = access.admin
      .from('snake_images')
      .select('id, storage_path, original_filename, status, updated_at', { count: 'exact' })
      .eq('status', requestedStatus)
      .order('updated_at', { ascending: false })
      .range(from, from + pageSize - 1)
    if (query) pageQuery = pageQuery.ilike('original_filename', `%${query}%`)

    const { data: images, error, count } = await pageQuery
    if (error) return Response.json({ detail: 'Could not load review queue images.' }, { status: 500 })

    const items = await Promise.all((images ?? []).map(async (image) => {
      const { data: signed } = await access.admin.storage.from('prediction-images').createSignedUrl(image.storage_path, 60 * 15)
      return { id: image.id, filename: image.original_filename, status: image.status as ReviewStatus, updatedAt: image.updated_at, imageUrl: signed?.signedUrl ?? null }
    }))
    const total = count ?? 0
    return Response.json({ items, page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) }, { headers: { 'Cache-Control': 'no-store' } })
  }

  const [imagesResult, unclearCountResult, newClassCountResult] = await Promise.all([
    access.admin.from('snake_images').select('id, storage_path, original_filename, status, updated_at').in('status', ['unclear', 'waiting_for_new_class']).order('updated_at', { ascending: false }).limit(100),
    access.admin.from('snake_images').select('id', { count: 'exact', head: true }).eq('status', 'unclear'),
    access.admin.from('snake_images').select('id', { count: 'exact', head: true }).eq('status', 'waiting_for_new_class'),
  ])
  const { data: images, error } = imagesResult
  if (error) return Response.json({ detail: 'Could not load review queues.' }, { status: 500 })

  const items = await Promise.all((images ?? []).map(async (image) => {
    const { data: signed } = await access.admin.storage.from('prediction-images').createSignedUrl(image.storage_path, 60 * 15)
    return {
      id: image.id,
      filename: image.original_filename,
      status: image.status as ReviewStatus,
      updatedAt: image.updated_at,
      imageUrl: signed?.signedUrl ?? null,
    }
  }))
  return Response.json({ items, counts: { unclear: unclearCountResult.count ?? 0, waitingForNewClass: newClassCountResult.count ?? 0 } }, { headers: { 'Cache-Control': 'no-store' } })
}

export async function PATCH(request: Request) {
  const access = await requireAdmin(request)
  if ('error' in access) return Response.json({ detail: access.error }, { status: access.status })

  const body = await request.json().catch(() => null)
  const ids = validIds(body?.ids)
  if (body?.action !== 'restore_unclear' || !ids) return Response.json({ detail: 'Select one or more unclear images to restore.' }, { status: 400 })

  const { data, error } = await access.admin
    .from('snake_images')
    .update({ status: 'pending', updated_at: new Date().toISOString() })
    .in('id', ids)
    .eq('status', 'unclear')
    .select('id')
  if (error) return Response.json({ detail: 'Could not restore unclear images.' }, { status: 500 })
  return Response.json({ restored: data?.length ?? 0 })
}

export async function DELETE(request: Request) {
  const access = await requireAdmin(request)
  if ('error' in access) return Response.json({ detail: access.error }, { status: access.status })

  const body = await request.json().catch(() => null)
  const ids = validIds(body?.ids)
  if (!ids) return Response.json({ detail: 'Select one or more unclear images to delete.' }, { status: 400 })

  const { data: images, error: readError } = await access.admin
    .from('snake_images')
    .select('id, storage_path')
    .in('id', ids)
    .eq('status', 'unclear')
  if (readError) return Response.json({ detail: 'Could not prepare unclear images for deletion.' }, { status: 500 })
  if (!images?.length) return Response.json({ detail: 'No selected unclear images are available to delete.' }, { status: 404 })

  const { error: deleteError } = await access.admin.from('snake_images').delete().in('id', images.map((image) => image.id)).eq('status', 'unclear')
  if (deleteError) return Response.json({ detail: 'Could not delete unclear images.' }, { status: 500 })

  const { error: storageError } = await access.admin.storage.from('prediction-images').remove(images.map((image) => image.storage_path))
  if (storageError) {
    console.error('Deleted unclear image records but could not remove all storage objects.', storageError)
    return Response.json({ deleted: images.length, storageCleaned: false, detail: 'Image records were deleted, but some storage files could not be removed.' })
  }
  return Response.json({ deleted: images.length, storageCleaned: true })
}
