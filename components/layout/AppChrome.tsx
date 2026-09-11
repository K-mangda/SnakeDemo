'use client'

import { usePathname } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'

export default function AppChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isAccessPage = pathname === '/login' || pathname === '/setup' || pathname === '/set-password'

  return (
    <>
      {!isAccessPage && <Navbar />}
      {children}
      {!isAccessPage && <Footer />}
    </>
  )
}
