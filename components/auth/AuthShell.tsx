import Link from 'next/link'
import { Hexagon } from 'lucide-react'

interface AuthShellProps {
  label: string
  title: string
  description: string
  children: React.ReactNode
}

export default function AuthShell({ label, title, description, children }: AuthShellProps) {
  return (
    <main className="relative isolate min-h-screen overflow-hidden bg-[#0a0c0e] px-5 py-6 sm:px-8">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_50%_47%,rgba(34,53,49,0.34),transparent_39%),radial-gradient(ellipse_at_12%_10%,rgba(255,255,255,0.035),transparent_25%),linear-gradient(140deg,#090b0d_8%,#0e1213_52%,#090b0d_100%)]" />
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:44px_44px] [mask-image:linear-gradient(to_bottom,black,transparent_72%)]" />
      <div className="absolute inset-x-0 top-0 -z-10 h-px bg-gradient-to-r from-transparent via-emerald-400/20 to-transparent" />

      <section className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-6xl items-center justify-center py-12 sm:py-16">
        <div className="w-full max-w-md">
          {(label || title || description) && (
            <div className="mb-7 text-center">
              {label && <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-400">{label}</p>}
              {title && <h1 className="text-3xl font-semibold tracking-tight text-zinc-100 sm:text-4xl">{title}</h1>}
              {description && <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-zinc-500">{description}</p>}
            </div>
          )}
          <div className="relative overflow-hidden rounded-2xl border border-white/[0.09] bg-zinc-950/75 p-6 shadow-2xl shadow-black/40 backdrop-blur-xl sm:p-8">
            <div className="absolute inset-x-12 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/60 to-transparent" />
            <Link href="/" className="mx-auto mb-8 flex w-fit items-center gap-2.5 text-zinc-100 transition hover:text-emerald-300">
              <Hexagon className="fill-emerald-500/20 text-emerald-500" size={36} />
              <span className="text-lg font-bold tracking-tight">NSTRU<span className="font-normal text-zinc-500">Vision</span></span>
            </Link>
            {children}
          </div>
        </div>
      </section>
    </main>
  )
}
