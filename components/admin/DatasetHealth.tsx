'use client'

import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, BrainCircuit, RefreshCw } from 'lucide-react'
import Button from '@/components/ui/Button'
import { supabase } from '@/lib/supabase/client'
import { readAdminCache, writeAdminCache } from '@/lib/admin-cache'

type Telemetry = {
  counts: { verified: number }
  verifiedSpecies: { name: string; count: number }[]
}

const PREVIEW_MIN_IMAGES_PER_SPECIES = 10_000

function DatasetHealthSkeleton() {
  return <div className="grid animate-pulse gap-8 md:grid-cols-2 md:items-center">
    <div><div className="h-4 w-56 rounded bg-zinc-800" /><div className="mt-3 h-10 w-48 rounded-lg bg-zinc-900" /><div className="mt-3 h-9 w-full max-w-md rounded bg-zinc-900/70" /></div>
    <div className="h-56 rounded-xl border border-zinc-800/50 bg-zinc-950/40 p-5"><div className="h-4 w-48 rounded bg-zinc-800" /><div className="mt-5 h-3 rounded-full bg-zinc-800" /><div className="mt-5 h-16 rounded bg-zinc-900" /></div>
  </div>
}

export default function DatasetHealth() {
  const [telemetry, setTelemetry] = useState<Telemetry | null>(() => readAdminCache<Telemetry>('dataset-health') ?? null)
  const [loading, setLoading] = useState(() => readAdminCache<Telemetry>('dataset-health') === null)
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
      const nextTelemetry = payload as Telemetry
      setTelemetry(nextTelemetry)
      writeAdminCache('dataset-health', nextTelemetry)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Could not load verified species data.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { if (readAdminCache<Telemetry>('dataset-health') === null) void load() }, [])

  const species = telemetry?.verifiedSpecies ?? []
  const verifiedSpecies = useMemo(() => species.filter(item => item.count > 0), [species])
  const belowPreviewTarget = useMemo(() => species.filter(item => item.count < PREVIEW_MIN_IMAGES_PER_SPECIES).sort((left, right) => left.count - right.count), [species])
  const readySpecies = species.length - belowPreviewTarget.length
  const coverage = species.length ? (verifiedSpecies.length / species.length) * 100 : 0
  const previewReadiness = species.length ? (readySpecies / species.length) * 100 : 0

  return <section className="mb-12 rounded-xl border border-zinc-800 bg-zinc-900/20 p-6 transition-all duration-300">
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h2 className="flex items-center gap-2 text-lg font-medium text-zinc-100"><BrainCircuit size={20} className="text-purple-500" /> Dataset Health & Export Readiness</h2>
        <p className="mt-2 text-sm text-zinc-500">Verified final annotations are live. The target below is an illustrative, read-only preview only.</p>
      </div>
      <Button variant="ghost" size="sm" disabled={loading} onClick={() => void load()}><RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh</Button>
    </div>

    {loading ? <DatasetHealthSkeleton /> : error ? <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</div> : <div className="grid gap-8 md:grid-cols-2 md:items-center">
      <div className="rounded-xl border border-zinc-800/50 bg-zinc-950/30 p-5">
        <div className="flex items-center gap-2"><label className="block text-sm text-zinc-300">Minimum Images per Species Target</label><span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-300">Preview only</span></div>
        <input aria-label="Minimum images per species target preview" value={PREVIEW_MIN_IMAGES_PER_SPECIES.toLocaleString()} disabled className="mt-3 w-48 rounded-lg border border-zinc-800 bg-zinc-950 px-4 py-2 font-mono text-sm text-zinc-300" />
        <p className="mt-3 max-w-md text-xs leading-5 text-zinc-500">Example target for planning the data collection. It is not saved and is not used by any training worker.</p>
        <div className="mt-5 grid grid-cols-3 gap-3 border-t border-zinc-800/50 pt-4"><div><p className="text-lg font-mono text-zinc-100">{telemetry?.counts.verified.toLocaleString()}</p><p className="mt-1 text-[11px] text-zinc-500">Verified images</p></div><div><p className="text-lg font-mono text-zinc-100">{verifiedSpecies.length}</p><p className="mt-1 text-[11px] text-zinc-500">Species covered</p></div><div><p className="text-lg font-mono text-zinc-100">{species.length}</p><p className="mt-1 text-[11px] text-zinc-500">Tracked species</p></div></div>
      </div>

      <div className="rounded-xl border border-zinc-800/50 bg-zinc-950/50 p-5">
        <div className="flex items-end justify-between gap-4"><span className="text-sm font-medium text-zinc-300">Ready Species <span className="text-zinc-500">(preview target)</span></span><span className="font-mono text-xs text-zinc-500">{readySpecies} / {species.length}</span></div>
        <div className="mb-3 mt-3 h-3 w-full overflow-hidden rounded-full bg-zinc-800"><div className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-500" style={{ width: `${previewReadiness}%` }} /></div>
        <p className="text-xs leading-5 text-zinc-500">Coverage from real data: <span className="font-mono text-zinc-300">{verifiedSpecies.length} / {species.length}</span> species have at least one verified image ({coverage.toFixed(0)}%).</p>
        {belowPreviewTarget.length > 0 && <div className="mt-4 border-t border-zinc-800/50 pt-4 text-xs leading-5 text-amber-400"><p><strong>Preview warning:</strong> {belowPreviewTarget.length} species are below the example target of {PREVIEW_MIN_IMAGES_PER_SPECIES.toLocaleString()} images.</p><p className="mt-1 text-amber-400/70">Lowest counts: {belowPreviewTarget.slice(0, 3).map(item => `${item.name} (${item.count})`).join(', ')}{belowPreviewTarget.length > 3 ? '…' : ''}</p></div>}
        <div className="mt-4 border-t border-zinc-800/50 pt-4"><div className="flex items-start gap-2 text-sm text-red-300"><AlertTriangle size={16} className="mt-0.5 shrink-0" /><span>Training worker is not configured — awaiting supervisor decision.</span></div><Button disabled variant="secondary" size="sm" className="mt-3 w-full justify-center">Start Training</Button></div>
      </div>
    </div>}
  </section>
}
