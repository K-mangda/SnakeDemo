'use client'

import RequireRole from '@/components/auth/RequireRole'

export default function ExportLayout({ children }: { children: React.ReactNode }) {
  return <RequireRole allowed={['admin']}>{children}</RequireRole>
}
