'use client'

import { use, useEffect, useState } from 'react'
import { ArrowLeft, Eye, LoaderCircle, ScanSearch, Users } from 'lucide-react'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { supabase } from '@/lib/supabase/client'

type Box = { x: number; y: number; width: number; height: number }
type Review = { expert: string; species: string | null; bbox: Box | null; createdAt: string }
type AuditItem = {
  id: string
  imageUrl: string | null
  filename: string
  status: 'pending' | 'verified' | 'unclear' | 'waiting_for_new_class'
  finalSpecies: string | null
  finalBox: Box | null
  reason: string
  reviews: Review[]
  pairs: { leftExpert: string; rightExpert: string; value: number | null }[]
}

const boxColors = ['border-sky-400 bg-sky-400/10', 'border-violet-400 bg-violet-400/10', 'border-amber-400 bg-amber-400/10', 'border-pink-400 bg-pink-400/10']
const labelColors = ['bg-sky-400 text-zinc-950', 'bg-violet-400 text-zinc-950', 'bg-amber-400 text-zinc-950', 'bg-pink-400 text-zinc-950']

function boxStyle(box: Box) {
  return { left: `${box.x}%`, top: `${box.y}%`, width: `${box.width}%`, height: `${box.height}%` }
}

export default function AdminReviewInspector({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [item, setItem] = useState<AuditItem | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) throw new Error('Sign in is required.')
        const response = await fetch(`/api/admin/consensus?imageId=${encodeURIComponent(id)}`, { headers: { Authorization: `Bearer ${session.access_token}` } })
        const payload = await response.json()
        if (!response.ok) throw new Error(payload.detail ?? 'Could not load this review.')
        if (!payload.items?.[0]) throw new Error('Review not found.')
        setItem(payload.items[0])
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : 'Could not load this review.')
      }
    }
    void load()
  }, [id])

  if (error) return <main className="grid min-h-screen place-items-center bg-zinc-950 px-6"><div className="text-center"><p className="text-sm text-red-300">{error}</p><Button href="/admin" variant="ghost" className="mt-4">Back to Admin</Button></div></main>
  if (!item) return <main className="grid min-h-screen place-items-center bg-zinc-950 text-sm text-zinc-500"><LoaderCircle size={18} className="mr-2 animate-spin" /> Loading read-only audit…</main>

  const status = item.status === 'pending' ? { label: 'Needs consensus', variant: 'warning' as const } : item.status === 'verified' ? { label: 'Verified', variant: 'success' as const } : item.status === 'unclear' ? { label: 'Unclear', variant: 'muted' as const } : { label: 'New class', variant: 'info' as const }
  return <main className="min-h-screen bg-zinc-950 px-4 pb-16 pt-24 sm:px-6 sm:pt-28"><div className="mx-auto max-w-6xl"><header className="mb-8 flex flex-wrap items-start justify-between gap-4 border-b border-zinc-900 pb-6"><div><Button href="/admin" variant="ghost" size="sm" className="-ml-2 mb-5"><ArrowLeft size={16} /> Back to Admin</Button><p className="text-xs uppercase tracking-[0.2em] text-amber-400">Read-only audit</p><h1 className="mt-2 text-2xl font-medium text-zinc-100">Review conflict inspector</h1><p className="mt-2 max-w-xl text-sm text-zinc-500">Inspect the original image and every submitted boundary. Editing is intentionally unavailable here.</p></div><Badge variant="muted"><Eye size={14} /> View only</Badge></header>
    <div className="grid gap-7 lg:grid-cols-[minmax(0,1.45fr)_minmax(340px,0.8fr)]"><section className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/20"><div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4"><span className="flex items-center gap-2 text-sm font-medium text-zinc-200"><ScanSearch size={16} className="text-amber-400" /> Expert boundaries</span><span className="text-xs text-zinc-500">{item.reviews.length} review{item.reviews.length === 1 ? '' : 's'}</span></div><div className="flex min-h-[480px] items-center justify-center bg-zinc-950 p-5 sm:p-7">{item.imageUrl ? <div className="relative inline-block max-h-[650px] max-w-full"><img src={item.imageUrl} alt="Reviewed scan" className="block max-h-[650px] max-w-full rounded-lg object-contain" />{item.reviews.map((review, index) => review.bbox && <div key={`${review.expert}-${index}`} className={`pointer-events-none absolute border-2 ${boxColors[index % boxColors.length]}`} style={boxStyle(review.bbox)}><span className={`absolute -top-6 left-0 max-w-[220px] truncate rounded px-2 py-1 text-[10px] font-medium ${labelColors[index % labelColors.length]}`}>{review.expert}</span></div>)}{item.finalBox && <div className="pointer-events-none absolute border-2 border-emerald-300 border-dashed" style={boxStyle(item.finalBox)}><span className="absolute -bottom-6 left-0 rounded bg-emerald-300 px-2 py-1 text-[10px] font-medium text-zinc-950">Final box</span></div>}</div> : <p className="text-sm text-zinc-500">Image unavailable.</p>}</div><div className="border-t border-zinc-800 px-5 py-3 text-xs text-zinc-500">Colored solid boxes are individual expert reviews. The dashed green box is the final dataset box, when one exists.</div></section>
      <aside className="space-y-5"><section className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-5"><div className="flex items-center justify-between gap-3"><p className="text-xs uppercase tracking-widest text-zinc-500">Consensus status</p><Badge variant={status.variant} className="text-xs">{status.label}</Badge></div><p className="mt-4 text-sm leading-6 text-amber-300">{item.reason}</p><div className="mt-5 border-t border-zinc-800 pt-4"><p className="text-xs text-zinc-500">Final species</p><p className="mt-1 text-sm font-medium italic text-zinc-200">{item.finalSpecies ?? 'Not finalized'}</p></div></section><section className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-5"><p className="flex items-center gap-2 text-xs uppercase tracking-widest text-zinc-500"><Users size={14} /> Submitted reviews</p><div className="mt-4 space-y-3">{item.reviews.map((review, index) => <div key={`${review.expert}-${index}`} className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-3"><div className="flex items-center justify-between gap-3"><span className="truncate text-sm text-zinc-300">{review.expert}</span><span className={`truncate text-xs font-medium ${review.species ? 'italic text-zinc-100' : 'text-amber-400'}`}>{review.species ?? 'Unclear'}</span></div><p className="mt-2 font-mono text-[11px] text-zinc-500">{review.bbox ? `x ${review.bbox.x.toFixed(1)} · y ${review.bbox.y.toFixed(1)} · w ${review.bbox.width.toFixed(1)} · h ${review.bbox.height.toFixed(1)}` : 'No box submitted'}</p></div>)}</div></section>{item.pairs.length > 0 && <section className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-5"><p className="text-xs uppercase tracking-widest text-zinc-500">Box overlap</p><div className="mt-3 space-y-2">{item.pairs.map((pair, index) => <div key={`${pair.leftExpert}-${pair.rightExpert}-${index}`} className="flex items-center justify-between gap-3 rounded-lg border border-zinc-800 bg-zinc-950/50 px-3 py-2.5 text-xs"><span className="truncate text-zinc-400">{pair.leftExpert} ↔ {pair.rightExpert}</span><span className={pair.value !== null && pair.value >= 0.5 ? 'font-medium text-emerald-300' : 'font-medium text-amber-300'}>{pair.value === null ? 'Not comparable' : `${(pair.value * 100).toFixed(0)}% IoU`}</span></div>)}</div></section>}</aside>
    </div></div></main>
}
