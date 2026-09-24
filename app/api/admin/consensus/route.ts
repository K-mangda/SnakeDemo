import { createClient } from '@supabase/supabase-js'
import { getSupabaseAdmin } from '@/lib/supabase/admin'

type Box = { x: number; y: number; width: number; height: number }
type HistoryRow = { image_id: string; expert_id: string; voted_species_id: number | null; bbox: Box | null; created_at: string }

function iou(left: Box | null, right: Box | null) {
  if (!left || !right) return null
  const x1 = Math.max(left.x, right.x)
  const y1 = Math.max(left.y, right.y)
  const x2 = Math.min(left.x + left.width, right.x + right.width)
  const y2 = Math.min(left.y + left.height, right.y + right.height)
  const intersection = Math.max(0, x2 - x1) * Math.max(0, y2 - y1)
  const union = left.width * left.height + right.width * right.height - intersection
  return union > 0 ? intersection / union : null
}

async function requireAdmin(request: Request) {
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  if (!token) return { error: 'Sign in is required.', status: 401 as const }
  if (!url || !key) return { error: 'Admin configuration is incomplete.', status: 500 as const }

  const client = createClient(url, key, { global: { headers: { Authorization: `Bearer ${token}` } } })
  const { data, error } = await client.auth.getUser(token)
  if (error || !data.user) return { error: 'Your session has expired.', status: 401 as const }
  const { data: profiles } = await client.rpc('current_profile')
  const profile = profiles?.[0]
  if (!profile || profile.role !== 'admin' || profile.status !== 'active') return { error: 'Administrator access is required.', status: 403 as const }
  return { admin: getSupabaseAdmin() }
}

function pendingReason(status: string, reviews: HistoryRow[]) {
  if (status === 'verified') return reviews.length === 1 ? 'First expert review accepted.' : 'Consensus reached from matching reviews.'
  if (status === 'unclear') return 'All submitted reviews marked this image unclear.'
  if (status === 'waiting_for_new_class') return 'An expert requested a new reference class.'
  if (reviews.length < 2) return 'Awaiting another independent review.'

  const votes = new Map<number, number>()
  reviews.forEach((review) => {
    if (review.voted_species_id !== null) votes.set(review.voted_species_id, (votes.get(review.voted_species_id) ?? 0) + 1)
  })
  const ranked = [...votes.entries()].sort((left, right) => right[1] - left[1])
  if (!ranked.length) return 'Reviews are unclear and need follow-up.'
  if (ranked.length > 1 && ranked[0][1] === ranked[1][1]) return 'Species votes are tied.'
  if (ranked[0][1] <= reviews.length / 2) return 'No species has a strict majority.'

  const leadingBoxes = reviews.filter((review) => review.voted_species_id === ranked[0][0]).map((review) => review.bbox)
  if (leadingBoxes.length > 1 && !leadingBoxes.some((box, index) => leadingBoxes.slice(index + 1).some((other) => (iou(box, other) ?? 0) >= 0.5))) {
    return 'Leading boxes overlap by less than 50% IoU.'
  }
  return 'Awaiting another independent review.'
}

export async function GET(request: Request) {
  const access = await requireAdmin(request)
  if ('error' in access) return Response.json({ detail: access.error }, { status: access.status })

  const { data: history, error: historyError } = await access.admin
    .from('verification_history')
    .select('image_id, expert_id, voted_species_id, bbox, created_at')
    .order('created_at', { ascending: false })
    .limit(300)
  if (historyError) return Response.json({ detail: 'Could not load review history.' }, { status: 500 })

  const imageIds = [...new Set((history ?? []).map((item) => item.image_id))].slice(0, 40)
  if (!imageIds.length) return Response.json({ items: [] })

  const [{ data: images, error: imageError }, { data: profiles }, { data: species }] = await Promise.all([
    access.admin.from('snake_images').select('id, storage_path, original_filename, status, updated_at, final_species_id, final_bbox').in('id', imageIds),
    access.admin.from('profiles').select('id, full_name'),
    access.admin.from('snake_species').select('id, scientific_name'),
  ])
  if (imageError) return Response.json({ detail: 'Could not load reviewed images.' }, { status: 500 })

  const imageUrlById = new Map(await Promise.all((images ?? []).map(async (image) => {
    const { data } = await access.admin.storage.from('prediction-images').createSignedUrl(image.storage_path, 60 * 15)
    return [image.id, data?.signedUrl ?? null] as const
  })))

  const nameByExpert = new Map((profiles ?? []).map((profile) => [profile.id, profile.full_name || 'Expert reviewer']))
  const speciesById = new Map((species ?? []).map((item) => [item.id, item.scientific_name]))
  const reviewsByImage = new Map<string, HistoryRow[]>()
  ;(history as HistoryRow[] ?? []).forEach((review) => {
    const reviews = reviewsByImage.get(review.image_id) ?? []
    reviews.push(review)
    reviewsByImage.set(review.image_id, reviews)
  })

  const items = (images ?? [])
    .map((image) => {
      const reviews = (reviewsByImage.get(image.id) ?? []).sort((left, right) => left.created_at.localeCompare(right.created_at))
      const pairs = reviews.flatMap((review, index) => reviews.slice(index + 1).map((other) => ({
        leftExpert: nameByExpert.get(review.expert_id) ?? 'Expert reviewer',
        rightExpert: nameByExpert.get(other.expert_id) ?? 'Expert reviewer',
        value: iou(review.bbox, other.bbox),
      })))
      return {
        id: image.id,
        imageUrl: imageUrlById.get(image.id) ?? null,
        filename: image.original_filename,
        status: image.status,
        updatedAt: image.updated_at,
        finalSpecies: image.final_species_id === null ? null : speciesById.get(image.final_species_id) ?? 'Unknown species',
        finalBox: image.final_bbox,
        reason: pendingReason(image.status, reviews),
        reviews: reviews.map((review) => ({
          expert: nameByExpert.get(review.expert_id) ?? 'Expert reviewer',
          species: review.voted_species_id === null ? null : speciesById.get(review.voted_species_id) ?? 'Unknown species',
          bbox: review.bbox,
          createdAt: review.created_at,
        })),
        pairs,
      }
    })
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))

  return Response.json({ items })
}
