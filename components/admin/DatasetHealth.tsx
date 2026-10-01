'use client'

import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, BrainCircuit, RefreshCw } from 'lucide-react'
import Button from '@/components/ui/Button'
import { supabase } from '@/lib/supabase/client'

type Telemetry = {
  counts: { verified: number }
  verifiedSpecies: { name: string; count: number }[]
}

function DatasetHealthSkeleton() {
  return <div className="grid animate-pulse gap-8 md:grid-cols-2 md:items-center">
    <div><div className="h-4 w-56 rounded bg-zinc-800" /><div className="mt-3 h-10 w-48 rounded-lg bg-zinc-900" /><div className="mt-3 h-9 w-full max-w-md rounded bg-zinc-900/70" /></div>
    <div className="h-56 rounded-xl border border-zinc-800/50 bg-zinc-950/40 p-5"><div className="h-4 w-48 rounded bg-zinc-800" /><div className="mt-5 h-3 rounded-full bg-zinc-800" /><div className="mt-5 h-16 rounded bg-zinc-900" /></div>
  </div>
}

export default function DatasetHealth() {
  const [telemetry, setTelemetry] = useState<Telemetry | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Sign in is required.')
      const response = await fetch('/api/admin/telemetry', { headers: { Authorization: `Bearer ${session.access_token}` }, cache: 'no-store' })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.detail ?? 'Could not load verified species data.')
      setTelemetry(payload as Telemetry)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Could not load verified species data.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load() }, [])

  const species = telemetry?.verifiedSpecies ?? []
  const verifiedSpecies = useMemo(() => species.filter(item => item.count > 0), [species])
  const missingSpecies = useMemo(() => species.filter(item => item.count === 0).slice(0, 3), [species])
  const coverage = species.length ? (verifiedSpecies.length / species.length) * 100 : 0

  return <section className="mb-12 rounded-xl border border-zinc-800 bg-zinc-900/20 p-6 transition-all duration-300">
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h2 className="flex items-center gap-2 text-lg font-medium text-zinc-100"><BrainCircuit size={20} className="text-purple-500" /> Dataset Health & Export Readiness</h2>
        <p className="mt-2 text-sm text-zinc-500">Verified final annotations only. Training readiness remains unavailable until its infrastructure is configured.</p>
      </div>
      <Button variant="ghost" size="sm" disabled={loading} onClick={() => void load()}><RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh</Button>
    </div>

    {loading ? <DatasetHealthSkeleton /> : error ? <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</div> : <div className="grid gap-8 md:grid-cols-2 md:items-center">
      <div>
        <div className="flex items-center gap-2"><label className="block text-sm text-zinc-400">Minimum Images per Species Target</label><span className="rounded-full border border-zinc-700 bg-zinc-800 px-2 py-0.5 text-[11px] font-medium text-zinc-400">Read-only</span></div>
        <input aria-label="Minimum images per species target" value="Not configured" disabled className="mt-3 w-48 rounded-lg border border-zinc-800 bg-zinc-950 px-4 py-2 font-mono text-sm text-zinc-500" />
        <p className="mt-3 max-w-md text-xs leading-5 text-zinc-500">No persistent threshold setting exists yet, so the system does not calculate a target-met or class-balance verdict.</p>
      </div>

      <div className="rounded-xl border border-zinc-800/50 bg-zinc-950/50 p-5">
        <div className="flex items-end justify-between gap-4"><span className="text-sm font-medium text-zinc-300">Species with verified images</span><span className="font-mono text-xs text-zinc-500">{verifiedSpecies.length} / {species.length}</span></div>
        <div className="mb-4 mt-3 h-3 w-full overflow-hidden rounded-full bg-zinc-800"><div className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-500" style={{ width: `${coverage}%` }} /></div>
        <p className="text-sm text-zinc-300"><span className="font-mono text-lg text-zinc-100">{telemetry?.counts.verified.toLocaleString()}</span> verified final annotations</p>
        {missingSpecies.length > 0 && <p className="mt-3 text-xs leading-5 text-amber-400">Examples with no verified images: {missingSpecies.map(item => item.name).join(', ')}{species.length - verifiedSpecies.length > missingSpecies.length ? '…' : ''}</p>}
        <div className="mt-4 border-t border-zinc-800/50 pt-4"><div className="flex items-start gap-2 text-sm text-red-300"><AlertTriangle size={16} className="mt-0.5 shrink-0" /><span>Training worker is not configured — awaiting supervisor decision.</span></div><Button disabled variant="secondary" size="sm" className="mt-3 w-full justify-center">Start Training</Button></div>
      </div>
    </div>}
  </section>
}
