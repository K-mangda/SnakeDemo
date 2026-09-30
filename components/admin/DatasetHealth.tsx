'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle, BrainCircuit, CircleAlert, RefreshCw } from 'lucide-react'
import Button from '@/components/ui/Button'
import { fetchAdminOverview, type AdminOverview } from '@/components/admin/SystemTelemetry'

export default function DatasetHealth() {
  const [overview, setOverview] = useState<AdminOverview | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  async function load() { setLoading(true); setError(null); try { setOverview(await fetchAdminOverview()) } catch (requestError) { setError(requestError instanceof Error ? requestError.message : 'Could not load dataset health.') } finally { setLoading(false) } }
  useEffect(() => { void load() }, [])
  const species = [...(overview?.verifiedSpecies ?? [])].sort((left, right) => right.count - left.count)
  return <section className="mb-12 rounded-xl border border-zinc-800 bg-zinc-900/20 p-6"><div className="flex flex-wrap items-start justify-between gap-4"><div><h2 className="flex items-center gap-2 text-lg font-medium text-zinc-100"><BrainCircuit size={20} className="text-purple-400" /> Dataset health</h2><p className="mt-1 text-sm text-zinc-500">Verified image counts are grouped by final species from the database.</p></div><Button variant="ghost" size="sm" disabled={loading} onClick={() => void load()}><RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh</Button></div><div className="mt-6 grid gap-5 lg:grid-cols-[1fr_0.9fr]"><div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950/50"><div className="border-b border-zinc-800 px-4 py-3 text-xs font-medium uppercase tracking-wider text-zinc-500">Verified images per species</div>{error ? <p className="p-4 text-sm text-red-300">{error}</p> : loading ? <p className="p-4 text-sm text-zinc-500">Loading species counts…</p> : species.length ? <ul className="divide-y divide-zinc-800">{species.map(item => <li key={item.id} className="flex items-center justify-between gap-4 px-4 py-3"><div className="min-w-0"><p className="truncate text-sm text-zinc-200">{item.name}</p><p className="truncate text-xs italic text-zinc-500">{item.scientificName}</p></div><span className="font-mono text-sm text-emerald-300">{item.count}</span></li>)}</ul> : <p className="p-4 text-sm text-zinc-500">No verified species records yet.</p>}</div><div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.04] p-5"><h3 className="flex items-center gap-2 text-sm font-medium text-amber-200"><AlertTriangle size={16} /> Training threshold</h3><p className="mt-3 text-sm leading-6 text-zinc-400">No persistent training-threshold setting exists in the database, so this value is intentionally read-only and not inferred from browser state.</p><p className="mt-4 rounded-lg border border-red-500/25 bg-red-500/10 px-3 py-2.5 text-sm font-medium text-red-300"><CircleAlert size={16} className="mr-2 inline" />Training worker is not configured — awaiting supervisor decision.</p><Button disabled className="mt-4 w-full justify-center">Start Training</Button></div></div></section>
}
