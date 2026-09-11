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
  predicted_species: { id: number; scientific_name: string; name_th: string | null; name_en: string | null }[] | null
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
  const admin = getSupabaseAdmin()

  const { data: image, error } = await admin
    .from('snake_images')
    .select('id, storage_path, original_filename, status, confidence, created_at, predicted_scientific, predicted_bbox, predicted_species:snake_species!snake_images_predicted_species_id_fkey(id, scientific_name, name_th, name_en)')
    .eq('id', id)
    .single()
  if (error || !image) return Response.json({ detail: 'Saved scan not found.' }, { status: 404 })

  const { data: signed, error: signedError } = await admin.storage.from('prediction-images').createSignedUrl((image as StoredImage).storage_path, 60 * 15)
  if (signedError || !signed?.signedUrl) return Response.json({ detail: 'Saved scan image is unavailable.' }, { status: 500 })

  const [{ data: species }, { data: existingVerification }] = await Promise.all([
    admin.from('snake_species').select('id, scientific_name, name_th, name_en').order('scientific_name'),
    admin.from('verification_history').select('voted_species_id, bbox').eq('image_id', id).eq('expert_id', access.userId).maybeSingle(),
  ])

  const stored = image as StoredImage
  const modelSpecies = stored.predicted_species?.[0] ?? null
  return Response.json({
    image: {
      id: stored.id,
      originalFilename: stored.original_filename,
      createdAt: stored.created_at,
      imageUrl: signed.signedUrl,
      status: stored.status,
      confidence: stored.confidence,
      bbox: stored.predicted_bbox,
      prediction: modelSpecies
        ? { id: modelSpecies.id, scientific: modelSpecies.scientific_name, nameTh: modelSpecies.name_th, nameEn: modelSpecies.name_en }
        : { id: null, scientific: stored.predicted_scientific ?? 'Reference pending', nameTh: null, nameEn: null },
      existingVerification,
    },
    species: species ?? [],
  })
}
