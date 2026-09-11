'use client'

import { useEffect, useState } from 'react'
import { ShieldCheck } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'

type Profile = { full_name: string; role: 'admin' | 'expert'; specialty: string | null }

export default function ExpertHeader() {
  const [profile, setProfile] = useState<Profile | null>(null)

  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.rpc('current_profile_details')
      if (data?.[0]) setProfile(data[0] as Profile)
      else setProfile({
        full_name: typeof user.user_metadata.full_name === 'string' ? user.user_metadata.full_name : user.email?.split('@')[0] ?? 'Expert reviewer',
        role: 'expert',
        specialty: null,
      })
    }
    loadProfile()
  }, [])

  const roleLabel = profile?.role === 'admin' ? 'Administrator' : 'Expert reviewer'
  const displayName = profile?.full_name?.trim() || 'Expert reviewer'
  const initials = displayName.split(/\s+/).filter(Boolean).slice(0, 2).map(name => name[0]).join('').toUpperCase()

  return (
    <header className="mb-8 border-b border-zinc-900 pb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-6">
      <div>
        <h1 className="text-3xl font-medium text-zinc-100 mb-2">Expert Workspace</h1>
        <p className="text-zinc-500 font-light">Human-in-the-loop verification pipeline.</p>
      </div>
      <div className="flex items-center gap-3 rounded-xl border border-zinc-800/60 bg-zinc-900/35 px-3 py-2 text-left">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-emerald-500/30 bg-emerald-500/10 text-xs font-semibold text-emerald-300">
          {profile?.role === 'admin' ? <ShieldCheck size={17} className="text-emerald-400" /> : initials}
        </div>
        <div className="min-w-0">
          <span className="block truncate text-sm font-medium text-zinc-200">{displayName}</span>
          <span className="mt-0.5 flex items-center gap-1.5 text-[11px] text-zinc-500"><i className="h-1.5 w-1.5 rounded-full bg-emerald-400" />{profile?.specialty || roleLabel}</span>
        </div>
      </div>
    </header>
  )
}
