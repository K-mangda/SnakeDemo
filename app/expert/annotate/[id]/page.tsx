'use client'

import { use, useEffect, useRef, useState, type MouseEvent as ReactMouseEvent } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Check, Search } from 'lucide-react'
import Button from '@/components/ui/Button'
import { supabase } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/Toast'

type Box = { x: number; y: number; width: number; height: number }
type Species = { id: number; scientific_name: string; name_th: string | null; name_en: string | null }
type Scan = {
  id: string; originalFilename: string; imageUrl: string; confidence: number | null; bbox: Box | null
  prediction: { id: number | null; scientific: string }
  existingVerification: { voted_species_id: number | null; bbox: Box } | null
}

export default function AnnotatePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { id } = use(params)
  const { showToast } = useToast()
  const [scan, setScan] = useState<Scan | null>(null)
  const [species, setSpecies] = useState<Species[]>([])
  const [bbox, setBbox] = useState<Box>({ x: 20, y: 20, width: 40, height: 40 })
  const [selectedSpeciesId, setSelectedSpeciesId] = useState<number | null>(null)
  const [status, setStatus] = useState<'pending' | 'unclear' | 'waiting_for_new_class'>('pending')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [dragging, setDragging] = useState(false)
  const [startPoint, setStartPoint] = useState({ x: 0, y: 0 })
  const [startBox, setStartBox] = useState(bbox)
  const imageRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      const response = await fetch(`/api/expert/images/${id}`, { headers: { Authorization: `Bearer ${session.access_token}` } })
      const payload = await response.json()
      if (!response.ok) { setError(payload.detail ?? 'Could not load saved scan.'); setLoading(false); return }
      const item = payload.image as Scan
      setScan(item); setSpecies(payload.species)
      setBbox(item.existingVerification?.bbox ?? item.bbox ?? { x: 20, y: 20, width: 40, height: 40 })
      setSelectedSpeciesId(item.existingVerification?.voted_species_id ?? item.prediction.id)
      setLoading(false)
    }
    load()
  }, [id])

  function startDrag(event: ReactMouseEvent) {
    event.preventDefault(); event.stopPropagation()
    setDragging(true); setStartPoint({ x: event.clientX, y: event.clientY }); setStartBox(bbox)
  }
  function moveBox(event: ReactMouseEvent) {
    if (!dragging || !imageRef.current) return
    const rect = imageRef.current.getBoundingClientRect()
    const x = Math.max(0, Math.min(100 - startBox.width, startBox.x + ((event.clientX - startPoint.x) / rect.width) * 100))
    const y = Math.max(0, Math.min(100 - startBox.height, startBox.y + ((event.clientY - startPoint.y) / rect.height) * 100))
    setBbox({ ...startBox, x, y })
  }
  async function submit() {
    if (status === 'pending' && !selectedSpeciesId) { showToast('Select a reference species, or mark this image as unclear.', 'error'); return }
    setSaving(true)
    const { error: submitError } = await supabase.rpc('submit_expert_verification', {
      p_image_id: id, p_voted_species_id: status === 'pending' ? selectedSpeciesId : null, p_bbox: bbox, p_status: status,
    })
    setSaving(false)
    if (submitError) { showToast(submitError.message, 'error'); return }
    showToast('Verification saved.'); router.push('/expert')
  }

  const matchingSpecies = species.filter(item => `${item.scientific_name} ${item.name_th ?? ''} ${item.name_en ?? ''}`.toLowerCase().includes(search.toLowerCase()))
  if (loading) return <main className="grid min-h-screen place-items-center text-sm text-zinc-500">Loading saved scan…</main>
  if (error || !scan) return <main className="grid min-h-screen place-items-center text-sm text-red-400">{error ?? 'Saved scan not found.'}</main>

  return <main className="min-h-screen pt-28 px-6 pb-20"><div className="max-w-5xl mx-auto">
    <header className="mb-8 border-b border-zinc-900 pb-6"><Button variant="ghost" size="sm" onClick={() => router.push('/expert')} className="mb-4 -ml-2 text-zinc-500"><ArrowLeft size={16} /> Back to Workspace</Button><h1 className="text-2xl font-medium text-zinc-100">Verification task</h1><p className="mt-1 text-sm font-mono text-zinc-500">{scan.originalFilename}</p></header>
    <div className="grid lg:grid-cols-3 gap-8"><div ref={imageRef} className="lg:col-span-2 relative min-h-[500px] overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 select-none" onMouseMove={moveBox} onMouseUp={() => setDragging(false)} onMouseLeave={() => setDragging(false)}><img src={scan.imageUrl} alt="Saved snake scan" className="absolute inset-0 h-full w-full object-contain" /><div className="absolute cursor-move border-2 border-emerald-500 bg-emerald-500/10" style={{ left: `${bbox.x}%`, top: `${bbox.y}%`, width: `${bbox.width}%`, height: `${bbox.height}%` }} onMouseDown={startDrag} /></div>
      <div className="space-y-5"><section className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-5"><p className="text-xs uppercase tracking-widest text-zinc-500">Model inference</p><p className="mt-2 font-medium text-zinc-100 italic">{scan.prediction.scientific}</p><p className="mt-1 text-sm text-zinc-500">Confidence {((scan.confidence ?? 0) * 100).toFixed(1)}%</p>{!scan.prediction.id && <p className="mt-3 text-xs text-amber-400">No reviewed reference is linked to this model label yet.</p>}</section>
      <section className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-5"><p className="text-xs uppercase tracking-widest text-zinc-500">Expert decision</p><div className="mt-4 space-y-2"><label className="flex items-center gap-2 text-sm text-zinc-300"><input type="radio" checked={status === 'pending'} onChange={() => setStatus('pending')} /> Confirm or correct species</label><label className="flex items-center gap-2 text-sm text-zinc-300"><input type="radio" checked={status === 'unclear'} onChange={() => setStatus('unclear')} /> Mark as unclear</label><label className="flex items-center gap-2 text-sm text-zinc-300"><input type="radio" checked={status === 'waiting_for_new_class'} onChange={() => setStatus('waiting_for_new_class')} /> Waiting for new class</label></div>{status === 'pending' && <><div className="relative mt-5"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" /><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search reviewed species…" className="w-full rounded-lg border border-zinc-800 bg-zinc-950 py-2 pl-9 pr-3 text-sm text-zinc-200 outline-none focus:border-emerald-500" /></div><select value={selectedSpeciesId ?? ''} onChange={event => setSelectedSpeciesId(Number(event.target.value) || null)} className="mt-2 w-full rounded-lg border border-zinc-800 bg-zinc-950 p-2 text-sm text-zinc-200"><option value="">Select reference species</option>{matchingSpecies.map(item => <option key={item.id} value={item.id}>{item.scientific_name}{item.name_th ? ` — ${item.name_th}` : ''}</option>)}</select></>}<Button disabled={saving} onClick={submit} className="mt-5 w-full">{saving ? 'Saving…' : 'Save verification'} <Check size={16} /></Button></section>
      <section className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-5 text-xs text-zinc-500"><p className="mb-2 uppercase tracking-widest">Bounding box</p><div className="grid grid-cols-2 gap-2 font-mono"><span>X {bbox.x.toFixed(1)}%</span><span>Y {bbox.y.toFixed(1)}%</span><span>W {bbox.width.toFixed(1)}%</span><span>H {bbox.height.toFixed(1)}%</span></div></section></div></div>
  </div></main>
}
