import { createClient } from '@supabase/supabase-js'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { sendSystemEmail } from '@/lib/email/gmail'

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char] ?? char))
}

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

export async function GET(request: Request) {
  const access = await requireAdmin(request)
  if ('error' in access) return Response.json({ detail: access.error }, { status: access.status })
  const [{ data: profiles, error }, { data: verifications }] = await Promise.all([
    access.admin.from('profiles').select('id, full_name, specialty, status, created_at').eq('role', 'expert').order('created_at', { ascending: false }),
    access.admin.from('verification_history').select('expert_id'),
  ])
  if (error) return Response.json({ detail: 'Could not load expert accounts.' }, { status: 500 })
  const counts = new Map<string, number>()
  verifications?.forEach(item => counts.set(item.expert_id, (counts.get(item.expert_id) ?? 0) + 1))
  return Response.json({ experts: profiles?.map(profile => ({ ...profile, verificationCount: counts.get(profile.id) ?? 0 })) ?? [] })
}

export async function POST(request: Request) {
  const access = await requireAdmin(request)
  if ('error' in access) return Response.json({ detail: access.error }, { status: access.status })
  const body = await request.json()
  let fullName = typeof body.fullName === 'string' ? body.fullName.trim() : ''
  let email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  let specialty = typeof body.specialty === 'string' ? body.specialty.trim() : ''
  const inviteUrl = new URL('/set-password', request.url).toString()
  let linkData: Awaited<ReturnType<typeof access.admin.auth.admin.generateLink>>['data']
  let linkError: Error | null = null

  if (typeof body.expertId === 'string') {
    const [{ data: expert }, { data: authUser, error: authError }] = await Promise.all([
      access.admin.from('profiles').select('full_name, specialty, status').eq('id', body.expertId).eq('role', 'expert').single(),
      access.admin.auth.admin.getUserById(body.expertId),
    ])
    if (!expert || expert.status !== 'pending' || authError || !authUser.user?.email) return Response.json({ detail: 'This pending account could not be found.' }, { status: 404 })
    fullName = expert.full_name
    specialty = expert.specialty ?? ''
    email = authUser.user.email
    const recovery = await access.admin.auth.admin.generateLink({ type: 'recovery', email, options: { redirectTo: inviteUrl } })
    linkData = recovery.data
    linkError = recovery.error
  } else {
    if (!fullName || !email || !email.includes('@')) return Response.json({ detail: 'Name and a valid email are required.' }, { status: 400 })
    const invitation = await access.admin.auth.admin.generateLink({
      type: 'invite', email, options: { redirectTo: inviteUrl, data: { full_name: fullName, specialty } },
    })
    linkData = invitation.data
    linkError = invitation.error
    if (linkError) {
      const recovery = await access.admin.auth.admin.generateLink({ type: 'recovery', email, options: { redirectTo: inviteUrl } })
      linkData = recovery.data
      linkError = recovery.error
    }
  }
  if (linkError || !linkData.properties?.action_link) return Response.json({ detail: linkError?.message ?? 'Could not create an invitation link.' }, { status: 400 })
  if (linkData.user?.id && typeof body.expertId !== 'string') {
    const { error: profileError } = await access.admin
      .from('profiles')
      .update({ full_name: fullName, specialty })
      .eq('id', linkData.user.id)
      .eq('role', 'expert')
    if (profileError) return Response.json({ detail: 'The invitation was created, but the expert profile could not be saved.' }, { status: 500 })
  }

  try {
    await sendSystemEmail({
      to: email, subject: 'Invitation to NSTRU Vision expert workspace',
      html: `<main style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:32px;color:#e4e4e7;background:#09090b"><p style="margin:0 0 28px;font-weight:700;font-size:20px">NSTRU<span style="color:#a1a1aa;font-weight:400">Vision</span></p><h1 style="margin:0 0 14px;font-size:26px">Expert workspace invitation</h1><p style="color:#a1a1aa;line-height:1.6">Hello ${escapeHtml(fullName)},</p><p style="color:#d4d4d8;line-height:1.6">You have been invited to help verify snake classifications for the NSTRU Vision research system.</p><p style="margin:28px 0"><a href="${linkData.properties.action_link}" style="display:inline-block;padding:13px 20px;background:#059669;color:#fff;text-decoration:none;border-radius:8px;font-weight:600">Set your password</a></p><p style="color:#a1a1aa;line-height:1.6;font-size:13px">This link can be used once and expires automatically. After setting your password, Workspace access will be enabled automatically.</p></main>`,
    })
  } catch (error) {
    return Response.json({ detail: error instanceof Error ? error.message : 'Gmail could not send the invitation email.' }, { status: 400 })
  }
  return Response.json({ ok: true })
}

export async function PATCH(request: Request) {
  const access = await requireAdmin(request)
  if ('error' in access) return Response.json({ detail: access.error }, { status: access.status })
  const body = await request.json()
  if (typeof body.id !== 'string') return Response.json({ detail: 'Expert account is required.' }, { status: 400 })
  const update = {
    full_name: typeof body.fullName === 'string' ? body.fullName.trim() : undefined,
    specialty: typeof body.specialty === 'string' ? body.specialty.trim() : undefined,
    status: ['active', 'inactive', 'pending'].includes(body.status) ? body.status : undefined,
  }
  const { error } = await access.admin.from('profiles').update(update).eq('id', body.id).eq('role', 'expert')
  if (error) return Response.json({ detail: error.message }, { status: 400 })
  return Response.json({ ok: true })
}

export async function DELETE(request: Request) {
  const access = await requireAdmin(request)
  if ('error' in access) return Response.json({ detail: access.error }, { status: access.status })
  const body = await request.json()
  if (typeof body.id !== 'string') return Response.json({ detail: 'Expert account is required.' }, { status: 400 })
  const [{ data: expert }, { count, error: verificationError }] = await Promise.all([
    access.admin.from('profiles').select('id').eq('id', body.id).eq('role', 'expert').single(),
    access.admin.from('verification_history').select('*', { count: 'exact', head: true }).eq('expert_id', body.id),
  ])
  if (!expert) return Response.json({ detail: 'Expert account was not found.' }, { status: 404 })
  if (verificationError) return Response.json({ detail: 'Could not check the verification history.' }, { status: 500 })
  if ((count ?? 0) > 0) return Response.json({ detail: 'Accounts with verification history cannot be removed. Suspend access instead.' }, { status: 409 })
  const { error } = await access.admin.auth.admin.deleteUser(body.id)
  if (error) return Response.json({ detail: error.message }, { status: 400 })
  return Response.json({ ok: true })
}
