'use client'

import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { AlertTriangle, CheckCircle2, ChevronDown, CircleHelp, ClipboardCheck, Eye, RefreshCw, Sparkles } from 'lucide-react'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { supabase } from '@/lib/supabase/client'

type Box = { x: number; y: number; width: number; height: number }
type AuditItem = { id: string; imageUrl: string | null; filename: string; status: 'pending' | 'verified' | 'unclear' | 'waiting_for_new_class'; updatedAt: string; finalSpecies: string | null; finalBox: Box | null; reason: string; reviews: { expert: string; species: string | null; bbox: Box | null; createdAt: string }[]; pairs: { leftExpert: string; rightExpert: string; value: number | null }[] }

function formatBox(box: Box | null) {
  return box ? `x ${box.x.toFixed(1)} · y ${box.y.toFixed(1)} · w ${box.width.toFixed(1)} · h ${box.height.toFixed(1)}` : 'No box'
}

function AuditDetails({ item }: { item: AuditItem }) {
  return <div className="border-t border-zinc-800 px-4 py-4"><p className="mb-3 truncate text-xs text-zinc-500" title={item.filename}>File: {item.filename}</p><div className="grid gap-2 md:grid-cols-2">{item.reviews.map((review, index) => <div key={`${review.expert}-${review.createdAt}-${index}`} className="rounded-lg border border-zinc-800 bg-zinc-950/50 px-3 py-2.5"><div className="flex items-center justify-between gap-3"><span className="truncate text-xs text-zinc-400">{review.expert}</span><span className={`truncate text-xs font-medium ${review.species ? 'italic text-zinc-200' : 'text-amber-400'}`}>{review.species ?? 'Unclear'}</span></div><p className="mt-2 font-mono text-[11px] text-zinc-500">{formatBox(review.bbox)}</p></div>)}</div>{item.pairs.length > 0 && <div className="mt-4 border-t border-zinc-800 pt-4"><p className="mb-2 text-xs font-medium uppercase tracking-wider text-zinc-500">Box overlap (IoU)</p><div className="flex flex-wrap gap-2">{item.pairs.map((pair, index) => <span key={`${pair.leftExpert}-${pair.rightExpert}-${index}`} className={`rounded-md border px-2.5 py-1.5 text-xs ${pair.value !== null && pair.value >= 0.5 ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300' : 'border-amber-500/30 bg-amber-500/10 text-amber-300'}`}>{pair.leftExpert} ↔ {pair.rightExpert}: {pair.value === null ? 'No comparable boxes' : `${(pair.value * 100).toFixed(0)}%`}</span>)}</div></div>}</div>
}

function ConflictCard({ item, open, onToggle }: { item: AuditItem; open: boolean; onToggle: () => void }) {
  return <article className="overflow-hidden rounded-xl border border-amber-500/20 bg-amber-500/[0.035]"><div className="flex items-center gap-4 p-3.5"><div className="grid h-16 w-24 shrink-0 place-items-center overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900">{item.imageUrl ? <img src={item.imageUrl} alt="Reviewed scan" className="h-full w-full object-cover" /> : <Eye size={17} className="text-zinc-600" />}</div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="text-sm font-medium text-zinc-100">Review conflict</p><Badge variant="warning" className="px-2 py-0.5 text-[11px]">Needs one more review</Badge></div><p className="mt-1 truncate text-xs text-amber-300">{item.reason}</p><p className="mt-1 text-xs text-zinc-500">{item.reviews.length} expert reviews · Updated {new Date(item.updatedAt).toLocaleDateString()}</p></div><Button href={`/admin/reviews/${item.id}`} variant="outline" size="sm" className="hidden shrink-0 sm:inline-flex">Inspect</Button><button type="button" onClick={onToggle} aria-label={open ? 'Hide review values' : 'Show review values'} className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200"><ChevronDown size={16} className={`transition-transform ${open ? 'rotate-180' : ''}`} /></button></div>{open && <AuditDetails item={item} />}</article>
}

