'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Menu, X, Hexagon } from 'lucide-react'
import Button from '@/components/ui/Button'
import { cn } from '@/lib/utils'

export default function Navbar() {
  const pathname = usePathname()
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenu, setMobileMenu] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => { setMobileMenu(false) }, [pathname])

  const links = [
    { href: '/predict', label: 'Analysis' },
    { href: '/database', label: 'Database' },
    { href: '/export', label: 'Export' },
    { href: '/expert', label: 'Workspace' },
    { href: '/admin', label: 'System' },
  ]

  return (
    <nav className={cn(
      'fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b',
      scrolled ? 'bg-zinc-950/80 backdrop-blur-md border-zinc-800/80 py-3' : 'bg-transparent border-transparent py-5'
    )}>
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
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
          <Button href="/predict" size="sm">New Scan</Button>
        </div>

        <button className="md:hidden text-zinc-400" onClick={() => setMobileMenu(!mobileMenu)}>
          {mobileMenu ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {mobileMenu && (
        <div className="md:hidden absolute top-full left-0 w-full bg-zinc-950 border-b border-zinc-800 p-4 flex flex-col gap-4">
          {links.map(link => (
            <Link key={link.href} href={link.href} className="text-sm font-medium text-zinc-400 px-4 py-2 hover:bg-zinc-900 rounded-lg">
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  )
}
