'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle, Filter, RefreshCw, ShieldCheck } from 'lucide-react'
import Button from '@/components/ui/Button'
import { supabase } from '@/lib/supabase/client'

type ReviewCounts = { unclear: number; waitingForNewClass: number }

function ReviewSkeleton() {
  return <div className="grid animate-pulse gap-6 md:grid-cols-2"><div className="h-60 rounded-xl border border-zinc-800 bg-zinc-950/40" /><div className="h-60 rounded-xl border border-zinc-800 bg-zinc-950/40" /></div>
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
        <h2 className="flex items-center gap-2 text-lg font-medium text-zinc-100"><Filter size={20} className="text-red-500" /> Data review queues</h2>
        <p className="mt-2 text-sm text-zinc-500">Current queues from the database. Actions remain read-only until their backend workflows are configured.</p>
      </div>
      <Button variant="ghost" size="sm" disabled={loading} onClick={() => void load()}><RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh</Button>
    </div>

    {loading ? <ReviewSkeleton /> : error ? <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</p> : <div className="grid gap-6 md:grid-cols-2"><article className="group relative flex min-h-60 flex-col justify-between overflow-hidden rounded-xl border border-red-900/30 bg-gradient-to-br from-red-950/20 to-zinc-950/50 p-6"><AlertTriangle size={140} className="pointer-events-none absolute -bottom-8 -right-8 -rotate-12 text-red-500/5" /><div className="relative z-10"><h3 className="flex items-center gap-2 text-base font-medium text-zinc-100"><AlertTriangle size={18} className="text-red-500" /> Unclear images</h3><p className="mt-2 max-w-sm text-sm text-zinc-500">Images experts could not identify confidently. Their count is read directly from the review queue.</p><div className="mt-8 flex items-baseline gap-2"><span className="text-4xl font-bold text-red-400">{counts?.unclear.toLocaleString()}</span><span className="text-sm text-zinc-500">in queue</span></div></div><p className="relative z-10 mt-6 text-xs text-zinc-500">Read-only — delete and restore are not configured.</p></article><article className="group relative flex min-h-60 flex-col justify-between overflow-hidden rounded-xl border border-blue-900/30 bg-gradient-to-br from-blue-950/20 to-zinc-950/50 p-6"><ShieldCheck size={140} className="pointer-events-none absolute -bottom-8 -right-8 rotate-12 text-blue-500/5" /><div className="relative z-10"><h3 className="flex items-center gap-2 text-base font-medium text-zinc-100"><ShieldCheck size={18} className="text-blue-500" /> New class anomalies</h3><p className="mt-2 max-w-sm text-sm text-zinc-500">Images flagged for taxonomy review before a new class could be considered.</p><div className="mt-8 flex items-baseline gap-2"><span className="text-4xl font-bold text-blue-400">{counts?.waitingForNewClass.toLocaleString()}</span><span className="text-sm text-zinc-500">awaiting inspection</span></div></div><p className="relative z-10 mt-6 text-xs text-zinc-500">Read-only — reassignment and species creation are not configured.</p></article></div>}
  </section>
}
