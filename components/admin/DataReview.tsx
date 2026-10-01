'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle, Filter, LockKeyhole, RefreshCw, ShieldCheck } from 'lucide-react'
import Button from '@/components/ui/Button'
import { supabase } from '@/lib/supabase/client'

type ReviewCounts = { unclear: number; waitingForNewClass: number }

function ReviewSkeleton() {
  return <div className="grid animate-pulse gap-4 md:grid-cols-2"><div className="h-36 rounded-xl border border-zinc-800 bg-zinc-950/40" /><div className="h-36 rounded-xl border border-zinc-800 bg-zinc-950/40" /></div>
}

export default function DataReview() {
  const [counts, setCounts] = useState<ReviewCounts | null>(null)
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
      if (!response.ok) throw new Error(payload.detail ?? 'Could not load review queues.')
      setCounts({ unclear: payload.counts.unclear ?? 0, waitingForNewClass: payload.counts.waitingForNewClass ?? 0 })
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Could not load review queues.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load() }, [])

  return <section className="mb-12 rounded-xl border border-zinc-800 bg-zinc-900/20 p-6 transition-all duration-300">
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h2 className="flex items-center gap-2 text-lg font-medium text-zinc-100"><Filter size={20} className="text-amber-400" /> Data review queues</h2>
        <p className="mt-2 text-sm text-zinc-500">Current queues from the database. This panel is read-only while delete, restore, reassignment, and species creation have no backend workflow.</p>
      </div>
      <Button variant="ghost" size="sm" disabled={loading} onClick={() => void load()}><RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh</Button>
    </div>

    {loading ? <ReviewSkeleton /> : error ? <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</p> : <><div className="grid gap-4 md:grid-cols-2"><article className="rounded-xl border border-amber-500/20 bg-amber-500/[0.035] p-5"><div className="flex items-start justify-between gap-4"><div><p className="flex items-center gap-2 text-sm font-medium text-zinc-200"><AlertTriangle size={17} className="text-amber-400" /> Unclear images</p><p className="mt-2 text-xs leading-5 text-zinc-500">Images that experts could not identify confidently.</p></div><span className="font-mono text-3xl text-amber-300">{counts?.unclear.toLocaleString()}</span></div><p className="mt-5 border-t border-amber-500/15 pt-3 text-xs text-zinc-500">No delete or restore action is configured.</p></article><article className="rounded-xl border border-sky-500/20 bg-sky-500/[0.035] p-5"><div className="flex items-start justify-between gap-4"><div><p className="flex items-center gap-2 text-sm font-medium text-zinc-200"><ShieldCheck size={17} className="text-sky-400" /> New class requests</p><p className="mt-2 text-xs leading-5 text-zinc-500">Images waiting for taxonomy review before a class can be added.</p></div><span className="font-mono text-3xl text-sky-300">{counts?.waitingForNewClass.toLocaleString()}</span></div><p className="mt-5 border-t border-sky-500/15 pt-3 text-xs text-zinc-500">No reassignment or species-creation workflow is configured.</p></article></div><div className="mt-4 flex items-start gap-2 rounded-lg border border-zinc-800 bg-zinc-950/35 px-4 py-3 text-xs leading-5 text-zinc-500"><LockKeyhole size={15} className="mt-0.5 shrink-0 text-zinc-400" /> Individual review details remain available in Consensus Audit below; this summary intentionally does not modify any image or taxonomy data.</div></>}
  </section>
}
