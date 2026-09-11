'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { KeyRound, ShieldCheck } from 'lucide-react'
import Button from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'
import { supabase } from '@/lib/supabase/client'

export default function AccountPage() {
  const router = useRouter()
  const { showToast } = useToast()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function loadAccount() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace('/login'); return }
      setEmail(user.email ?? '')
    }
    loadAccount()
  }, [router])

  async function changePassword(event: React.FormEvent) {
    event.preventDefault()
    if (password.length < 8) { showToast('Use at least 8 characters.'); return }
    if (password !== confirmPassword) { showToast('Passwords do not match.'); return }
    setSaving(true)
    const { error } = await supabase.auth.updateUser({ password })
    setSaving(false)
    if (error) { showToast(error.message); return }
    setPassword('')
    setConfirmPassword('')
    showToast('Password updated.')
  }

  return <main className="mx-auto min-h-screen max-w-xl px-5 pb-16 pt-32 sm:px-8">
    <div className="border-b border-white/[0.08] pb-7">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-400">Account</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-100">Account settings</h1>
      <p className="mt-2 text-sm text-zinc-500">Manage your own sign-in password.</p>
    </div>
    <section className="mt-7 rounded-2xl border border-white/[0.09] bg-zinc-900/35 p-5 sm:p-6">
      <div className="flex items-start gap-3"><div className="rounded-xl bg-emerald-500/10 p-2.5 text-emerald-400"><KeyRound size={19} /></div><div><h2 className="font-medium text-zinc-100">Change password</h2><p className="mt-1 text-sm text-zinc-500">Signed in as {email || 'your account'}</p></div></div>
      <form onSubmit={changePassword} className="mt-6 space-y-4">
        <label className="block text-xs font-medium text-zinc-400">New password<input type="password" required autoComplete="new-password" value={password} onChange={event => setPassword(event.target.value)} className="mt-2 w-full rounded-xl border border-white/[0.09] bg-zinc-950/70 px-4 py-3 text-sm text-zinc-100 outline-none transition focus:border-emerald-400/70" /></label>
        <label className="block text-xs font-medium text-zinc-400">Confirm new password<input type="password" required autoComplete="new-password" value={confirmPassword} onChange={event => setConfirmPassword(event.target.value)} className="mt-2 w-full rounded-xl border border-white/[0.09] bg-zinc-950/70 px-4 py-3 text-sm text-zinc-100 outline-none transition focus:border-emerald-400/70" /></label>
        <p className="text-xs text-zinc-500">Use at least 8 characters.</p>
        <Button disabled={saving} className="w-full sm:w-auto">{saving ? 'Updating…' : 'Update password'}</Button>
      </form>
    </section>
    <div className="mt-5 flex items-center gap-2 text-xs text-zinc-500"><ShieldCheck size={14} className="text-emerald-400" />Only you can change your password while signed in.</div>
  </main>
}
