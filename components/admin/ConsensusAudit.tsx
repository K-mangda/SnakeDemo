'use client'

import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { AlertTriangle, ArrowRight, CheckCircle2, ChevronDown, CircleHelp, ClipboardCheck, Eye, RefreshCw, Sparkles } from 'lucide-react'
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

function QueueRow({ title, description, count, item, icon, tone }: { title: string; description: string; count: number; item?: AuditItem; icon: ReactNode; tone: 'amber' | 'sky' | 'emerald' }) {
  const tones = { amber: 'text-amber-400', sky: 'text-sky-400', emerald: 'text-emerald-400' }
  return <div className="grid gap-3 px-5 py-4 transition-colors hover:bg-zinc-800/30 sm:grid-cols-[minmax(0,1fr)_88px_100px] sm:items-center"><div className="flex min-w-0 items-start gap-3"><span className={`mt-0.5 shrink-0 ${tones[tone]}`}>{icon}</span><div className="min-w-0"><p className="text-sm font-medium text-zinc-200">{title}</p><p className="mt-1 text-xs text-zinc-500">{description}</p></div></div><div className={`font-mono text-lg font-semibold sm:text-right ${tones[tone]}`}>{count}</div><div className="sm:text-right">{item ? <Button href={`/admin/reviews/${item.id}`} variant="ghost" size="sm" className="-ml-2 text-zinc-300 hover:text-zinc-100 sm:ml-0">Inspect <ArrowRight size={14} /></Button> : <span className="text-xs text-zinc-600">—</span>}</div></div>
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

  return <section className="mb-12 rounded-xl border border-zinc-800 bg-zinc-900/20 p-6"><div className="mb-6 flex flex-wrap items-start justify-between gap-4"><div><h2 className="flex items-center gap-2 text-lg font-medium text-zinc-100"><ClipboardCheck size={20} className="text-amber-400" /> Review conflicts</h2><p className="mt-1 text-sm text-zinc-500">Only images that need an additional expert decision are shown first.</p></div><Button variant="ghost" size="sm" disabled={loading} onClick={() => void load()}><RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh</Button></div>{loading ? <div aria-busy="true" aria-label="Loading review conflicts" className="animate-pulse"><div className="mb-6 h-5 w-56 rounded bg-zinc-800" /><div className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900/40">{Array.from({ length: 4 }, (_, index) => <div key={index} className="h-[72px] border-b border-zinc-800 last:border-b-0" />)}</div></div> : error ? <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</p> : <><div className="flex items-center gap-2 text-sm text-zinc-500">{conflicts.length ? <Badge variant="warning"><AlertTriangle size={13} /> {conflicts.length} needs consensus</Badge> : <Badge variant="success"><CheckCircle2 size={13} /> No review conflicts</Badge>}<span>Updated from the current expert review records.</span></div><div className="mt-6 border-t border-zinc-800 pt-5"><div className="mb-3 flex items-center justify-between"><h3 className="text-sm font-medium text-zinc-200">Review queue status</h3><span className="text-xs text-zinc-600">4 statuses</span></div><div className="overflow-hidden rounded-lg border border-zinc-700/80 bg-zinc-900/50"><div className="hidden border-b border-zinc-800 bg-zinc-900/70 px-5 py-2 text-[11px] font-medium uppercase tracking-wider text-zinc-500 sm:grid sm:grid-cols-[minmax(0,1fr)_88px_100px]"><span>Status</span><span className="text-right">Items</span><span className="text-right">Action</span></div><QueueRow title="Needs consensus" description="Conflicting reviews waiting for another expert decision." count={conflicts.length} item={conflicts[0]} icon={<AlertTriangle size={17} />} tone="amber" /><div className="border-t border-zinc-800" /><QueueRow title="Unclear images" description="No expert could identify the subject confidently." count={unclear.length} item={unclear[0]} icon={<CircleHelp size={17} />} tone="amber" /><div className="border-t border-zinc-800" /><QueueRow title="New class requests" description="Potential references that need taxonomy triage." count={newClass.length} item={newClass[0]} icon={<Sparkles size={17} />} tone="sky" /><div className="border-t border-zinc-800" /><QueueRow title="Verified reviews" description="Resolved decisions available for dataset export." count={verified.length} item={verified[0]} icon={<CheckCircle2 size={17} />} tone="emerald" /></div></div></>}</section>
}
