'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CheckCircle2, ShieldCheck } from 'lucide-react'
import Button from '@/components/ui/Button'
import { supabase } from '@/lib/supabase/client'

function SetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [ready, setReady] = useState(false)
  const [message, setMessage] = useState('Verifying your invitation…')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function verifyInvite() {
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
  }, [searchParams])

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    if (password.length < 8) { setMessage('Use at least 8 characters.'); return }
    if (password !== confirmPassword) { setMessage('Passwords do not match.'); return }
    setSaving(true)
    const { error } = await supabase.auth.updateUser({ password })
    if (error) { setSaving(false); setMessage(error.message); return }
    const { error: activationError } = await supabase.rpc('activate_invited_expert')
    setSaving(false)
    if (activationError) { setMessage('Password was set, but Workspace access could not be enabled. Please contact an administrator.'); return }
    setMessage('Password set. Workspace access is now enabled.')
    setTimeout(() => router.replace('/login'), 1800)
  }

  return <main className="grid min-h-screen place-items-center bg-zinc-950 px-5"><section className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900/40 p-8 shadow-2xl"><div className="mb-7 flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-500/10 text-emerald-400"><ShieldCheck size={20} /></div><div><p className="font-semibold text-zinc-100">NSTRU Vision</p><p className="text-xs text-zinc-500">Expert workspace</p></div></div><h1 className="text-2xl font-medium text-zinc-100">Set your password</h1>{ready ? <form onSubmit={submit} className="mt-6 space-y-4"><label className="block text-sm text-zinc-400">New password<input type="password" value={password} onChange={event => setPassword(event.target.value)} className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-zinc-100 outline-none focus:border-emerald-500" /></label><label className="block text-sm text-zinc-400">Confirm password<input type="password" value={confirmPassword} onChange={event => setConfirmPassword(event.target.value)} className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-zinc-100 outline-none focus:border-emerald-500" /></label><Button disabled={saving} className="mt-2 w-full">{saving ? 'Saving…' : 'Set password'}</Button></form> : <p className={`mt-5 text-sm ${message.includes('invalid') || message.includes('expired') ? 'text-red-400' : 'text-zinc-400'}`}>{message}</p>}{ready && message && <p className="mt-4 flex items-center gap-2 text-sm text-emerald-400"><CheckCircle2 size={16} />{message}</p>}</section></main>
}

export default function SetPasswordPage() {
  return <Suspense fallback={<main className="grid min-h-screen place-items-center bg-zinc-950 text-sm text-zinc-500">Loading invitation…</main>}><SetPasswordForm /></Suspense>
}
