'use client'

import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, ArrowRight, Eye, Filter, RefreshCw, ShieldCheck, Trash2 } from 'lucide-react'
import Button from '@/components/ui/Button'
import { supabase } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/Toast'
import UnclearImagesModal from '@/components/admin/modals/UnclearImagesModal'
import NewClassAnomalyModal, { type NewClassQueueItem } from '@/components/admin/modals/NewClassAnomalyModal'
import { readAdminCache, writeAdminCache } from '@/lib/admin-cache'
import { onAdminRefresh } from '@/lib/admin-refresh'

type QueueStatus = 'unclear' | 'waiting_for_new_class'
type QueueItem = { id: string; filename: string; status: QueueStatus; updatedAt: string; imageUrl: string | null }
type QueueResponse = { items: QueueItem[]; counts: { unclear: number; waitingForNewClass: number } }
type QueuePage = { items: QueueItem[]; page: number; totalPages: number; total: number }

function ReviewSkeleton() {
  return <div aria-busy="true" aria-label="Loading data review queues" className="animate-pulse divide-y divide-zinc-800">{[0, 1].map((item) => <div key={item} className="grid min-h-24 gap-4 px-5 py-5 sm:grid-cols-[minmax(0,1fr)_72px_128px] sm:items-center"><div><div className="h-4 w-36 rounded bg-zinc-800" /><div className="mt-3 h-3 w-4/6 rounded bg-zinc-800/80" /></div><div className="h-6 w-10 rounded bg-zinc-800 sm:justify-self-end" /><div className="h-8 w-28 rounded bg-zinc-800 sm:justify-self-end" /></div>)}</div>
}

