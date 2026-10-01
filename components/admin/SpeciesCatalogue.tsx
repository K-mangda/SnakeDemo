'use client'

import { FormEvent, useEffect, useState } from 'react'
import { BookOpen, ChevronLeft, ChevronRight, Pencil, RefreshCw, Search, Trash2, X } from 'lucide-react'
import Button from '@/components/ui/Button'
import { supabase } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/Toast'
import { readAdminCache, writeAdminCache } from '@/lib/admin-cache'
import { onAdminRefresh } from '@/lib/admin-refresh'

type Species = { id: number; scientific_name: string; name_th: string | null; name_en: string | null; family: string | null; created_at: string }
type Draft = { scientificName: string; nameTh: string; nameEn: string; family: string }
type CatalogueResponse = { species: Species[]; page: number; pageSize: number; total: number; totalPages: number }

function toDraft(species: Species): Draft {
  return { scientificName: species.scientific_name, nameTh: species.name_th ?? '', nameEn: species.name_en ?? '', family: species.family ?? '' }
}

export default function SpeciesCatalogue() {
  const { showToast } = useToast()
  const [catalogue, setCatalogue] = useState<CatalogueResponse>(() => readAdminCache<CatalogueResponse>('species-catalogue') ?? { species: [], page: 1, pageSize: 10, total: 0, totalPages: 1 })
  const [loading, setLoading] = useState(() => readAdminCache<CatalogueResponse>('species-catalogue') === null)
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState<Species | null>(null)
  const [draft, setDraft] = useState<Draft>({ scientificName: '', nameTh: '', nameEn: '', family: '' })
  const [deleting, setDeleting] = useState<Species | null>(null)
  const [acting, setActing] = useState(false)

  async function request(method: 'GET' | 'PATCH' | 'DELETE', body?: object, path = '/api/admin/species') {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) throw new Error('Sign in is required.')
    const response = await fetch(path, { method, headers: { Authorization: 'Bearer ' + session.access_token, 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined, cache: 'no-store' })
    const payload = await response.json()
    if (!response.ok) throw new Error(payload.detail ?? 'Could not update the species catalogue.')
    return payload
  }

  async function load(page = catalogue.page, query = search) {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: '10' })
      if (query.trim()) params.set('search', query.trim())
      const payload = await request('GET', undefined, '/api/admin/species?' + params.toString()) as CatalogueResponse
      setCatalogue(payload)
      if (!query.trim() && page === 1) writeAdminCache('species-catalogue', payload)
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Could not load the species catalogue.', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (readAdminCache<CatalogueResponse>('species-catalogue') === null) void load(1, '')
    return onAdminRefresh('review', () => { void load() })
  }, [])

  function openEdit(item: Species) {
    setEditing(item)
    setDraft(toDraft(item))
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!editing) return
    setActing(true)
    try {
      const payload = await request('PATCH', { id: editing.id, species: draft })
      setCatalogue(current => {
        const next = { ...current, species: current.species.map((item) => item.id === editing.id ? payload.species : item).sort((left, right) => left.scientific_name.localeCompare(right.scientific_name)) }
        if (!search && current.page === 1) writeAdminCache('species-catalogue', next)
        return next
      })
      setEditing(null)
      showToast('Species details updated.')
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Could not update this species.', 'error')
    } finally {
      setActing(false)
    }
  }

  async function remove() {
    if (!deleting) return
    setActing(true)
    try {
      await request('DELETE', undefined, '/api/admin/species?id=' + deleting.id)
      setDeleting(null)
      showToast('Species removed from the catalogue.')
      await load(catalogue.species.length === 1 && catalogue.page > 1 ? catalogue.page - 1 : catalogue.page, search)
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Could not delete this species.', 'error')
    } finally {
      setActing(false)
    }
  }

  const species = catalogue.species

  function searchCatalogue(value: string) {
    setSearch(value)
    void load(1, value)
  }

  return <section className="mb-12 rounded-xl border border-zinc-800 bg-zinc-900/20 p-6">
    <div className="flex flex-wrap items-start justify-between gap-4 border-b border-zinc-800 pb-5">
      <div><h2 className="flex items-center gap-2 text-lg font-medium text-zinc-100"><BookOpen size={19} className="text-zinc-400" /> Species catalogue</h2><p className="mt-2 text-sm text-zinc-500">Edit names and taxonomy details here. Deletion is available only while a species has no saved image or expert review.</p></div>
      <span className="text-sm tabular-nums text-zinc-500">{loading ? 'Loading…' : catalogue.total.toLocaleString() + ' species'}</span>
    </div>

    <div className="mt-4 flex flex-wrap items-center justify-between gap-3"><label className="relative block w-full max-w-sm"><Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" /><input value={search} onChange={(event) => searchCatalogue(event.target.value)} placeholder="Search species, name, or family" className="w-full rounded-lg border border-zinc-800 bg-zinc-950 py-2 pl-9 pr-3 text-sm text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-emerald-500" /></label><p className="text-xs text-zinc-500">{loading ? 'Updating…' : species.length + ' shown · page ' + catalogue.page + ' of ' + catalogue.totalPages}</p></div>

    <div className="mt-4 overflow-x-auto rounded-lg border border-zinc-800">
      <table className="w-full min-w-[660px] text-left text-sm"><thead className="border-b border-zinc-800 bg-zinc-900/60 text-[11px] uppercase tracking-wide text-zinc-500"><tr><th className="px-4 py-3 font-medium">Scientific name</th><th className="px-4 py-3 font-medium">Thai name</th><th className="px-4 py-3 font-medium">English name</th><th className="px-4 py-3 font-medium">Family</th><th className="w-36 px-4 py-3 text-right font-medium">Actions</th></tr></thead><tbody>{loading ? <tr><td colSpan={5} className="px-4 py-8 text-center text-zinc-500">Loading catalogue…</td></tr> : species.length ? species.map((item) => <tr key={item.id} className="group border-b border-zinc-800/80 transition-colors hover:bg-zinc-900/60 last:border-0"><td className="px-4 py-3 font-medium italic text-zinc-200">{item.scientific_name}</td><td className="px-4 py-3 text-zinc-400">{item.name_th ?? '—'}</td><td className="px-4 py-3 text-zinc-400">{item.name_en ?? '—'}</td><td className="px-4 py-3 text-zinc-400">{item.family ?? '—'}</td><td className="px-4 py-3"><div className="flex justify-end gap-1"><Button size="sm" variant="ghost" className="group-hover:text-zinc-100" onClick={() => openEdit(item)} aria-label={'Edit ' + item.scientific_name}><Pencil size={14} /> Edit</Button><Button size="sm" variant="ghost" className="text-zinc-500 hover:text-red-300" onClick={() => setDeleting(item)} aria-label={'Delete ' + item.scientific_name}><Trash2 size={14} /></Button></div></td></tr>) : <tr><td colSpan={5} className="px-4 py-8 text-center text-zinc-500">No species in the catalogue yet.</td></tr>}</tbody></table>
    </div>
    <div className="mt-4 flex items-center justify-end gap-2"><Button size="sm" variant="ghost" disabled={loading || catalogue.page === 1} onClick={() => void load(catalogue.page - 1, search)}><ChevronLeft size={15} /> Previous</Button><span className="min-w-20 text-center text-xs tabular-nums text-zinc-500">{catalogue.page} / {catalogue.totalPages}</span><Button size="sm" variant="ghost" disabled={loading || catalogue.page >= catalogue.totalPages} onClick={() => void load(catalogue.page + 1, search)}>Next <ChevronRight size={15} /></Button></div>

    {editing && <div role="dialog" aria-modal="true" aria-labelledby="edit-species-title" className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"><form onSubmit={save} className="w-full max-w-lg rounded-xl border border-zinc-700 bg-zinc-950 p-6 shadow-2xl"><div className="flex items-start justify-between gap-4"><div><h3 id="edit-species-title" className="text-lg font-medium text-zinc-100">Edit species</h3><p className="mt-1 text-sm text-zinc-500">Update the catalogue details used by review tools.</p></div><button type="button" disabled={acting} className="text-zinc-500 hover:text-zinc-300" onClick={() => setEditing(null)} aria-label="Close"><X size={20} /></button></div><div className="mt-5 grid gap-4 sm:grid-cols-2"><label className="sm:col-span-2 text-sm text-zinc-300">Scientific name <span className="text-red-400">*</span><input required maxLength={160} value={draft.scientificName} onChange={(event) => setDraft(current => ({ ...current, scientificName: event.target.value }))} className="mt-1.5 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-zinc-100 outline-none focus:border-emerald-500" /></label><label className="text-sm text-zinc-300">Thai name<input maxLength={160} value={draft.nameTh} onChange={(event) => setDraft(current => ({ ...current, nameTh: event.target.value }))} className="mt-1.5 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-zinc-100 outline-none focus:border-emerald-500" /></label><label className="text-sm text-zinc-300">English name<input maxLength={160} value={draft.nameEn} onChange={(event) => setDraft(current => ({ ...current, nameEn: event.target.value }))} className="mt-1.5 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-zinc-100 outline-none focus:border-emerald-500" /></label><label className="sm:col-span-2 text-sm text-zinc-300">Family<input maxLength={160} value={draft.family} onChange={(event) => setDraft(current => ({ ...current, family: event.target.value }))} className="mt-1.5 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-zinc-100 outline-none focus:border-emerald-500" /></label></div><div className="mt-6 flex justify-end gap-3"><Button type="button" variant="ghost" disabled={acting} onClick={() => setEditing(null)}>Cancel</Button><Button type="submit" disabled={acting}>{acting ? 'Saving…' : 'Save changes'}</Button></div></form></div>}

    {deleting && <div role="dialog" aria-modal="true" aria-labelledby="delete-species-title" className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"><div className="w-full max-w-md rounded-xl border border-zinc-700 bg-zinc-950 p-6 shadow-2xl"><h3 id="delete-species-title" className="text-lg font-medium text-zinc-100">Remove species?</h3><p className="mt-3 text-sm leading-6 text-zinc-400"><span className="italic text-zinc-200">{deleting.scientific_name}</span> will be permanently removed only if it is not used by any saved image or expert review.</p><div className="mt-6 flex justify-end gap-3"><Button variant="ghost" disabled={acting} onClick={() => setDeleting(null)}>Cancel</Button><Button variant="danger" disabled={acting} onClick={() => void remove()}>{acting ? 'Removing…' : 'Remove species'}</Button></div></div></div>}
  </section>
}
