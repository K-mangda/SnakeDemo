'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { ShieldAlert } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'

type Role = 'admin' | 'expert'

export default function RequireRole({ allowed, children }: { allowed: Role[]; children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [message, setMessage] = useState('Checking access…')
  const [allowedAccess, setAllowedAccess] = useState(false)

  useEffect(() => {
    let active = true

    async function verifyAccess() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.replace(`/login?next=${encodeURIComponent(pathname)}`)
        return
      }

      const { data: profiles } = await supabase.rpc('current_profile')
      const profile = profiles?.[0]

      if (!active) return
      if (!profile || profile.status !== 'active') {
        setMessage('Your account is not active. Contact an administrator.')
        return
      }
      if (!allowed.includes(profile.role as Role)) {
        setMessage('You do not have permission to access this workspace.')
        return
      }
      setAllowedAccess(true)
    }

    verifyAccess()
    return () => { active = false }
  }, [allowed, pathname, router])

  if (allowedAccess) return <>{children}</>

  return (
    <main className="grid min-h-screen place-items-center bg-zinc-950 px-6">
      <div className="max-w-sm text-center">
        <ShieldAlert className="mx-auto mb-4 text-emerald-400" size={32} />
        <p className="text-sm text-zinc-400">{message}</p>
      </div>
    </main>
  )
}
