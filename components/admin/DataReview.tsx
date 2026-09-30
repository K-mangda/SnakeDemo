'use client'

import { useEffect, useState } from 'react'
import { CircleHelp, Eye, RefreshCw, Sparkles } from 'lucide-react'
import Button from '@/components/ui/Button'
import { fetchAdminOverview, type AdminOverview } from '@/components/admin/SystemTelemetry'

export default function DataReview() {
  const [overview, setOverview] = useState<AdminOverview | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  async function load() { setLoading(true); setError(null); try { setOverview(await fetchAdminOverview()) } catch (requestError) { setError(requestError instanceof Error ? requestError.message : 'Could not load review queues.') } finally { setLoading(false) } }
  useEffect(() => { void load() }, [])
  const cards = [{ title: 'Unclear images', count: overview?.counts.unclear, detail: 'Images currently marked Unclear by the review workflow.', icon: CircleHelp, tone: 'amber' }, { title: 'Waiting for new class', count: overview?.counts.waitingForNewClass, detail: 'Images currently awaiting a taxonomy reference decision.', icon: Sparkles, tone: 'sky' }] as const
  return <section className="mb-12 rounded-xl border border-zinc-800 bg-zinc-900/20 p-6"><div className="flex flex-wrap items-start justify-between gap-4"><div><h2 className="flex items-center gap-2 text-lg font-medium text-zinc-100"><Eye size={20} className="text-amber-400" /> Data review</h2><p className="mt-1 text-sm text-zinc-500">Read-only queue summary from current database statuses.</p></div><Button variant="ghost" size="sm" disabled={loading} onClick={() => void load()}><RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh</Button></div>{error ? <p className="mt-5 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</p> : <><div className="mt-6 grid gap-4 sm:grid-cols-2">{cards.map(card => { const Icon = card.icon; const colors = card.tone === 'amber' ? 'border-amber-500/20 bg-amber-500/[0.04] text-amber-300' : 'border-sky-500/20 bg-sky-500/[0.04] text-sky-300'; return <article key={card.title} className={`rounded-xl border p-5 ${colors}`}><div className="flex items-start justify-between gap-3"><div><p className="flex items-center gap-2 text-sm font-medium"><Icon size={17} />{card.title}</p><p className="mt-3 text-sm leading-6 text-zinc-500">{card.detail}</p></div><span className="text-3xl font-semibold text-zinc-100">{loading ? '…' : card.count ?? 0}</span></div></article> })}</div><p className="mt-5 text-xs leading-5 text-zinc-500">Delete, restore, reassignment, and species-creation actions are unavailable because this Admin page has no corresponding audited backend action. Use the existing review workflow for inspection and expert decisions.</p></>}</section>
}