export default function DataReview({ embedded = false }: { embedded?: boolean }) {
  const { showToast } = useToast()
  const [data, setData] = useState<QueueResponse | null>(() => readAdminCache<QueueResponse>('data-review') ?? null)
  const [loading, setLoading] = useState(() => readAdminCache<QueueResponse>('data-review') === null)
  const [error, setError] = useState<string | null>(null)
  const [openQueue, setOpenQueue] = useState<QueueStatus | null>(null)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [confirmAction, setConfirmAction] = useState<'restore' | 'delete' | 'return-new-class' | null>(null)
  const [acting, setActing] = useState(false)
  const [unclearPage, setUnclearPage] = useState<QueuePage>({ items: [], page: 1, totalPages: 1, total: 0 })
  const [unclearLoading, setUnclearLoading] = useState(false)

  async function request(method: 'GET' | 'POST' | 'PATCH' | 'DELETE', body?: object, path = '/api/admin/data-review') {
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
    try { const nextData = await request('GET') as QueueResponse; setData(nextData); writeAdminCache('data-review', nextData) } catch (requestError) { setError(requestError instanceof Error ? requestError.message : 'Could not load review queues.') } finally { setLoading(false) }
  }

  useEffect(() => {
    if (readAdminCache<QueueResponse>('data-review') === null) void load()
    return onAdminRefresh('review', () => { void load() })
  }, [])

  const queueItems = useMemo(() => data?.items.filter((item) => item.status === openQueue) ?? [], [data, openQueue])

  async function loadUnclear(page: number) {
    setUnclearLoading(true)
    try {
      const params = new URLSearchParams({ status: 'unclear', page: String(page), pageSize: '24' })
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
      void loadUnclear(1)
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
      const payload = await request(confirmAction === 'delete' ? 'DELETE' : 'PATCH', { action: confirmAction === 'return-new-class' ? 'return_new_class_to_pending' : 'restore_unclear', ids: selectedIds })
      const count = confirmAction === 'restore' ? payload.restored : confirmAction === 'return-new-class' ? payload.returned : payload.deleted
      showToast(confirmAction === 'delete' ? `${count} image${count === 1 ? '' : 's'} deleted permanently.` : `${count} image${count === 1 ? '' : 's'} returned to the pending review queue.`)
      if (confirmAction === 'delete' && payload.storageCleaned === false) showToast(payload.detail ?? 'Some storage files could not be removed.', 'error')
      setConfirmAction(null)
      setOpenQueue(null)
      setSelectedIds([])
      await load()
    } catch (requestError) {
      showToast(requestError instanceof Error ? requestError.message : 'Could not update the review queue.', 'error')
    } finally { setActing(false) }
  }

  async function createSpeciesForNewClass(item: NewClassQueueItem, species: { scientificName: string; nameTh: string; nameEn: string; family: string }) {
    try {
      const payload = await request('POST', { imageId: item.id, species })
      showToast(payload.species.scientific_name + ' was added to the catalogue. The image is back in expert review.')
      setOpenQueue(null)
      await load()
    } catch (requestError) {
      showToast(requestError instanceof Error ? requestError.message : 'Could not create the species.', 'error')
      throw requestError
    }
  }

  const unclearCount = data?.counts.unclear ?? 0
  const newClassCount = data?.counts.waitingForNewClass ?? 0

  return <section className={embedded ? '' : 'mb-12 rounded-xl border border-zinc-800 bg-zinc-900/20 p-6 transition-all duration-300'}>
    {!embedded && <div className="mb-6"><h2 className="flex items-center gap-2 text-lg font-medium text-zinc-100"><Filter size={20} className="text-red-500" /> Data review queues</h2><p className="mt-2 text-sm text-zinc-500">Review queues from the database. Unclear images can be restored or permanently removed; new-class requests are available for inspection.</p></div>}

    {loading ? <ReviewSkeleton /> : error ? <p className="m-4 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</p> : <div className="divide-y divide-zinc-800"><article className="grid gap-4 px-5 py-5 transition-colors hover:bg-zinc-900/40 sm:grid-cols-[minmax(0,1fr)_72px_128px] sm:items-center"><div className="min-w-0"><h3 className="flex items-center gap-2 text-sm font-medium text-zinc-100"><AlertTriangle size={17} className="text-red-400" /> Unclear images</h3><p className="mt-1 text-xs leading-5 text-zinc-500">Images experts could not identify confidently. Restore or remove selected queue items.</p></div><div className="font-mono text-2xl font-semibold text-zinc-100 sm:text-right">{unclearCount.toLocaleString()}</div><div className="sm:text-right"><Button variant="ghost" size="sm" onClick={() => open('unclear')} className="text-zinc-300 hover:text-zinc-100">Review queue <ArrowRight size={15} /></Button></div></article><article className="grid gap-4 px-5 py-5 transition-colors hover:bg-zinc-900/40 sm:grid-cols-[minmax(0,1fr)_72px_128px] sm:items-center"><div className="min-w-0"><h3 className="flex items-center gap-2 text-sm font-medium text-zinc-100"><ShieldCheck size={17} className="text-blue-400" /> New class requests</h3><p className="mt-1 text-xs leading-5 text-zinc-500">Images flagged for taxonomy review before a new species can be added.</p></div><div className="font-mono text-2xl font-semibold text-zinc-100 sm:text-right">{newClassCount.toLocaleString()}</div><div className="sm:text-right"><Button variant="ghost" size="sm" onClick={() => open('waiting_for_new_class')} className="text-zinc-300 hover:text-zinc-100">Inspect queue <ArrowRight size={15} /></Button></div></article></div>}

    {openQueue === 'unclear' && <UnclearImagesModal items={unclearPage.items} total={unclearPage.total} page={unclearPage.page} totalPages={unclearPage.totalPages} loading={unclearLoading} selectedIds={selectedIds} onSelectToggle={toggle} onSelectAllToggle={toggleUnclearPageSelection} onPageChange={(page) => void loadUnclear(page)} onRestore={() => setConfirmAction('restore')} onDelete={() => setConfirmAction('delete')} onClose={() => setOpenQueue(null)} />}

    {openQueue === 'waiting_for_new_class' && <NewClassAnomalyModal items={queueItems} onCreateSpecies={createSpeciesForNewClass} onReturnToPending={(item) => { setSelectedIds([item.id]); setConfirmAction('return-new-class') }} onClose={() => setOpenQueue(null)} />}

    {confirmAction && <div role="dialog" aria-modal="true" aria-labelledby="confirm-review-action-title" className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"><div className="w-full max-w-md rounded-2xl border border-zinc-700 bg-zinc-950 p-6 shadow-2xl"><div className="flex items-start justify-between gap-4"><h3 id="confirm-review-action-title" className="flex items-center gap-2 text-lg font-medium text-zinc-100">{confirmAction !== 'delete' && <RefreshCw size={19} className={confirmAction === 'return-new-class' ? 'text-blue-400' : 'text-emerald-400'} />}{confirmAction === 'restore' ? 'Restore selected images?' : confirmAction === 'return-new-class' ? 'Return image to expert review?' : 'Delete selected images permanently?'}</h3>{confirmAction === 'restore' && <span className="shrink-0 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-300">Non-destructive</span>}</div><p className="mt-3 text-sm leading-6 text-zinc-400">{confirmAction === 'restore' ? `${selectedIds.length} selected image${selectedIds.length === 1 ? '' : 's'} will return to the pending expert review queue. Existing review history will be preserved.` : confirmAction === 'return-new-class' ? 'This image will return to the pending expert review queue. The new-class escalation and its review history will be preserved.' : `${selectedIds.length} selected unclear image${selectedIds.length === 1 ? '' : 's'} and their stored files will be permanently deleted.`}</p><div className="mt-6 flex justify-end gap-3"><Button variant="ghost" disabled={acting} onClick={() => setConfirmAction(null)}>Cancel</Button><Button variant={confirmAction === 'delete' ? 'danger' : 'secondary'} className={confirmAction === 'restore' ? 'border-emerald-500/35 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20' : confirmAction === 'return-new-class' ? 'border-blue-500/35 bg-blue-500/10 text-blue-300 hover:bg-blue-500/20' : ''} disabled={acting} onClick={() => void runAction()}>{acting ? 'Working…' : confirmAction === 'restore' ? <><RefreshCw size={16} /> Restore {selectedIds.length} image{selectedIds.length === 1 ? '' : 's'}</> : confirmAction === 'return-new-class' ? <><RefreshCw size={16} /> Return to pending review</> : 'Delete permanently'}</Button></div></div></div>}
  </section>
}
