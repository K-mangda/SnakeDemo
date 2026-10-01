'use client'

import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { AlertTriangle, ArrowRight, CheckCircle2, ChevronDown, CircleHelp, ClipboardCheck, Eye, RefreshCw, Sparkles } from 'lucide-react'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { supabase } from '@/lib/supabase/client'
import { readAdminCache, writeAdminCache } from '@/lib/admin-cache'

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

function QueueRow({ title, description, count, item, icon: _icon, tone }: { title: string; description: string; count: number; item?: AuditItem; icon: ReactNode; tone: 'amber' | 'sky' | 'emerald' }) {
  const markers = { amber: 'bg-amber-400', red: 'bg-red-400', sky: 'bg-sky-400', violet: 'bg-violet-400', emerald: 'bg-emerald-400' }
  const resolvedTone = title === 'Unclear images' ? 'red' : title === 'New class requests' ? 'violet' : tone
  return <div className="grid gap-3 px-5 py-4 transition-colors hover:bg-zinc-800/30 sm:grid-cols-[minmax(0,1fr)_88px_100px] sm:items-center"><div className="min-w-0"><div className="flex items-center gap-2"><span className={`h-1.5 w-1.5 shrink-0 rounded-full ${markers[resolvedTone]}`} /><p className="text-sm font-medium text-zinc-200">{title}</p></div><p className="mt-1 pl-3.5 text-xs text-zinc-500">{description}</p></div><div className={`font-mono text-lg font-semibold sm:text-right ${count === 0 ? 'text-zinc-500' : 'text-zinc-100'}`}>{count}</div><div className="sm:text-right">{item ? <Button href={`/admin/reviews/${item.id}`} variant="ghost" size="sm" className="-ml-2 text-zinc-300 hover:text-zinc-100 sm:ml-0">Inspect <ArrowRight size={14} /></Button> : <span className="text-xs text-zinc-600">—</span>}</div></div>
}

export default function ConsensusAudit() {
  const [items, setItems] = useState<AuditItem[]>(() => readAdminCache<AuditItem[]>('consensus-audit') ?? [])
  const [loading, setLoading] = useState(() => readAdminCache<AuditItem[]>('consensus-audit') === null)
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
      const nextItems = payload.items ?? []
      setItems(nextItems)
      writeAdminCache('consensus-audit', nextItems)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Could not load consensus audit.')
    } finally { setLoading(false) }
  }

  useEffect(() => { if (readAdminCache<AuditItem[]>('consensus-audit') === null) void load() }, [])
  const conflicts = useMemo(() => items.filter((item) => item.status === 'pending' && item.reviews.length > 1), [items])
  const unclear = useMemo(() => items.filter((item) => item.status === 'unclear'), [items])
  const newClass = useMemo(() => items.filter((item) => item.status === 'waiting_for_new_class'), [items])
  const verified = useMemo(() => items.filter((item) => item.status === 'verified'), [items])

  return <section className="mb-12 rounded-xl border border-zinc-800 bg-zinc-900/20 p-6"><div className="flex flex-wrap items-start justify-between gap-4"><div><div className="flex items-center gap-3"><h2 className="flex items-center gap-2 text-lg font-medium text-zinc-100"><ClipboardCheck size={20} className="text-amber-400" /> Expert review conflicts</h2><span className={'rounded-full px-2 py-0.5 text-xs font-medium ' + (conflicts.length ? 'bg-amber-500/10 text-amber-300' : 'bg-zinc-800 text-zinc-500')}>{conflicts.length} open</span></div><p className="mt-2 text-sm text-zinc-500">Only cases with conflicting expert decisions appear here.</p></div><Button variant="ghost" size="sm" disabled={loading} onClick={() => void load()}><RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh</Button></div>{loading ? <div aria-busy="true" aria-label="Loading review conflicts" className="mt-5 animate-pulse"><div className="h-24 rounded-lg border border-zinc-800 bg-zinc-900/40" /></div> : error ? <p className="mt-5 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</p> : conflicts.length ? <div className="mt-5 space-y-3">{conflicts.map((item) => <ConflictCard key={item.id} item={item} open={openId === item.id} onToggle={() => setOpenId(current => current === item.id ? null : item.id)} />)}</div> : <div className="mt-5 flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-950/40 px-4 py-4"><ClipboardCheck size={18} className="shrink-0 text-zinc-600" /><div><p className="text-sm font-medium text-zinc-300">No conflicts need attention</p><p className="mt-1 text-xs text-zinc-500">New disagreements will appear here for an additional expert decision.</p></div></div>}</section>
}
