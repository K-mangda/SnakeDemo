import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { sendSystemEmail } from '@/lib/email/gmail'

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char] ?? char))
}

export async function POST(request: Request) {
  let email = ''
  try {
    const body = await request.json()
    email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  } catch {
    return Response.json({ ok: true })
  }

  // Keep the response identical whether or not an account exists.
  if (!email || !email.includes('@')) return Response.json({ ok: true })

  const resetUrl = new URL('/set-password', request.url).toString()
  const { data, error } = await getSupabaseAdmin().auth.admin.generateLink({
    type: 'recovery',
    email,
    options: { redirectTo: resetUrl },
  })

  if (!error && data.properties?.action_link) {
    try {
      await sendSystemEmail({
        to: email,
        subject: 'Reset your NSTRU Vision password',
        html: `<main style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:32px;color:#e4e4e7;background:#09090b"><p style="margin:0 0 28px;font-weight:700;font-size:20px">NSTRU<span style="color:#a1a1aa;font-weight:400">Vision</span></p><h1 style="margin:0 0 14px;font-size:26px">Reset your password</h1><p style="color:#d4d4d8;line-height:1.6">We received a request to reset the password for ${escapeHtml(email)}.</p><p style="margin:28px 0"><a href="${data.properties.action_link}" style="display:inline-block;padding:13px 20px;background:#059669;color:#fff;text-decoration:none;border-radius:8px;font-weight:600">Reset password</a></p><p style="color:#a1a1aa;line-height:1.6;font-size:13px">This link can be used once and expires automatically. If you did not request this, you can safely ignore this email.</p></main>`,
      })
    } catch {
      // Do not reveal account details or mail transport errors on this public endpoint.
    }
  }

  return Response.json({ ok: true })
}
