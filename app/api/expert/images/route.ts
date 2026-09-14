import { createClient } from '@supabase/supabase-js'
import { getSupabaseAdmin } from '@/lib/supabase/admin'

type StoredImage = {
  id: string
  storage_path: string
  original_filename: string
  status: 'pending' | 'verified' | 'unclear' | 'waiting_for_new_class'
  confidence: number | null
  predicted_scientific: string | null
  predicted_bbox: { x: number; y: number; width: number; height: number } | null
  created_at: string
  predicted_species: { scientific_name: string; name_th: string | null }[] | null
}

type ReviewRow = {
  image_id: string
  expert_id: string
}

export async function GET(request: Request) {
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  if (!token) return Response.json({ detail: 'Sign in is required.' }, { status: 401 })

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  if (!url || !publishableKey) return Response.json({ detail: 'Workspace configuration is incomplete.' }, { status: 500 })

  const authClient = createClient(url, publishableKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  })
  const { data: authData, error: authError } = await authClient.auth.getUser(token)
  if (authError || !authData.user) return Response.json({ detail: 'Your session has expired.' }, { status: 401 })

  const { data: profiles, error: profileError } = await authClient.rpc('current_profile')
  const profile = profiles?.[0]

  if (profileError || !profile || profile.status !== 'active' || profile.role !== 'expert') {
    return Response.json({ detail: 'You do not have access to this workspace.' }, { status: 403 })
  }

  const admin = getSupabaseAdmin()

  const { data, error } = await admin
    .from('snake_images')
    .select('id, storage_path, original_filename, status, confidence, predicted_scientific, predicted_bbox, created_at, predicted_species:snake_species!snake_images_predicted_species_id_fkey(scientific_name, name_th)')
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) {
    console.error('Could not load expert images.', error)
    return Response.json({ detail: 'Could not load saved scans.' }, { status: 500 })
  }

  const storedImages = data as StoredImage[]
  const imageIds = storedImages.map((image) => image.id)
  const [{ count: activeExpertCount }, { data: reviewRows }] = await Promise.all([
    admin.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'expert').eq('status', 'active'),
    imageIds.length > 0
      ? admin.from('verification_history').select('image_id, expert_id').in('image_id', imageIds)
      : Promise.resolve({ data: [] as ReviewRow[] }),
  ])

  const reviewsByImage = new Map<string, Set<string>>()
  for (const review of (reviewRows ?? []) as ReviewRow[]) {
    const reviewers = reviewsByImage.get(review.image_id) ?? new Set<string>()
    reviewers.add(review.expert_id)
    reviewsByImage.set(review.image_id, reviewers)
  }
  const requiredReviews = Math.floor((activeExpertCount ?? 0) / 2) + 1

  const images = await Promise.all(storedImages.map(async (image) => {
    const { data: signed, error: signedError } = await admin.storage
      .from('prediction-images')
      .createSignedUrl(image.storage_path, 60 * 15)

    if (signedError) console.error('Could not sign saved scan image.', signedError)

    return {
      id: image.id,
      originalFilename: image.original_filename,
      imageUrl: signed?.signedUrl ?? null,
      status: image.status,
      confidence: image.confidence,
      bbox: image.predicted_bbox,
      createdAt: image.created_at,
      review: {
        count: reviewsByImage.get(image.id)?.size ?? 0,
        required: requiredReviews,
        hasReviewed: reviewsByImage.get(image.id)?.has(authData.user.id) ?? false,
      },
      prediction: image.predicted_species?.[0]
        ? { scientific: image.predicted_species[0].scientific_name, nameTh: image.predicted_species[0].name_th }
        : { scientific: image.predicted_scientific ?? 'Reference pending', nameTh: null },
    }
  }))

  return Response.json({ images })
}
