import { useEffect } from 'react'
import { AlertTriangle, ChevronLeft, ChevronRight, Eye, RefreshCw, Trash2, X } from 'lucide-react'
import Button from '@/components/ui/Button'
import { translate } from '@/lib/i18n'
import { useLanguage } from '@/components/i18n/LanguageProvider'

export type UnclearQueueItem = { id: string; filename: string; imageUrl: string | null }

type UnclearImagesModalProps = {
  items: UnclearQueueItem[]
  total: number
  page: number
  totalPages: number
  loading: boolean
  selectedIds: string[]
  onSelectToggle: (id: string) => void
  onSelectAllToggle: (checked: boolean) => void
  onPageChange: (page: number) => void
  onRestore: () => void
  onDelete: () => void
  onClose: () => void
}

export default function UnclearImagesModal({ items, total, page, totalPages, loading, selectedIds, onSelectToggle, onSelectAllToggle, onPageChange, onRestore, onDelete, onClose }: UnclearImagesModalProps) {
  const { locale } = useLanguage()
  const allSelected = items.length > 0 && items.every((item) => selectedIds.includes(item.id))

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = previousOverflow }
  }, [])

  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in">
    <div className="flex max-h-[80vh] w-full max-w-2xl flex-col rounded-xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl">
      <div className="mb-6 flex shrink-0 items-center justify-between border-b border-zinc-800 pb-4"><h3 className="flex items-center gap-2 text-lg font-medium text-zinc-100"><AlertTriangle size={20} className="text-red-500" /> Review Unclear Images</h3><button type="button" onClick={onClose} className="text-zinc-500 transition-colors hover:text-zinc-300" aria-label="Close"><X size={20} /></button></div>
      <div className="custom-scrollbar flex-1 overflow-y-auto pb-4 pr-2"><div className="mb-4 flex flex-wrap items-end justify-between gap-3"><p className="max-w-lg text-sm text-zinc-400">Select real unclear images to <strong className="font-medium text-red-400">permanently delete</strong> them, or <strong className="font-medium text-emerald-400">restore</strong> them to the pending expert queue.</p><div className="flex items-center gap-4"><span className="text-xs text-zinc-500">{translate(`${total.toLocaleString()} image${total === 1 ? '' : 's'} in queue`, locale)}</span><label className="flex shrink-0 cursor-pointer items-center gap-2 whitespace-nowrap text-sm text-zinc-400 transition-colors hover:text-zinc-200"><input type="checkbox" checked={allSelected} onChange={(event) => onSelectAllToggle(event.target.checked)} className="relative h-4 w-4 cursor-pointer appearance-none rounded border border-zinc-600 bg-zinc-800/50 checked:border-zinc-200 checked:bg-zinc-200 after:absolute after:left-[5px] after:top-[1px] after:hidden after:h-2 after:w-1.5 after:rotate-45 after:border-b-2 after:border-r-2 after:border-zinc-900 after:content-[''] checked:after:block" />Select this page</label></div></div>
        {loading ? <div className="grid grid-cols-3 gap-4 sm:grid-cols-4">{Array.from({ length: 8 }, (_, index) => <div key={index} className="aspect-square animate-pulse rounded-lg border border-zinc-800 bg-zinc-800/60" />)}</div> : items.length ? <div className="grid grid-cols-3 gap-4 sm:grid-cols-4">{items.map((item) => <button type="button" key={item.id} onClick={() => onSelectToggle(item.id)} title={item.filename} className={`group relative aspect-square overflow-hidden rounded-lg border text-left transition-colors ${selectedIds.includes(item.id) ? 'border-red-500/50 bg-red-500/5' : 'border-zinc-800 bg-zinc-950 hover:border-zinc-600'}`}><div className="pointer-events-none absolute inset-0 z-10 bg-white/5 opacity-0 transition-opacity group-hover:opacity-100" /><div className="pointer-events-none absolute left-2 top-2 z-20"><span className={`block h-5 w-5 rounded border ${selectedIds.includes(item.id) ? 'border-red-500 bg-red-500' : 'border-zinc-600/80 bg-zinc-900/80'}`}>{selectedIds.includes(item.id) && <span className="ml-[6px] mt-[2px] block h-2.5 w-1.5 rotate-45 border-b-2 border-r-2 border-white" />}</span></div>{item.imageUrl ? <img src={item.imageUrl} alt="Unclear scan" className="h-full w-full object-cover" /> : <div className="flex h-full w-full items-center justify-center text-zinc-700"><Eye size={24} /></div>}</button>)}</div> : <div className="py-12 text-center text-zinc-500"><AlertTriangle size={48} className="mx-auto mb-4 opacity-20" /><p>No unclear images are currently queued.</p></div>}</div>
      <div className="mt-2 flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-zinc-800 pt-4"><div className="flex items-center gap-2"><span className="text-sm text-zinc-400">{translate(`${selectedIds.length} selected`, locale)}</span>{totalPages > 1 && <div className="ml-2 flex items-center gap-1"><button type="button" aria-label="Previous page" disabled={page === 1 || loading} onClick={() => onPageChange(page - 1)} className="rounded p-1 text-zinc-400 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40"><ChevronLeft size={17} /></button><span className="min-w-16 text-center text-xs text-zinc-500">{translate(`Page ${page} / ${totalPages}`, locale)}</span><button type="button" aria-label="Next page" disabled={page === totalPages || loading} onClick={() => onPageChange(page + 1)} className="rounded p-1 text-zinc-400 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40"><ChevronRight size={17} /></button></div>}</div><div className="flex gap-3"><Button variant="secondary" disabled={selectedIds.length === 0} className="border-emerald-500/30 text-emerald-400 hover:border-emerald-500 hover:bg-emerald-500/10" onClick={onRestore}><RefreshCw size={16} /> Restore</Button><Button variant="danger" disabled={selectedIds.length === 0} onClick={onDelete}><Trash2 size={16} /> Delete</Button></div></div>
    </div>
  </div>
}
