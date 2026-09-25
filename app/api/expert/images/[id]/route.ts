import { createClient } from '@supabase/supabase-js'
import { getSupabaseAdmin } from '@/lib/supabase/admin'

type StoredImage = {
  id: string
  storage_path: string
  original_filename: string
  status: string
  confidence: number | null
  created_at: string
  predicted_scientific: string | null
  predicted_bbox: { x: number; y: number; width: number; height: number } | null
  final_bbox: { x: number; y: number; width: number; height: number } | null
  predicted_species: SpeciesRelation
  final_species: SpeciesRelation
}

type SpeciesRelation = { id: number; scientific_name: string; name_th: string | null; name_en: string | null } | { id: number; scientific_name: string; name_th: string | null; name_en: string | null }[] | null

type ReviewHistoryRow = {
  expert_id: string
  voted_species_id: number | null
  created_at: string
}

function firstSpecies(relation: SpeciesRelation) {
  return Array.isArray(relation) ? relation[0] ?? null : relation
}

function normalizeScientificName(value: string) {
  return value.normalize('NFC').trim().replace(/\s+/g, ' ').toLocaleLowerCase()
}

async function requireExpert(token: string | undefined) {
  if (!token) return { error: 'Sign in is required.', status: 401 as const }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  if (!url || !publishableKey) return { error: 'Workspace configuration is incomplete.', status: 500 as const }

  const client = createClient(url, publishableKey, { global: { headers: { Authorization: `Bearer ${token}` } } })
  const { data: authData, error: authError } = await client.auth.getUser(token)
  if (authError || !authData.user) return { error: 'Your session has expired.', status: 401 as const }

  const { data: profiles } = await client.rpc('current_profile')
  const profile = profiles?.[0]
  if (!profile || profile.role !== 'expert' || profile.status !== 'active') {
    return { error: 'You do not have access to this workspace.', status: 403 as const }
  }
  return { userId: authData.user.id }
}

export async function GET(request: Request, context: RouteContext<'/api/expert/images/[id]'>) {
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  const access = await requireExpert(token)
  if ('error' in access) return Response.json({ detail: access.error }, { status: access.status })
  const { id } = await context.params
  const requestedQueueFilter = new URL(request.url).searchParams.get('queue_filter')
  const queueFilter = ['all', 'pending', 'verified', 'unclear', 'waiting_for_new_class'].includes(requestedQueueFilter ?? '')
    ? requestedQueueFilter!
    : 'pending'
  const admin = getSupabaseAdmin()

  const { data: image, error } = await admin
    .from('snake_images')
    .select('id, storage_path, original_filename, status, confidence, created_at, predicted_scientific, predicted_bbox, final_bbox, predicted_species:snake_species!snake_images_predicted_species_id_fkey(id, scientific_name, name_th, name_en), final_species:snake_species!snake_images_final_species_id_fkey(id, scientific_name, name_th, name_en)')
    .eq('id', id)
    .single()
  if (error || !image) return Response.json({ detail: 'Saved scan not found.' }, { status: 404 })

  const { data: signed, error: signedError } = await admin.storage.from('prediction-images').createSignedUrl((image as StoredImage).storage_path, 60 * 15)
  if (signedError || !signed?.signedUrl) return Response.json({ detail: 'Saved scan image is unavailable.' }, { status: 500 })
  const stored = image as StoredImage

  let queueQuery = admin.from('snake_images').select('id').order('confidence', { ascending: true, nullsFirst: true }).limit(200)
  if (queueFilter !== 'all') queueQuery = queueQuery.eq('status', queueFilter)

  const [{ data: species }, { data: existingVerification }, { data: reviewRows }, { data: queueRows }] = await Promise.all([
    admin.from('snake_species').select('id, scientific_name, name_th, name_en').order('scientific_name'),
    admin.from('verification_history').select('voted_species_id, bbox').eq('image_id', id).eq('expert_id', access.userId).maybeSingle(),
    admin.from('verification_history').select('expert_id, voted_species_id, created_at').eq('image_id', id).order('created_at'),
    queueQuery,
  ])

  const queueIds = (queueRows ?? []).map((item) => item.id)

  const history = (reviewRows ?? []) as ReviewHistoryRow[]
  const reviewerIds = [...new Set(history.map((review) => review.expert_id))]
  const { data: reviewerProfiles } = existingVerification && reviewerIds.length
    ? await admin.from('profiles').select('id, full_name').in('id', reviewerIds)
    : { data: [] as { id: string; full_name: string }[] }
  const speciesById = new Map((species ?? []).map((item) => [item.id, item]))
  const reviewerNameById = new Map((reviewerProfiles ?? []).map((profile) => [profile.id, profile.full_name]))

  // Older scans can have the AI scientific name but no foreign-key reference.
  // Resolve against the current catalogue so the reviewer gets the AI choice
  // preselected without changing the stored historical prediction.
  const predictedScientific = stored.predicted_scientific
  const modelSpecies = firstSpecies(stored.predicted_species)
    ?? (predictedScientific
      ? (species ?? []).find((item) => normalizeScientificName(item.scientific_name) === normalizeScientificName(predictedScientific)) ?? null
      : null)
  // Do not show an old placeholder/stale box unless the model actually
  // supplied both a label and a confidence value for this image.
  const hasAiPrediction = stored.predicted_scientific !== null && stored.confidence !== null
  const finalSpecies = firstSpecies(stored.final_species)
  return Response.json({
    image: {
      id: stored.id,
      originalFilename: stored.original_filename,
      createdAt: stored.created_at,
      imageUrl: signed.signedUrl,
      status: stored.status,
      confidence: stored.confidence,
      bbox: stored.final_bbox ?? (hasAiPrediction ? stored.predicted_bbox : null),
      prediction: modelSpecies
        ? { id: modelSpecies.id, scientific: modelSpecies.scientific_name, nameTh: modelSpecies.name_th, nameEn: modelSpecies.name_en }
        : { id: null, scientific: stored.predicted_scientific ?? 'Reference pending', nameTh: null, nameEn: null },
      existingVerification,
      // Consensus is visible only after the current Expert has submitted a
      // review, keeping the independent-review workflow free from bias.
      consensus: existingVerification && stored.status === 'verified' && finalSpecies && stored.final_bbox
        ? { scientific: finalSpecies.scientific_name, bbox: stored.final_bbox, reviewCount: reviewerIds.length }
        : null,
      // Keep reviews independent: another Expert's decision is returned only
      // after this viewer has submitted their own review.
      reviewHistory: existingVerification ? history.map((review) => ({
        reviewer: review.expert_id === access.userId ? 'You' : reviewerNameById.get(review.expert_id) || 'Expert reviewer',
        species: review.voted_species_id === null ? null : speciesById.get(review.voted_species_id)?.scientific_name ?? 'Unknown species',
        createdAt: review.created_at,
      })) : [],
    },
    species: species ?? [],
    queueIds,
  })
}
