'use client'

import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, Eye, Filter, RefreshCw, RotateCcw, ShieldCheck, Trash2, X } from 'lucide-react'
import Button from '@/components/ui/Button'
import { supabase } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/Toast'

type QueueStatus = 'unclear' | 'waiting_for_new_class'
type QueueItem = { id: string; filename: string; status: QueueStatus; updatedAt: string; imageUrl: string | null }
type QueueResponse = { items: QueueItem[]; counts: { unclear: number; waitingForNewClass: number } }

function ReviewSkeleton() {
  return <div className="grid animate-pulse gap-6 md:grid-cols-2"><div className="h-60 rounded-xl border border-zinc-800 bg-zinc-950/40" /><div className="h-60 rounded-xl border border-zinc-800 bg-zinc-950/40" /></div>
}

export default function DataReview() {
  const { showToast } = useToast()
  const [data, setData] = useState<QueueResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [openQueue, setOpenQueue] = useState<QueueStatus | null>(null)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [confirmAction, setConfirmAction] = useState<'restore' | 'delete' | null>(null)
  const [acting, setActing] = useState(false)

  async function request(method: 'GET' | 'PATCH' | 'DELETE', body?: object) {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) throw new Error('Sign in is required.')
    const response = await fetch('/api/admin/data-review', { method, headers: { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined, cache: 'no-store' })
    const payload = await response.json()
    if (!response.ok) throw new Error(payload.detail ?? 'Could not update the review queue.')
    return payload
  }

  async function load() {
    setLoading(true)
    setError(null)
    try { setData(await request('GET') as QueueResponse) } catch (requestError) { setError(requestError instanceof Error ? requestError.message : 'Could not load review queues.') } finally { setLoading(false) }
  }

  useEffect(() => { void load() }, [])

  const queueItems = useMemo(() => data?.items.filter((item) => item.status === openQueue) ?? [], [data, openQueue])
  const unclearItems = useMemo(() => data?.items.filter((item) => item.status === 'unclear') ?? [], [data])

  function open(status: QueueStatus) {
    setOpenQueue(status)
    setSelectedIds([])
    setConfirmAction(null)
  }

  function toggle(id: string) {
    setSelectedIds(current => current.includes(id) ? current.filter((item) => item !== id) : [...current, id])
  }

  async function runAction() {
    if (!confirmAction || selectedIds.length === 0) return
    setActing(true)
    try {
      const payload = await request(confirmAction === 'restore' ? 'PATCH' : 'DELETE', { action: 'restore_unclear', ids: selectedIds })
      const count = confirmAction === 'restore' ? payload.restored : payload.deleted
      showToast(confirmAction === 'restore' ? `${count} image${count === 1 ? '' : 's'} returned to the pending review queue.` : `${count} image${count === 1 ? '' : 's'} deleted permanently.`)
      if (confirmAction === 'delete' && payload.storageCleaned === false) showToast(payload.detail ?? 'Some storage files could not be removed.', 'error')
      setConfirmAction(null)
      setOpenQueue(null)
      setSelectedIds([])
      await load()
    } catch (requestError) {
      showToast(requestError instanceof Error ? requestError.message : 'Could not update the review queue.', 'error')
    } finally { setActing(false) }
  }

  const unclearCount = data?.counts.unclear ?? 0
  const newClassCount = data?.counts.waitingForNewClass ?? 0

  return <section className="mb-12 rounded-xl border border-zinc-800 bg-zinc-900/20 p-6 transition-all duration-300">
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4"><div><h2 className="flex items-center gap-2 text-lg font-medium text-zinc-100"><Filter size={20} className="text-red-500" /> Data review queues</h2><p className="mt-2 text-sm text-zinc-500">Review queues from the database. Unclear images can be restored or permanently removed; new-class requests are available for inspection.</p></div><Button variant="ghost" size="sm" disabled={loading} onClick={() => void load()}><RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh</Button></div>

    {loading ? <ReviewSkeleton /> : error ? <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</p> : <div className="grid gap-6 md:grid-cols-2"><article className="group relative flex min-h-60 flex-col justify-between overflow-hidden rounded-xl border border-red-900/30 bg-gradient-to-br from-red-950/20 to-zinc-950/50 p-6"><AlertTriangle size={140} className="pointer-events-none absolute -bottom-8 -right-8 -rotate-12 text-red-500/5" /><div className="relative z-10"><h3 className="flex items-center gap-2 text-base font-medium text-zinc-100"><AlertTriangle size={18} className="text-red-500" /> Unclear images</h3><p className="mt-2 max-w-sm text-sm text-zinc-500">Images experts could not identify confidently. Select real queue items to restore or delete.</p><div className="mt-8 flex items-baseline gap-2"><span className="text-4xl font-bold text-red-400">{unclearCount.toLocaleString()}</span><span className="text-sm text-zinc-500">in queue</span></div></div><Button variant="secondary" onClick={() => open('unclear')} className="relative z-10 mt-6 w-full justify-center border-red-500/30 bg-red-500/5 text-red-300 hover:bg-red-500/15"><Trash2 size={16} /> Review unclear queue</Button></article><article className="group relative flex min-h-60 flex-col justify-between overflow-hidden rounded-xl border border-blue-900/30 bg-gradient-to-br from-blue-950/20 to-zinc-950/50 p-6"><ShieldCheck size={140} className="pointer-events-none absolute -bottom-8 -right-8 rotate-12 text-blue-500/5" /><div className="relative z-10"><h3 className="flex items-center gap-2 text-base font-medium text-zinc-100"><ShieldCheck size={18} className="text-blue-500" /> New class anomalies</h3><p className="mt-2 max-w-sm text-sm text-zinc-500">Images flagged for taxonomy review before a new class could be considered.</p><div className="mt-8 flex items-baseline gap-2"><span className="text-4xl font-bold text-blue-400">{newClassCount.toLocaleString()}</span><span className="text-sm text-zinc-500">awaiting inspection</span></div></div><Button variant="secondary" onClick={() => open('waiting_for_new_class')} className="relative z-10 mt-6 w-full justify-center border-blue-500/30 bg-blue-500/5 text-blue-300 hover:bg-blue-500/15"><Eye size={16} /> Inspect requests</Button></article></div>}

    {openQueue && <div role="dialog" aria-modal="true" aria-labelledby="review-queue-title" className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"><div className="flex max-h-[85vh] w-full max-w-3xl flex-col rounded-2xl border border-zinc-700 bg-zinc-950 p-6 shadow-2xl"><div className="flex items-start justify-between gap-4 border-b border-zinc-800 pb-4"><div><h3 id="review-queue-title" className="text-lg font-medium text-zinc-100">{openQueue === 'unclear' ? 'Review unclear images' : 'New class requests'}</h3><p className="mt-1 text-sm text-zinc-500">{openQueue === 'unclear' ? 'Restore sends selected images to the pending expert queue. Delete removes selected records and their stored files permanently.' : 'Read-only inspection. Reassignment and species creation will be enabled when their backend workflow is defined.'}</p></div><button type="button" onClick={() => setOpenQueue(null)} className="rounded-lg p-1 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200" aria-label="Close"><X size={20} /></button></div><div className="mt-4 min-h-0 flex-1 overflow-y-auto pr-1">{queueItems.length ? <div className="space-y-3">{queueItems.map((item) => <label key={item.id} className={`flex gap-4 rounded-xl border p-3 ${openQueue === 'unclear' && selectedIds.includes(item.id) ? 'border-red-500/50 bg-red-500/5' : 'border-zinc-800 bg-zinc-900/20'}`}><div className="grid h-16 w-24 shrink-0 place-items-center overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900">{item.imageUrl ? <img src={item.imageUrl} alt="Queued scan" className="h-full w-full object-cover" /> : <Eye size={17} className="text-zinc-600" />}</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-zinc-200" title={item.filename}>{item.filename}</p><p className="mt-1 text-xs text-zinc-500">Updated {new Date(item.updatedAt).toLocaleString()}</p></div>{openQueue === 'unclear' && <input type="checkbox" checked={selectedIds.includes(item.id)} onChange={() => toggle(item.id)} className="mt-1 h-4 w-4 accent-red-500" aria-label={`Select ${item.filename}`} />}</label>)}</div> : <p className="py-10 text-center text-sm text-zinc-500">No queued images are currently available.</p>}</div>{openQueue === 'unclear' && <div className="mt-5 flex flex-wrap justify-end gap-3 border-t border-zinc-800 pt-4"><Button variant="ghost" onClick={() => setOpenQueue(null)}>Cancel</Button><Button variant="secondary" disabled={selectedIds.length === 0} onClick={() => setConfirmAction('restore')}><RotateCcw size={16} /> Restore to pending</Button><Button variant="danger" disabled={selectedIds.length === 0} onClick={() => setConfirmAction('delete')}><Trash2 size={16} /> Delete selected</Button></div>}</div></div>}

    {confirmAction && <div role="dialog" aria-modal="true" aria-labelledby="confirm-review-action-title" className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"><div className="w-full max-w-md rounded-2xl border border-zinc-700 bg-zinc-950 p-6 shadow-2xl"><h3 id="confirm-review-action-title" className="text-lg font-medium text-zinc-100">{confirmAction === 'restore' ? 'Restore selected images?' : 'Delete selected images permanently?'}</h3><p className="mt-3 text-sm leading-6 text-zinc-400">{confirmAction === 'restore' ? `${selectedIds.length} selected image${selectedIds.length === 1 ? '' : 's'} will return to the pending expert review queue. Existing review history will be preserved.` : `${selectedIds.length} selected unclear image${selectedIds.length === 1 ? '' : 's'} and their stored files will be permanently deleted.`}</p><div className="mt-6 flex justify-end gap-3"><Button variant="ghost" disabled={acting} onClick={() => setConfirmAction(null)}>Cancel</Button><Button variant={confirmAction === 'delete' ? 'danger' : 'secondary'} disabled={acting} onClick={() => void runAction()}>{acting ? 'Working…' : confirmAction === 'restore' ? 'Restore images' : 'Delete permanently'}</Button></div></div></div>}
  </section>
}
