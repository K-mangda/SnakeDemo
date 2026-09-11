'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Menu, X, Hexagon, LogOut, UserRound } from 'lucide-react'
import Button from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase/client'

export default function Navbar() {
  const pathname = usePathname()
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenu, setMobileMenu] = useState(false)
  const [role, setRole] = useState<'admin' | 'expert' | null>(null)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => { setMobileMenu(false) }, [pathname])

  useEffect(() => {
    let active = true
    async function loadAccess() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || !active) return
      const { data: profiles } = await supabase.rpc('current_profile')
      const profile = profiles?.[0]
      if (active && profile?.status === 'active') setRole(profile.role as 'admin' | 'expert')
    }
    loadAccess()
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => loadAccess())
    return () => { active = false; subscription.unsubscribe() }
  }, [])

  const signOut = async () => {
    await supabase.auth.signOut()
    setRole(null)
    window.location.assign('/login')
  }

  const links = [
    { href: '/predict', label: 'Analysis' },
    { href: '/export', label: 'Export' },
    ...(role === 'expert' ? [{ href: '/expert', label: 'Workspace' }] : []),
    ...(role === 'admin' ? [{ href: '/admin', label: 'System' }] : []),
  ]

  return (
    <nav className={cn(
      'fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b',
      scrolled ? 'bg-zinc-950/80 backdrop-blur-md border-zinc-800/80 py-3' : 'bg-transparent border-transparent py-5'
    )}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Hexagon className="text-emerald-500 fill-emerald-500/20" size={24} />
          <span className="font-bold tracking-tight text-zinc-100">NSTRU<span className="text-zinc-500 font-normal">Vision</span></span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          <div className="flex items-center gap-6 text-sm font-medium">
            {links.map(link => (
              <Link 
                key={link.href} 
                href={link.href}
                className={cn(
                  'transition-all duration-200', 
                  pathname.startsWith(link.href) 
                    ? 'text-emerald-400' 
                    : 'text-zinc-400 hover:text-zinc-200'
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>
          {role ? (
            <div className="flex items-center gap-1">
              <Button variant="ghost" href="/account" size="sm">Account <UserRound size={14} /></Button>
              <Button variant="ghost" size="sm" onClick={signOut}>Sign out <LogOut size={14} /></Button>
            </div>
          ) : (
            <Button variant="ghost" href="/login" size="sm">Sign in</Button>
          )}
          <Button href="/predict" size="sm">New Scan</Button>
        </div>

        <button className="md:hidden text-zinc-400 p-2 -mr-2" onClick={() => setMobileMenu(!mobileMenu)}>
          {mobileMenu ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {mobileMenu && (
        <div className="md:hidden absolute top-full left-0 w-full bg-zinc-950/95 backdrop-blur-md border-b border-zinc-800 p-4 flex flex-col gap-2 shadow-xl shadow-black/50">
          {links.map(link => (
            <Link 
              key={link.href} 
              href={link.href} 
              className={cn(
                "text-base font-medium px-4 py-3 rounded-lg transition-colors",
                pathname.startsWith(link.href)
                  ? "bg-zinc-900/80 text-emerald-400"
                  : "text-zinc-400 hover:bg-zinc-900/50 hover:text-zinc-200"
              )}
            >
              {link.label}
            </Link>
          ))}
          <div className="pt-4 pb-2 px-2 mt-2 border-t border-zinc-800/50">
            {role ? (
              <>
                <Button variant="ghost" href="/account" className="mb-2 w-full justify-center py-3">Account <UserRound size={14} /></Button>
                <Button variant="ghost" onClick={signOut} className="w-full justify-center py-3">Sign out <LogOut size={14} /></Button>
              </>
            ) : (
              <Button variant="ghost" href="/login" className="w-full justify-center py-3">Sign in</Button>
            )}
            <Button href="/predict" className="w-full justify-center py-3">New Scan</Button>
          </div>
        </div>
      )}
    </nav>
  )
}
