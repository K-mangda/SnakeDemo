'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import { SNAKE_DATA } from '@/lib/data'
import { Search, Database, Filter } from 'lucide-react'
import { getDangerColor } from '@/lib/utils'
import ParticleBackground from '@/components/ParticleBackground'

export default function SnakesPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState('all')
  const containerRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const updateMousePosition = (ev: MouseEvent) => {
      if (!containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const x = ev.clientX - rect.left
      const y = ev.clientY - rect.top
      containerRef.current.style.setProperty('--mouse-x', `${x}px`)
      containerRef.current.style.setProperty('--mouse-y', `${y}px`)
    }

    window.addEventListener('mousemove', updateMousePosition)
    return () => window.removeEventListener('mousemove', updateMousePosition)
  }, [])

  return (
    <main 
      ref={containerRef}
      className="min-h-screen pt-24 sm:pt-28 px-4 sm:px-6 pb-20 relative overflow-hidden"
    >
      {/* Particle Interaction Layer */}
      <ParticleBackground />
      
      {/* Subtle background grid pattern */}
      <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#ffffff04_1px,transparent_1px),linear-gradient(to_bottom,#ffffff04_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none"></div>

      <div className="max-w-6xl mx-auto relative z-10">
        <header className="mb-10 flex flex-col lg:flex-row lg:items-end justify-between gap-8 relative">
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-3">
              {/* Soft vertical accent bar */}
              <div className="w-1.5 h-8 bg-emerald-500 rounded-full"></div>
              <h1 className="text-4xl font-semibold tracking-tight text-zinc-100">
                Taxonomic Database
              </h1>
            </div>
            <p className="text-zinc-400 font-light text-base md:text-lg ml-5">
              Reference database of venomous species in Thailand.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
              <input 
                type="text" 
                placeholder="Search database..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-zinc-900/80 border border-zinc-800 rounded-lg py-2 pl-9 pr-4 text-sm text-zinc-300 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all shadow-sm"
              />
            </div>
            <div className="relative w-full sm:w-40">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full bg-zinc-900/80 border border-zinc-800 rounded-lg py-2 pl-9 pr-8 text-sm text-zinc-300 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all appearance-none cursor-pointer shadow-sm"
              >
                <option value="all">All Toxicity</option>
                <option value="neurotoxic">Neurotoxic</option>
                <option value="hemotoxic">Hemotoxic</option>
              </select>
              {/* Custom dropdown arrow */}
              <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
              </div>
            </div>
          </div>
        </header>

        <div className="overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-900/20 shadow-sm -mx-4 sm:mx-0">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-800 text-xs uppercase tracking-wider text-zinc-500 bg-zinc-900/60">
                <th className="p-4 pl-6 font-medium">Species</th>
                <th className="p-4 font-medium hidden sm:table-cell">Scientific Name</th>
                <th className="p-4 font-medium">Toxicity</th>
                <th className="p-4 font-medium hidden md:table-cell">Habitat</th>
                <th className="p-4 pr-6 font-medium text-right">Records</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {SNAKE_DATA.filter(snake => 
                (filterType === 'all' || snake.venom_type === filterType) &&
                (snake.name_en.toLowerCase().includes(searchQuery.toLowerCase()) ||
                snake.name_th.includes(searchQuery) ||
                snake.scientific.toLowerCase().includes(searchQuery.toLowerCase()) ||
                snake.venom_type.toLowerCase().includes(searchQuery.toLowerCase()))
              ).map((snake) => (
                <tr 
                  key={snake.id} 
                  onClick={() => router.push(`/database/${snake.id}`)}
                  className="hover:bg-zinc-800/60 transition-colors duration-200 group cursor-pointer"
                >
                  <td className="p-4 pl-6 relative">
                    {/* Left border highlight on hover */}
                    <div className="absolute inset-y-0 left-0 w-1 bg-emerald-500/0 group-hover:bg-emerald-500/80 transition-colors duration-200"></div>
                    <div className="flex flex-col">
                      <span className="font-medium text-zinc-200 group-hover:text-emerald-400 transition-colors">{snake.name_en}</span>
                      <span className="text-xs text-zinc-500">{snake.name_th}</span>
                    </div>
                  </td>
                  <td className="p-4 hidden sm:table-cell text-sm text-zinc-400 italic">
                    {snake.scientific}
                  </td>
                  <td className="p-4">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-md bg-zinc-950 shadow-sm border border-zinc-800/80 ${getDangerColor(snake.danger_level)}`}>
                      {snake.venom_type}
                    </span>
                  </td>
                  <td className="p-4 hidden md:table-cell text-sm text-zinc-400">
                    {snake.habitat}
                  </td>
                  <td className="p-4 pr-6 text-right text-sm text-zinc-500 font-mono">
                    {snake.predictions.toLocaleString()}
                  </td>
                </tr>
              ))}
              
              {/* Empty state when search yields no results */}
              {SNAKE_DATA.filter(snake => 
                (filterType === 'all' || snake.venom_type === filterType) &&
                (snake.name_en.toLowerCase().includes(searchQuery.toLowerCase()) ||
                snake.name_th.includes(searchQuery) ||
                snake.scientific.toLowerCase().includes(searchQuery.toLowerCase()) ||
                snake.venom_type.toLowerCase().includes(searchQuery.toLowerCase()))
              ).length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-zinc-500">
                    No species found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  )
}