function FollowUpCard({ title, description, count, item, icon, tone }: { title: string; description: string; count: number; item?: AuditItem; icon: ReactNode; tone: 'amber' | 'sky' | 'emerald' }) {
  const tones = { amber: 'border-amber-500/20 bg-amber-500/[0.035] text-amber-300', sky: 'border-sky-500/20 bg-sky-500/[0.035] text-sky-300', emerald: 'border-emerald-500/20 bg-emerald-500/[0.035] text-emerald-300' }
  return <article className={`rounded-xl border p-4 ${tones[tone]}`}><div className="flex items-start justify-between gap-3"><div className="flex items-center gap-2 text-sm font-medium">{icon}{title}</div><span className="text-2xl font-semibold text-zinc-100">{count}</span></div><p className="mt-2 min-h-10 text-xs leading-5 text-zinc-500">{description}</p>{item ? <Button href={`/admin/reviews/${item.id}`} variant="ghost" size="sm" className="mt-3 -ml-2">Inspect latest</Button> : <p className="mt-3 text-xs text-zinc-600">Nothing to inspect</p>}</article>
}

export default function ConsensusAudit() {
  const [items, setItems] = useState<AuditItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [openId, setOpenId] = useState<string | null>(null)

  async function load() {
    setLoading(true); setError(null)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Sign in is required.')
      const response = await fetch('/api/admin/consensus', { headers: { Authorization: `Bearer ${session.access_token}` } })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.detail ?? 'Could not load consensus audit.')
      setItems(payload.items ?? [])
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Could not load consensus audit.')
    } finally { setLoading(false) }
  }

  useEffect(() => { void load() }, [])
  const conflicts = useMemo(() => items.filter((item) => item.status === 'pending' && item.reviews.length > 1), [items])
  const unclear = useMemo(() => items.filter((item) => item.status === 'unclear'), [items])
  const newClass = useMemo(() => items.filter((item) => item.status === 'waiting_for_new_class'), [items])
  const verified = useMemo(() => items.filter((item) => item.status === 'verified'), [items])

  return <section className="mb-12 rounded-xl border border-zinc-800 bg-zinc-900/20 p-6"><div className="mb-6 flex flex-wrap items-start justify-between gap-4"><div><h2 className="flex items-center gap-2 text-lg font-medium text-zinc-100"><ClipboardCheck size={20} className="text-amber-400" /> Review conflicts</h2><p className="mt-1 text-sm text-zinc-500">Only images that need an additional expert decision are shown first.</p></div><Button variant="ghost" size="sm" disabled={loading} onClick={() => void load()}><RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh</Button></div>{loading ? <p className="py-8 text-center text-sm text-zinc-500">Loading review conflicts…</p> : error ? <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</p> : <>{conflicts.length ? <div className="space-y-3">{conflicts.map((item) => <ConflictCard key={item.id} item={item} open={openId === item.id} onToggle={() => setOpenId(openId === item.id ? null : item.id)} />)}</div> : <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.04] px-4 py-5 text-sm text-emerald-300">No review conflicts right now. The current dataset has no images awaiting a tie-breaker.</div>}<div className="mt-6 border-t border-zinc-800 pt-5"><div className="mb-4"><h3 className="text-sm font-medium text-zinc-200">Follow-up overview</h3><p className="mt-1 text-xs text-zinc-500">Track workflow queues without changing any expert decision.</p></div><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><FollowUpCard title="Needs consensus" description="Conflicting reviews waiting for another expert." count={conflicts.length} item={conflicts[0]} icon={<AlertTriangle size={16} />} tone="amber" /><FollowUpCard title="Unclear images" description="No expert could identify the subject confidently." count={unclear.length} item={unclear[0]} icon={<CircleHelp size={16} />} tone="amber" /><FollowUpCard title="New class requests" description="Potential references that need taxonomy triage." count={newClass.length} item={newClass[0]} icon={<Sparkles size={16} />} tone="sky" /><FollowUpCard title="Verified reviews" description="Resolved decisions available for dataset export." count={verified.length} item={verified[0]} icon={<CheckCircle2 size={16} />} tone="emerald" /></div></div></>}</section>
}
