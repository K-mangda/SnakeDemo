'use client'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import Button from '@/components/ui/Button'
import { Eye, EyeOff, Lock, LogIn } from 'lucide-react'
import { useToast } from '@/components/ui/Toast'
import { supabase } from '@/lib/supabase/client'
import AuthShell from '@/components/auth/AuthShell'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const { showToast } = useToast()

  const [loading, setLoading] = useState(false)
  const [setupOpen, setSetupOpen] = useState(false)
  const [resetOpen, setResetOpen] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [resetSending, setResetSending] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    async function checkInitialAdmin() {
      const { data } = await supabase.rpc('initial_admin_exists')
      setSetupOpen(data === false)
    }
    checkInitialAdmin()
  }, [])

  useEffect(() => {
    let active = true

    async function continueExistingSession() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session || !active) return

      const { data: profiles } = await supabase.rpc('current_profile')
      const profile = profiles?.[0]

      if (active && profile?.status === 'active') {
        router.replace(profile.role === 'admin' ? '/admin' : '/expert')
      }
    }

    continueExistingSession()
    return () => { active = false }
  }, [router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error || !data.user) {
      showToast(error?.message ?? 'Unable to sign in')
      setLoading(false)
      return
    }
    const { data: profiles, error: profileError } = await supabase.rpc('current_profile')
    const profile = profiles?.[0]
    setLoading(false)
    if (profileError || !profile) {
      showToast('This account has not been assigned access. Contact an administrator.')
      await supabase.auth.signOut()
      return
    }
    if (profile.status !== 'active') {
      showToast('This account is not active')
      await supabase.auth.signOut()
      return
    }
    showToast('Signed in successfully')
    router.push(profile.role === 'admin' ? '/admin' : '/expert')
  }

  const requestPasswordReset = async (event: React.FormEvent) => {
    event.preventDefault()
    setResetSending(true)
    try {
      const response = await fetch('/api/auth/password-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail }),
      })
      if (!response.ok) throw new Error('Unable to send a reset link right now.')
      showToast('If this email has an account, a reset link has been sent. Check Gmail and Spam.')
      setResetOpen(false)
      setResetEmail('')
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Unable to send a reset link right now.')
    } finally {
      setResetSending(false)
    }
  }

  return (
    <AuthShell label="" title="" description="">
      {resetOpen ? <>
        <button type="button" onClick={() => setResetOpen(false)} className="mb-6 text-xs font-medium text-zinc-500 transition hover:text-zinc-200">← Back to sign in</button>
        <div className="mb-6"><h1 className="text-xl font-semibold tracking-tight text-zinc-100">Reset your password</h1><p className="mt-2 text-sm leading-6 text-zinc-500">Enter your account email and we&apos;ll send a secure reset link through Gmail.</p></div>
        <form onSubmit={requestPasswordReset} className="space-y-5">
          <div><label className="mb-2 block text-xs font-medium text-zinc-400">Email</label><input type="email" required autoFocus autoComplete="email" value={resetEmail} onChange={event => setResetEmail(event.target.value)} placeholder="name@example.com" className="w-full rounded-xl border border-white/[0.09] bg-white/[0.04] px-4 py-3 text-sm text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:border-emerald-400/70 focus:bg-emerald-400/[0.04]" /></div>
          <Button className="w-full !rounded-xl !py-3.5" size="lg" disabled={resetSending}>{resetSending ? 'Sending link…' : 'Send reset link'}</Button>
        </form>
      </> : <>
        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="mb-2 block text-xs font-medium text-zinc-400">Email</label>
            <input 
              type="email" 
              required
              autoComplete="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="w-full rounded-xl border border-white/[0.09] bg-white/[0.04] px-4 py-3 text-sm text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:border-emerald-400/70 focus:bg-emerald-400/[0.04]"
            />
          </div>
          <div>
            <label className="mb-2 block text-xs font-medium text-zinc-400">Password</label>
            <div className="relative">
              <input 
                type={showPassword ? 'text' : 'password'} 
                required
                autoComplete="current-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full rounded-xl border border-white/[0.09] bg-white/[0.04] px-4 py-3 pr-12 text-sm text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:border-emerald-400/70 focus:bg-emerald-400/[0.04]"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Hide password' : 'Show password'} className="absolute inset-y-0 right-0 grid w-12 place-items-center text-zinc-500 transition hover:text-zinc-300">{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button>
            </div>
          </div>
          <Button className="w-full !rounded-xl !py-3.5" size="lg" disabled={loading}>
            {loading ? 'Checking access...' : <>Sign in <LogIn size={17} /></>}
          </Button>
        </form>

        <div className="mt-4 text-right">
          <button type="button" onClick={() => setResetOpen(true)} className="text-xs font-medium text-emerald-400 transition hover:text-emerald-300">
            Forgot password?
          </button>
        </div>
      </>}

        <div className="mt-7 flex items-center gap-3 border-t border-white/[0.07] pt-5 text-xs text-zinc-500">
          <Lock size={13} className="shrink-0 text-emerald-400" />
          <span>Secure role-based access.</span>
        </div>
        {setupOpen && <p className="mt-4 text-center text-xs text-zinc-500">First-time setup? <Link href="/setup" className="font-medium text-emerald-400 hover:text-emerald-300">Create administrator access</Link></p>}
    </AuthShell>
  )
}
