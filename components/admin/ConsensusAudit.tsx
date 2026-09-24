'use client'

import { useEffect, useState } from 'react'
import { ChevronDown, ClipboardCheck, RefreshCw, Users } from 'lucide-react'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { supabase } from '@/lib/supabase/client'

type Box = { x: number; y: number; width: number; height: number }
type AuditItem = {
  id: string
  filename: string
  status: 'pending' | 'verified' | 'unclear' | 'waiting_for_new_class'
  updatedAt: string
  finalSpecies: string | null
  finalBox: Box | null
  reason: string
  reviews: { expert: string; species: string | null; bbox: Box | null; createdAt: string }[]
  pairs: { leftExpert: string; rightExpert: string; value: number | null }[]
}

const statusStyle = {
  verified: { label: 'Verified', variant: 'success' as const },
  pending: { label: 'Needs consensus', variant: 'warning' as const },
  unclear: { label: 'Unclear', variant: 'muted' as const },
  waiting_for_new_class: { label: 'New class', variant: 'info' as const },
}

function formatBox(box: Box | null) {
  if (!box) return 'No box'
  return `x ${box.x.toFixed(1)} · y ${box.y.toFixed(1)} · w ${box.width.toFixed(1)} · h ${box.height.toFixed(1)}`
}

export default function ConsensusAudit() {
  const [items, setItems] = useState<AuditItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [openId, setOpenId] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Sign in is required.')
      const response = await fetch('/api/admin/consensus', { headers: { Authorization: `Bearer ${session.access_token}` } })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.detail ?? 'Could not load consensus audit.')
      setItems(payload.items ?? [])
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Could not load consensus audit.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load() }, [])

  return <section className="mb-12 rounded-xl border border-zinc-800 bg-zinc-900/20 p-6">
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div><h2 className="flex items-center gap-2 text-lg font-medium text-zinc-100"><ClipboardCheck size={20} className="text-emerald-400" /> Review consensus audit</h2><p className="mt-1 text-sm text-zinc-500">See why a reviewed image is verified or needs another expert.</p></div>
      <Button variant="ghost" size="sm" disabled={loading} onClick={() => void load()}><RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh</Button>
    </div>

    {loading ? <p className="py-8 text-center text-sm text-zinc-500">Loading review consensus…</p> : error ? <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</p> : items.length === 0 ? <p className="rounded-lg border border-zinc-800 bg-zinc-950/40 px-4 py-8 text-center text-sm text-zinc-500">No expert reviews have been recorded yet.</p> : <div className="space-y-3">{items.map((item) => {
      const state = statusStyle[item.status]
      const open = openId === item.id
      return <article key={item.id} className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950/40">
        <button type="button" onClick={() => setOpenId(open ? null : item.id)} className="flex w-full items-center gap-4 px-4 py-3.5 text-left hover:bg-zinc-900/60">
          <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-zinc-200">{item.filename}</p><p className="mt-1 text-xs text-zinc-500">{item.reason}</p></div>
          <div className="hidden shrink-0 text-right sm:block"><p className="text-xs text-zinc-500">Final species</p><p className="mt-1 max-w-44 truncate text-xs italic text-zinc-300">{item.finalSpecies ?? 'Not finalized'}</p></div>
          <Badge variant={state.variant} className="shrink-0 text-xs">{state.label}</Badge><ChevronDown size={16} className={`shrink-0 text-zinc-500 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
        {open && <div className="border-t border-zinc-800 px-4 py-4"><div className="mb-4 flex flex-wrap items-center gap-2 text-xs text-zinc-500"><Users size={14} /> {item.reviews.length} independent review{item.reviews.length === 1 ? '' : 's'}{item.finalBox && <><span className="text-zinc-700">•</span><span>Final box: {formatBox(item.finalBox)}</span></>}</div>
          <div className="grid gap-2 md:grid-cols-2">{item.reviews.map((review, index) => <div key={`${review.expert}-${review.createdAt}-${index}`} className="rounded-lg border border-zinc-800 bg-zinc-900/30 px-3 py-2.5"><div className="flex items-center justify-between gap-3"><span className="truncate text-xs text-zinc-400">{review.expert}</span><span className={`truncate text-xs font-medium ${review.species ? 'italic text-zinc-200' : 'text-amber-400'}`}>{review.species ?? 'Unclear'}</span></div><p className="mt-2 font-mono text-[11px] text-zinc-500">{formatBox(review.bbox)}</p></div>)}</div>
          {item.pairs.length > 0 && <div className="mt-4 border-t border-zinc-800 pt-4"><p className="mb-2 text-xs font-medium uppercase tracking-wider text-zinc-500">Box overlap (IoU)</p><div className="flex flex-wrap gap-2">{item.pairs.map((pair, index) => <span key={`${pair.leftExpert}-${pair.rightExpert}-${index}`} className={`rounded-md border px-2.5 py-1.5 text-xs ${pair.value !== null && pair.value >= 0.5 ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300' : 'border-amber-500/30 bg-amber-500/10 text-amber-300'}`}>{pair.leftExpert} ↔ {pair.rightExpert}: {pair.value === null ? 'No comparable boxes' : `${(pair.value * 100).toFixed(0)}%`}</span>)}</div></div>}
        </div>}
      </article>
    })}</div>}
  </section>
}
