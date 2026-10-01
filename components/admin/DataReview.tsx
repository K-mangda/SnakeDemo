'use client'

import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, Eye, Filter, RefreshCw, ShieldCheck, Trash2, X } from 'lucide-react'
import Button from '@/components/ui/Button'
import { supabase } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/Toast'
import UnclearImagesModal from '@/components/admin/modals/UnclearImagesModal'

type QueueStatus = 'unclear' | 'waiting_for_new_class'
type QueueItem = { id: string; filename: string; status: QueueStatus; updatedAt: string; imageUrl: string | null }
type QueueResponse = { items: QueueItem[]; counts: { unclear: number; waitingForNewClass: number } }
type QueuePage = { items: QueueItem[]; page: number; totalPages: number; total: number }

function ReviewSkeleton() {
  return <div aria-busy="true" aria-label="Loading data review queues" className="grid animate-pulse gap-6 md:grid-cols-2">{[0, 1].map((item) => <div key={item} className="relative min-h-60 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950/40 p-6"><div className="h-4 w-36 rounded bg-zinc-800" /><div className="mt-3 h-3 w-4/6 rounded bg-zinc-800/80" /><div className="mt-2 h-3 w-3/6 rounded bg-zinc-800/60" /><div className="absolute right-6 top-6 h-14 w-12 rounded bg-zinc-800" /><div className="absolute bottom-6 left-6 right-6 h-10 rounded-lg border border-zinc-800 bg-zinc-900/50" /></div>)}</div>
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
  const [unclearPage, setUnclearPage] = useState<QueuePage>({ items: [], page: 1, totalPages: 1, total: 0 })
  const [unclearQuery, setUnclearQuery] = useState('')
  const [unclearLoading, setUnclearLoading] = useState(false)

  async function request(method: 'GET' | 'PATCH' | 'DELETE', body?: object, path = '/api/admin/data-review') {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) throw new Error('Sign in is required.')
    const response = await fetch(path, { method, headers: { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined, cache: 'no-store' })
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

  async function loadUnclear(page: number, query: string) {
    setUnclearLoading(true)
    try {
      const params = new URLSearchParams({ status: 'unclear', page: String(page), pageSize: '24' })
      if (query) params.set('query', query)
      setUnclearPage(await request('GET', undefined, `/api/admin/data-review?${params.toString()}`) as QueuePage)
    } catch (requestError) {
      showToast(requestError instanceof Error ? requestError.message : 'Could not load unclear images.', 'error')
    } finally { setUnclearLoading(false) }
  }

  function open(status: QueueStatus) {
    setOpenQueue(status)
    setSelectedIds([])
    setConfirmAction(null)
    if (status === 'unclear') {
      setUnclearQuery('')
      void loadUnclear(1, '')
    }
  }

  function toggle(id: string) {
    setSelectedIds(current => {
      if (current.includes(id)) return current.filter((item) => item !== id)
      if (current.length >= 100) { showToast('You can select up to 100 images per action.', 'error'); return current }
      return [...current, id]
    })
  }

  function toggleUnclearPageSelection(checked: boolean) {
    const visibleIds = unclearPage.items.map((item) => item.id)
    if (!checked) { setSelectedIds(current => current.filter((id) => !visibleIds.includes(id))); return }
    const next = [...new Set([...selectedIds, ...visibleIds])]
    if (next.length > 100) showToast('You can select up to 100 images per action.', 'error')
    setSelectedIds(next.slice(0, 100))
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

    {loading ? <ReviewSkeleton /> : error ? <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</p> : <div className="grid gap-6 md:grid-cols-2"><article className="group relative flex min-h-60 flex-col justify-between overflow-hidden rounded-xl border border-red-900/30 bg-gradient-to-br from-red-950/20 to-zinc-950/50 p-6"><AlertTriangle size={140} className="pointer-events-none absolute -bottom-8 -right-8 -rotate-12 text-red-500/5" /><div className="relative z-10"><h3 className="flex items-center gap-2 text-base font-medium text-zinc-100"><AlertTriangle size={18} className="text-red-500" /> Unclear images</h3><p className="mt-2 max-w-sm text-sm text-zinc-500">Images experts could not identify confidently. Select real queue items to restore or delete.</p><div className="absolute right-6 top-6 text-right"><span className="block text-6xl font-bold leading-none text-red-400">{unclearCount.toLocaleString()}</span><span className="mt-1 block text-xs text-zinc-500">in queue</span></div></div><Button variant="secondary" onClick={() => open('unclear')} className="relative z-10 mt-6 w-full justify-center border-red-500/30 bg-red-500/5 text-red-300 hover:bg-red-500/15"><Trash2 size={16} /> Review unclear queue</Button></article><article className="group relative flex min-h-60 flex-col justify-between overflow-hidden rounded-xl border border-blue-900/30 bg-gradient-to-br from-blue-950/20 to-zinc-950/50 p-6"><ShieldCheck size={140} className="pointer-events-none absolute -bottom-8 -right-8 rotate-12 text-blue-500/5" /><div className="relative z-10"><h3 className="flex items-center gap-2 text-base font-medium text-zinc-100"><ShieldCheck size={18} className="text-blue-500" /> New class anomalies</h3><p className="mt-2 max-w-sm text-sm text-zinc-500">Images flagged for taxonomy review before a new class could be considered.</p><div className="absolute right-6 top-6 text-right"><span className="block text-6xl font-bold leading-none text-blue-400">{newClassCount.toLocaleString()}</span><span className="mt-1 block text-xs text-zinc-500">awaiting inspection</span></div></div><Button variant="secondary" onClick={() => open('waiting_for_new_class')} className="relative z-10 mt-6 w-full justify-center border-blue-500/30 bg-blue-500/5 text-blue-300 hover:bg-blue-500/15"><Eye size={16} /> Inspect requests</Button></article></div>}

    {openQueue === 'unclear' && <UnclearImagesModal items={unclearPage.items} total={unclearPage.total} page={unclearPage.page} totalPages={unclearPage.totalPages} loading={unclearLoading} query={unclearQuery} selectedIds={selectedIds} onSelectToggle={toggle} onSelectAllToggle={toggleUnclearPageSelection} onPageChange={(page) => void loadUnclear(page, unclearQuery)} onSearch={(query) => { setUnclearQuery(query); void loadUnclear(1, query) }} onRestore={() => setConfirmAction('restore')} onDelete={() => setConfirmAction('delete')} onClose={() => setOpenQueue(null)} />}

    {openQueue === 'waiting_for_new_class' && <div role="dialog" aria-modal="true" aria-labelledby="review-queue-title" className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"><div className="flex max-h-[85vh] w-full max-w-3xl flex-col rounded-2xl border border-zinc-700 bg-zinc-950 p-6 shadow-2xl"><div className="flex items-start justify-between gap-4 border-b border-zinc-800 pb-4"><div><h3 id="review-queue-title" className="text-lg font-medium text-zinc-100">New class requests</h3><p className="mt-1 text-sm text-zinc-500">Read-only inspection. Reassignment and species creation will be enabled when their backend workflow is defined.</p></div><button type="button" onClick={() => setOpenQueue(null)} className="rounded-lg p-1 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200" aria-label="Close"><X size={20} /></button></div><div className="mt-4 min-h-0 flex-1 overflow-y-auto pr-1">{queueItems.length ? <div className="space-y-3">{queueItems.map((item) => <div key={item.id} className="flex gap-4 rounded-xl border border-zinc-800 bg-zinc-900/20 p-3"><div className="grid h-16 w-24 shrink-0 place-items-center overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900">{item.imageUrl ? <img src={item.imageUrl} alt="Queued scan" className="h-full w-full object-cover" /> : <Eye size={17} className="text-zinc-600" />}</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-zinc-200" title={item.filename}>{item.filename}</p><p className="mt-1 text-xs text-zinc-500">Updated {new Date(item.updatedAt).toLocaleString()}</p></div></div>)}</div> : <p className="py-10 text-center text-sm text-zinc-500">No queued images are currently available.</p>}</div></div></div>}

    {confirmAction && <div role="dialog" aria-modal="true" aria-labelledby="confirm-review-action-title" className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"><div className="w-full max-w-md rounded-2xl border border-zinc-700 bg-zinc-950 p-6 shadow-2xl"><h3 id="confirm-review-action-title" className="text-lg font-medium text-zinc-100">{confirmAction === 'restore' ? 'Restore selected images?' : 'Delete selected images permanently?'}</h3><p className="mt-3 text-sm leading-6 text-zinc-400">{confirmAction === 'restore' ? `${selectedIds.length} selected image${selectedIds.length === 1 ? '' : 's'} will return to the pending expert review queue. Existing review history will be preserved.` : `${selectedIds.length} selected unclear image${selectedIds.length === 1 ? '' : 's'} and their stored files will be permanently deleted.`}</p><div className="mt-6 flex justify-end gap-3"><Button variant="ghost" disabled={acting} onClick={() => setConfirmAction(null)}>Cancel</Button><Button variant={confirmAction === 'delete' ? 'danger' : 'secondary'} disabled={acting} onClick={() => void runAction()}>{acting ? 'Working…' : confirmAction === 'restore' ? 'Restore images' : 'Delete permanently'}</Button></div></div></div>}
  </section>
}
