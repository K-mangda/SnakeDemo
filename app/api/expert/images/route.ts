import { getSupabaseAdmin } from '@/lib/supabase/admin'

type StoredImage = {
  id: string
  storage_path: string
  original_filename: string
  status: 'pending' | 'verified' | 'unclear' | 'waiting_for_new_class'
  confidence: number | null
  predicted_bbox: { x: number; y: number; width: number; height: number } | null
  created_at: string
  predicted_species: { scientific_name: string; name_th: string | null }[] | null
}

export async function GET(request: Request) {
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  if (!token) return Response.json({ detail: 'Sign in is required.' }, { status: 401 })

  const admin = getSupabaseAdmin()
  const { data: authData, error: authError } = await admin.auth.getUser(token)
  if (authError || !authData.user) return Response.json({ detail: 'Your session has expired.' }, { status: 401 })

  const { data: profile, error: profileError } = await admin
    .from('profiles')
    .select('role, status')
    .eq('id', authData.user.id)
    .single()

  if (profileError || !profile || profile.status !== 'active' || !['admin', 'expert'].includes(profile.role)) {
    return Response.json({ detail: 'You do not have access to this workspace.' }, { status: 403 })
  }

  const { data, error } = await admin
    .from('snake_images')
    .select('id, storage_path, original_filename, status, confidence, predicted_bbox, created_at, predicted_species:snake_species!snake_images_predicted_species_id_fkey(scientific_name, name_th)')
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) {
    console.error('Could not load expert images.', error)
    return Response.json({ detail: 'Could not load saved scans.' }, { status: 500 })
  }

  const images = await Promise.all((data as StoredImage[]).map(async (image) => {
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
      prediction: image.predicted_species?.[0]
        ? { scientific: image.predicted_species[0].scientific_name, nameTh: image.predicted_species[0].name_th }
        : { scientific: 'Reference pending', nameTh: null },
    }
  }))

  return Response.json({ images })
}
