'use client'

import RequireRole from '@/components/auth/RequireRole'

export default function ExpertLayout({ children }: { children: React.ReactNode }) {
  return <RequireRole allowed={['admin', 'expert']}>{children}</RequireRole>
}
