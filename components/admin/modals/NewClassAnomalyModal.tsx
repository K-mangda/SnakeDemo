import { FormEvent, useEffect, useState } from 'react'
import { Eye, Plus, RefreshCw, ShieldCheck, X } from 'lucide-react'
import Button from '@/components/ui/Button'

export type NewClassQueueItem = { id: string; filename: string; updatedAt: string; imageUrl: string | null }

type SpeciesDraft = { scientificName: string; nameTh: string; nameEn: string; family: string }

type NewClassAnomalyModalProps = {
  items: NewClassQueueItem[]
  onCreateSpecies: (item: NewClassQueueItem, species: SpeciesDraft) => Promise<void>
  onReturnToPending: (item: NewClassQueueItem) => void
  onClose: () => void
}

const emptySpecies: SpeciesDraft = { scientificName: '', nameTh: '', nameEn: '', family: '' }

export default function NewClassAnomalyModal({ items, onCreateSpecies, onReturnToPending, onClose }: NewClassAnomalyModalProps) {
  const [creatingFor, setCreatingFor] = useState<NewClassQueueItem | null>(null)
  const [species, setSpecies] = useState<SpeciesDraft>(emptySpecies)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = previousOverflow }
  }, [])

  function openCreateForm(item: NewClassQueueItem) {
    setCreatingFor(item)
    setSpecies(emptySpecies)
  }

  async function submitCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!creatingFor || !species.scientificName.trim()) return
    setSaving(true)
    try {
      await onCreateSpecies(creatingFor, species)
    } finally {
      setSaving(false)
    }
  }

  return <div role="dialog" aria-modal="true" aria-labelledby="new-class-anomalies-title" className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in">
    <div className="flex max-h-[85vh] w-full max-w-2xl flex-col rounded-xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl">
      <div className="mb-6 flex shrink-0 items-center justify-between border-b border-zinc-800 pb-4">
        <div>
          <h3 id="new-class-anomalies-title" className="flex items-center gap-2 text-lg font-medium text-zinc-100"><ShieldCheck size={20} className="text-blue-500" /> Investigate New Class Anomalies</h3>
          <p className="mt-2 text-sm text-zinc-400">Add a confirmed species to the catalogue, then let the expert queue review the image against it.</p>
        </div>
        <button type="button" onClick={onClose} className="text-zinc-500 transition-colors hover:text-zinc-300" aria-label="Close"><X size={20} /></button>
      </div>

      <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto pr-2">
        {creatingFor ? <form onSubmit={submitCreate} className="rounded-lg border border-blue-500/25 bg-zinc-950/50 p-5">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div className="min-w-0"><p className="text-sm font-medium text-zinc-100">Add species to catalogue</p><p className="mt-1 truncate text-xs text-zinc-500" title={creatingFor.filename}>For {creatingFor.filename}</p></div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="sm:col-span-2 text-sm text-zinc-300">Scientific name <span className="text-red-400">*</span><input required maxLength={160} value={species.scientificName} onChange={(event) => setSpecies(current => ({ ...current, scientificName: event.target.value }))} className="mt-1.5 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none transition focus:border-blue-500" placeholder="e.g. Naja kaouthia" /></label>
            <label className="text-sm text-zinc-300">Thai name<input maxLength={160} value={species.nameTh} onChange={(event) => setSpecies(current => ({ ...current, nameTh: event.target.value }))} className="mt-1.5 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none transition focus:border-blue-500" /></label>
            <label className="text-sm text-zinc-300">English name<input maxLength={160} value={species.nameEn} onChange={(event) => setSpecies(current => ({ ...current, nameEn: event.target.value }))} className="mt-1.5 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none transition focus:border-blue-500" /></label>
            <label className="sm:col-span-2 text-sm text-zinc-300">Family<input maxLength={160} value={species.family} onChange={(event) => setSpecies(current => ({ ...current, family: event.target.value }))} className="mt-1.5 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none transition focus:border-blue-500" placeholder="Optional" /></label>
          </div>
          <p className="mt-4 text-xs leading-5 text-zinc-500">Creating the class does not verify the image. It returns to pending so the experts can review it using the updated catalogue.</p>
          <div className="mt-5 flex justify-end gap-3"><Button type="button" variant="ghost" disabled={saving} onClick={() => setCreatingFor(null)}>Back to requests</Button><Button type="submit" variant="secondary" disabled={saving} className="border-blue-500/35 bg-blue-500/10 text-blue-200 hover:bg-blue-500/20">{saving ? 'Creating…' : <><Plus size={16} /> Add species and send to review</>}</Button></div>
        </form> : items.length ? <div className="space-y-4">
          {items.map((item) => <article key={item.id} className="flex gap-4 rounded-lg border border-zinc-800 bg-zinc-950/50 p-4 transition-colors hover:border-zinc-700">
            <div className="grid h-24 w-24 shrink-0 place-items-center overflow-hidden rounded border border-zinc-800 bg-zinc-900">{item.imageUrl ? <img src={item.imageUrl} alt="New class candidate" className="h-full w-full object-cover" /> : <Eye size={24} className="text-blue-500/40" />}</div>
            <div className="flex min-w-0 flex-1 flex-col justify-center"><h4 className="truncate text-sm font-medium text-zinc-200" title={item.filename}>{item.filename}</h4><p className="mt-1 text-xs text-zinc-500">Escalated for taxonomy review · Updated {new Date(item.updatedAt).toLocaleString()}</p><div className="mt-3 flex flex-wrap gap-2"><Button size="sm" variant="secondary" className="border-blue-500/30 text-xs text-blue-300 hover:border-blue-500 hover:bg-blue-500/10" onClick={() => openCreateForm(item)}><Plus size={14} /> Add new class</Button><Button size="sm" variant="ghost" className="text-xs text-zinc-400 hover:text-zinc-200" onClick={() => onReturnToPending(item)}><RefreshCw size={14} /> Return to pending</Button></div></div>
          </article>)}
        </div> : <div className="py-12 text-center text-zinc-500"><ShieldCheck size={48} className="mx-auto mb-4 opacity-20" /><p>All new-class anomalies have been investigated.</p></div>}
      </div>
    </div>
  </div>
}
