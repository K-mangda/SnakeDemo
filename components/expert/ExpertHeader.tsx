'use client'

import { useEffect, useState } from 'react'
import { ShieldCheck, User } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'

type Profile = { full_name: string; role: 'admin' | 'expert'; specialty: string | null }

export default function ExpertHeader() {
  const [profile, setProfile] = useState<Profile | null>(null)

  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('profiles')
        .select('full_name, role, specialty')
        .eq('id', user.id)
        .single()
      if (data) setProfile(data as Profile)
    }
    loadProfile()
  }, [])

  const roleLabel = profile?.role === 'admin' ? 'Administrator' : 'Expert reviewer'

  return (
    <header className="mb-8 border-b border-zinc-900 pb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-6">
      <div>
        <h1 className="text-3xl font-medium text-zinc-100 mb-2">Expert Workspace</h1>
        <p className="text-zinc-500 font-light">Human-in-the-loop verification pipeline.</p>
      </div>
      <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-zinc-900/35 border border-zinc-800/60 text-left">
        <div className="flex flex-col items-end">
          <span className="text-sm font-medium text-zinc-200">
            {profile?.full_name || 'Signed-in reviewer'}
          </span>
          <span className="mt-0.5 text-[11px] text-zinc-500">{profile?.specialty || roleLabel}</span>
        </div>
        <div className="w-10 h-10 rounded-full border border-emerald-500/30 bg-emerald-500/10 flex items-center justify-center">
          {profile?.role === 'admin' ? <ShieldCheck size={17} className="text-emerald-400" /> : <User size={17} className="text-emerald-400" />}
          </div>
      </div>
    </header>
  )
}
