'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, ShieldCheck, UserPlus } from 'lucide-react'
import Button from '@/components/ui/Button'
import { supabase } from '@/lib/supabase/client'
import AuthShell from '@/components/auth/AuthShell'

export default function SetupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [setupClosed, setSetupClosed] = useState<boolean | null>(null)
  const [errors, setErrors] = useState<{ fullName?: string; email?: string; password?: string }>({})

  useEffect(() => {
    async function checkInitialAdmin() {
      const { data } = await supabase.rpc('initial_admin_exists')
      setSetupClosed(data === true)
    }
    checkInitialAdmin()
  }, [])

  function validate() {
    const nextErrors: { fullName?: string; email?: string; password?: string } = {}
    if (fullName.trim().length < 2) nextErrors.fullName = 'Enter at least 2 characters'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) nextErrors.email = 'Enter a complete email address, such as name@example.com'
    if (password.length < 12 || !/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/\d/.test(password)) {
      nextErrors.password = 'Use 12+ characters with lowercase, uppercase, and a number'
    }
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!validate()) return
    setLoading(true)
    setMessage('')
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    })
    setLoading(false)
    setMessage(error ? error.message : 'Administrator account created. Confirm your email, then return here to sign in.')
  }

  if (setupClosed === null) {
    return <main className="min-h-screen grid place-items-center bg-[#07090c] text-sm text-zinc-400">Checking system setup...</main>
  }

  if (setupClosed) {
    return (
      <AuthShell label="Workspace initialized" title="Setup complete" description="The first administrator account has been configured. Continue with secure sign-in.">
        <div className="py-3 text-center">
          <ShieldCheck className="mx-auto mb-4 text-emerald-400" size={30} />
          <Button href="/login" className="w-full !rounded-xl !py-3.5">Continue to sign in <ArrowRight size={17} /></Button>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell label="First-time setup" title="Initialize workspace" description="Create the first administrator account. This setup is available once only.">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="mb-2 block text-xs font-medium text-zinc-400">Full name</label>
            <input required autoComplete="name" placeholder="Your full name" value={fullName} onChange={(event) => setFullName(event.target.value)} className="w-full rounded-xl border border-white/[0.09] bg-white/[0.04] px-4 py-3 text-sm text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:border-emerald-400/70 focus:bg-emerald-400/[0.04]" />
            {errors.fullName && <p className="mt-1 text-xs text-red-400">{errors.fullName}</p>}
          </div>
          <div>
            <label className="mb-2 block text-xs font-medium text-zinc-400">Email address</label>
            <input required type="email" autoComplete="email" placeholder="name@example.com" value={email} onChange={(event) => setEmail(event.target.value)} className="w-full rounded-xl border border-white/[0.09] bg-white/[0.04] px-4 py-3 text-sm text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:border-emerald-400/70 focus:bg-emerald-400/[0.04]" />
            {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email}</p>}
          </div>
          <div>
            <label className="mb-2 block text-xs font-medium text-zinc-400">Password</label>
            <input required minLength={12} type="password" autoComplete="new-password" placeholder="12+ characters" value={password} onChange={(event) => setPassword(event.target.value)} className="w-full rounded-xl border border-white/[0.09] bg-white/[0.04] px-4 py-3 text-sm text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:border-emerald-400/70 focus:bg-emerald-400/[0.04]" />
            {errors.password && <p className="mt-1 text-xs text-red-400">{errors.password}</p>}
          </div>
          <Button className="w-full !rounded-xl !py-3.5" size="lg" disabled={loading}>{loading ? 'Creating account...' : <><UserPlus size={17} /> Create administrator account</>}</Button>
        </form>
        {message && <p className="mt-4 text-sm text-amber-300">{message}</p>}
        <p className="mt-6 border-t border-white/[0.07] pt-5 text-center text-xs text-zinc-500">Already have access? <Link href="/login" className="font-medium text-emerald-400 hover:text-emerald-300">Sign in</Link></p>
    </AuthShell>
  )
}
