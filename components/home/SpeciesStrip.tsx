'use client'
import Link from 'next/link'
import { SNAKE_DATA } from '@/lib/data'
import { ChevronRight } from 'lucide-react'

export default function SpeciesStrip() {
  return (
    <section className="py-24 border-t border-zinc-900 bg-zinc-950/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-end justify-between mb-12">
          <div>
            <h2 className="text-2xl font-medium text-zinc-100 mb-2">Taxonomic Coverage</h2>
            <p className="text-zinc-400 font-light">Supported species in the current model iteration.</p>
          </div>
          <Link href="/database" className="hidden sm:flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-100 transition-colors">
            View All <ChevronRight size={16} />
          </Link>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {SNAKE_DATA.slice(0, 8).map(s => (
            <Link key={s.id} href={`/database/${s.id}`} className="group p-4 border border-zinc-800/50 bg-zinc-900/30 rounded-lg hover:border-zinc-700 transition-all">
              <div className="mb-3">
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">{s.family}</span>
              </div>
              <h3 className="text-sm font-medium text-zinc-200 mb-1">{s.scientific}</h3>
              <p className="text-xs text-zinc-500">{s.name_th} · {s.name_en}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
