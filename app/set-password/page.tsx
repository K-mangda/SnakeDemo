'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CheckCircle2, Eye, EyeOff } from 'lucide-react'
import Button from '@/components/ui/Button'
import { supabase } from '@/lib/supabase/client'
import AuthShell from '@/components/auth/AuthShell'

function SetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [ready, setReady] = useState(false)
  const [message, setMessage] = useState('Verifying your invitation…')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [completed, setCompleted] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const preview = searchParams.get('preview') === '1'
  const charactersRemaining = Math.max(0, 8 - password.length)
  const invitationInvalid = !ready && /invalid|expired/i.test(message)

  useEffect(() => {
    async function verifyInvite() {
      if (preview) { setReady(true); setMessage(''); return }
      const tokenHash = searchParams.get('token_hash')
      const type = searchParams.get('type')
      const code = searchParams.get('code')
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (error) { setMessage(error.message); return }
        setReady(true); setMessage(''); return
      }
      if (tokenHash && (type === 'invite' || type === 'recovery')) {
        const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type })
        if (error) { setMessage(error.message); return }
        setReady(true); setMessage(''); return
      }
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { setMessage('This invitation link is invalid or has expired.'); return }
      setReady(true); setMessage('')
    }
    verifyInvite()
  }, [preview, searchParams])

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    if (saving || completed) return
    if (preview) { setMessage('Preview mode only — no password was changed.'); return }
    if (password.length < 8) { setMessage('Use at least 8 characters.'); return }
    if (password !== confirmPassword) { setMessage('Passwords do not match.'); return }
    setSaving(true)
    const { error } = await supabase.auth.updateUser({ password })
    if (error) { setSaving(false); setMessage(error.message); return }
    setCompleted(true)
    const { error: activationError } = await supabase.rpc('activate_invited_expert')
    await supabase.auth.signOut({ scope: 'local' })
    setSaving(false)
    if (activationError) { setMessage('Password was set, but Workspace access could not be enabled. Please contact an administrator.'); return }
    setMessage('Password updated. You can now sign in.')
    setTimeout(() => router.replace('/login'), 1800)
  }

  return (
    <AuthShell label="" title="" description="">
      <div className="mb-7 text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">
          {invitationInvalid ? 'Invitation link expired' : 'Set your password'}
        </h1>
      </div>

      {invitationInvalid ? (
        <div className="space-y-5 text-center">
          <p className="text-sm leading-6 text-red-400">
            This invitation link has expired or has already been used. Ask an administrator to send you a new invitation link.
          </p>
          <Button href="/login" className="w-full !rounded-xl !py-3.5" size="lg">Back to sign in</Button>
        </div>
      ) : (
        <>
          {preview && <p className="mb-5 rounded-xl border border-sky-500/20 bg-sky-500/10 px-3 py-2.5 text-xs text-sky-300">Preview mode — no password will be changed.</p>}
          {ready && !completed ? <form onSubmit={submit} className="space-y-5"><label className="block text-xs font-medium text-zinc-400">New password<div className="relative mt-2"><input type={showPassword ? 'text' : 'password'} value={password} onChange={event => setPassword(event.target.value)} placeholder="Create a new password" className="w-full rounded-xl border border-white/[0.09] bg-white/[0.04] px-4 py-3 pr-12 text-sm text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:border-emerald-400/70 focus:bg-emerald-400/[0.04]" /><button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Hide password' : 'Show password'} className="absolute inset-y-0 right-0 grid w-12 place-items-center text-zinc-500 hover:text-zinc-300">{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div><span className={`mt-1.5 block text-xs font-normal transition-colors ${charactersRemaining === 0 ? 'text-emerald-400' : 'text-zinc-500'}`}>{charactersRemaining === 0 ? 'Password length looks good' : `${charactersRemaining} character${charactersRemaining === 1 ? '' : 's'} remaining`}</span></label><label className="block text-xs font-medium text-zinc-400">Confirm password<div className="relative mt-2"><input type={showConfirmation ? 'text' : 'password'} value={confirmPassword} onChange={event => setConfirmPassword(event.target.value)} placeholder="Repeat your new password" className="w-full rounded-xl border border-white/[0.09] bg-white/[0.04] px-4 py-3 pr-12 text-sm text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:border-emerald-400/70 focus:bg-emerald-400/[0.04]" /><button type="button" onClick={() => setShowConfirmation(!showConfirmation)} aria-label={showConfirmation ? 'Hide password' : 'Show password'} className="absolute inset-y-0 right-0 grid w-12 place-items-center text-zinc-500 hover:text-zinc-300">{showConfirmation ? <EyeOff size={17} /> : <Eye size={17} />}</button></div></label><Button disabled={saving} className="w-full !rounded-xl !py-3.5" size="lg">{saving ? 'Saving…' : preview ? 'Preview only' : 'Set password'}</Button></form> : !completed ? <p className="text-sm text-zinc-400">{message}</p> : null}
          {ready && completed && message && <p className="mt-5 flex items-center gap-2 text-sm text-emerald-400"><CheckCircle2 size={16} />{message}</p>}
        </>
      )}
    </AuthShell>
  )
}

export default function SetPasswordPage() {
  return <Suspense fallback={<main className="grid min-h-screen place-items-center bg-zinc-950 text-sm text-zinc-500">Loading invitation…</main>}><SetPasswordForm /></Suspense>
}
