import { useEffect } from 'react'
import { Eye, RefreshCw, ShieldCheck, X } from 'lucide-react'
import Button from '@/components/ui/Button'

export type NewClassQueueItem = { id: string; filename: string; updatedAt: string; imageUrl: string | null }

type NewClassAnomalyModalProps = {
  items: NewClassQueueItem[]
  onReturnToPending: (item: NewClassQueueItem) => void
  onClose: () => void
}

export default function NewClassAnomalyModal({ items, onReturnToPending, onClose }: NewClassAnomalyModalProps) {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = previousOverflow }
  }, [])

  return <div role="dialog" aria-modal="true" aria-labelledby="new-class-anomalies-title" className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in">
    <div className="flex max-h-[80vh] w-full max-w-2xl flex-col rounded-xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl">
      <div className="mb-6 flex shrink-0 items-center justify-between border-b border-zinc-800 pb-4"><div><h3 id="new-class-anomalies-title" className="flex items-center gap-2 text-lg font-medium text-zinc-100"><ShieldCheck size={20} className="text-blue-500" /> Investigate New Class Anomalies</h3><p className="mt-2 text-sm text-zinc-400">These images were escalated because an expert could not match them to the current species list.</p></div><button type="button" onClick={onClose} className="text-zinc-500 transition-colors hover:text-zinc-300" aria-label="Close"><X size={20} /></button></div>
      <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto pr-2">{items.length ? <div className="space-y-4">{items.map((item) => <article key={item.id} className="flex gap-4 rounded-lg border border-zinc-800 bg-zinc-950/50 p-4 transition-colors hover:border-zinc-700"><div className="grid h-24 w-24 shrink-0 place-items-center overflow-hidden rounded border border-zinc-800 bg-zinc-900">{item.imageUrl ? <img src={item.imageUrl} alt="New class candidate" className="h-full w-full object-cover" /> : <Eye size={24} className="text-blue-500/40" />}</div><div className="flex min-w-0 flex-1 flex-col justify-center"><h4 className="truncate text-sm font-medium text-zinc-200" title={item.filename}>{item.filename}</h4><p className="mt-1 text-xs text-zinc-500">Escalated for taxonomy review · Updated {new Date(item.updatedAt).toLocaleString()}</p><div className="mt-3"><Button size="sm" variant="secondary" className="border-blue-500/30 text-xs text-blue-300 hover:border-blue-500 hover:bg-blue-500/10" onClick={() => onReturnToPending(item)}><RefreshCw size={14} /> Return to pending review</Button></div></div></article>)}</div> : <div className="py-12 text-center text-zinc-500"><ShieldCheck size={48} className="mx-auto mb-4 opacity-20" /><p>All new-class anomalies have been investigated.</p></div>}</div>
    </div>
  </div>
}
