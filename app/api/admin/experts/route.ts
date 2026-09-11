import { createClient } from '@supabase/supabase-js'
import { getSupabaseAdmin } from '@/lib/supabase/admin'

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
  const fullName = typeof body.fullName === 'string' ? body.fullName.trim() : ''
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  const specialty = typeof body.specialty === 'string' ? body.specialty.trim() : ''
  if (!fullName || !email || !email.includes('@')) return Response.json({ detail: 'Name and a valid email are required.' }, { status: 400 })
  const resendKey = process.env.RESEND_API_KEY
  if (!resendKey) return Response.json({ detail: 'Email service is not configured.' }, { status: 500 })

  const inviteUrl = new URL('/set-password', request.url).toString()
  const { data: linkData, error: linkError } = await access.admin.auth.admin.generateLink({
    type: 'invite', email, options: { redirectTo: inviteUrl, data: { full_name: fullName, specialty } },
  })
  if (linkError || !linkData.properties?.action_link) return Response.json({ detail: linkError?.message ?? 'Could not create an invitation link.' }, { status: 400 })

  const from = process.env.RESEND_FROM_EMAIL ?? 'NSTRU Vision <onboarding@resend.dev>'
  const emailResponse = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from, to: [email], subject: 'Invitation to NSTRU Vision expert workspace',
      html: `<main style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:32px;color:#e4e4e7;background:#09090b"><p style="margin:0 0 28px;font-weight:700;font-size:20px">NSTRU<span style="color:#a1a1aa;font-weight:400">Vision</span></p><h1 style="margin:0 0 14px;font-size:26px">Expert workspace invitation</h1><p style="color:#a1a1aa;line-height:1.6">Hello ${escapeHtml(fullName)},</p><p style="color:#d4d4d8;line-height:1.6">You have been invited to help verify snake classifications for the NSTRU Vision research system.</p><p style="margin:28px 0"><a href="${linkData.properties.action_link}" style="display:inline-block;padding:13px 20px;background:#059669;color:#fff;text-decoration:none;border-radius:8px;font-weight:600">Set your password</a></p><p style="color:#a1a1aa;line-height:1.6;font-size:13px">After setting your password, an administrator must approve your account before Workspace access is enabled.</p></main>`,
    }),
  })
  if (!emailResponse.ok) {
    const details = await emailResponse.json().catch(() => null)
    return Response.json({ detail: details?.message ?? 'Resend could not send the invitation email.' }, { status: 400 })
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
