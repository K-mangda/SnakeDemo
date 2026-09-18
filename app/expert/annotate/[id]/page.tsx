'use client'

import { use, useEffect, useRef, useState, type MouseEvent as ReactMouseEvent } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Check, ChevronDown, Crosshair, Maximize2, Plus, Search } from 'lucide-react'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import { supabase } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/Toast'
import { formatScanLabel } from '@/lib/scan-label'

type Box = { x: number; y: number; width: number; height: number }
type Decision = 'pending' | 'unclear' | 'waiting_for_new_class'
type Species = { id: number; scientific_name: string; name_th: string | null; name_en: string | null }
type Scan = {
  id: string
  originalFilename: string
  createdAt: string
  imageUrl: string
  confidence: number | null
  bbox: Box | null
  status: Decision | 'verified'
  prediction: { id: number | null; scientific: string }
  existingVerification: { voted_species_id: number | null; bbox: Box | null } | null
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

export default function AnnotatePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { id } = use(params)
  const { showToast } = useToast()
  const [scan, setScan] = useState<Scan | null>(null)
  const [species, setSpecies] = useState<Species[]>([])
  const [bbox, setBbox] = useState<Box | null>(null)
  const [selectedSpeciesId, setSelectedSpeciesId] = useState<number | null>(null)
  const [decision, setDecision] = useState<Decision>('pending')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [dragMode, setDragMode] = useState<'move' | 'resize' | null>(null)
  const [startPoint, setStartPoint] = useState({ x: 0, y: 0 })
  const [startBox, setStartBox] = useState<Box | null>(null)
  const imageRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const response = await fetch(`/api/expert/images/${id}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      const payload = await response.json()
      if (!response.ok) {
        setError(payload.detail ?? 'Could not load saved scan.')
        setLoading(false)
        return
      }

      const item = payload.image as Scan
      setScan(item)
      setSpecies(payload.species)
      setBbox(item.existingVerification ? item.existingVerification.bbox : item.bbox)
      setSelectedSpeciesId(item.existingVerification?.voted_species_id ?? item.prediction.id)
      if (item.existingVerification?.voted_species_id === null && item.existingVerification) {
        setDecision(item.status === 'waiting_for_new_class' ? 'waiting_for_new_class' : 'unclear')
      }
      setLoading(false)
    }
    load()
  }, [id])

  function createBox(event?: ReactMouseEvent) {
    if (bbox || !imageRef.current) return
    const rect = imageRef.current.getBoundingClientRect()
    const clickX = event ? ((event.clientX - rect.left) / rect.width) * 100 : 50
    const clickY = event ? ((event.clientY - rect.top) / rect.height) * 100 : 50
    setBbox({ x: clamp(clickX - 15, 0, 70), y: clamp(clickY - 15, 0, 70), width: 30, height: 30 })
  }

  function beginBoxAction(event: ReactMouseEvent, mode: 'move' | 'resize') {
    if (!bbox) return
    event.preventDefault()
    event.stopPropagation()
    setDragMode(mode)
    setStartPoint({ x: event.clientX, y: event.clientY })
    setStartBox(bbox)
  }

  function updateBox(event: ReactMouseEvent) {
    if (!dragMode || !startBox || !imageRef.current) return
    const rect = imageRef.current.getBoundingClientRect()
    const dx = ((event.clientX - startPoint.x) / rect.width) * 100
    const dy = ((event.clientY - startPoint.y) / rect.height) * 100

    if (dragMode === 'move') {
      setBbox({
        ...startBox,
        x: clamp(startBox.x + dx, 0, 100 - startBox.width),
        y: clamp(startBox.y + dy, 0, 100 - startBox.height),
      })
    } else {
      setBbox({
        ...startBox,
        width: clamp(startBox.width + dx, 8, 100 - startBox.x),
        height: clamp(startBox.height + dy, 8, 100 - startBox.y),
      })
    }
  }

  async function submit() {
    if (decision === 'pending' && !selectedSpeciesId) {
      showToast('Choose the species you believe is in this image.', 'error')
      return
    }
    if (decision === 'pending' && !bbox) {
      showToast('Create a box around the snake before saving this species.', 'error')
      return
    }

    setSaving(true)
    const { error: submitError } = await supabase.rpc('submit_expert_verification', {
      p_image_id: id,
      p_voted_species_id: decision === 'pending' ? selectedSpeciesId : null,
      p_bbox: bbox,
      p_status: decision,
    })
    setSaving(false)

    if (submitError) {
      showToast(submitError.message, 'error')
      return
    }

    showToast('Your review was saved.')
    router.push('/expert')
  }

  const matchingSpecies = species.filter((item) =>
    `${item.scientific_name} ${item.name_th ?? ''} ${item.name_en ?? ''}`.toLowerCase().includes(search.toLowerCase())
  )
  const selectedSpecies = species.find((item) => item.id === selectedSpeciesId) ?? null

  if (loading) return <main className="grid min-h-screen place-items-center text-sm text-zinc-500">Loading review task…</main>
  if (error || !scan) return <main className="grid min-h-screen place-items-center text-sm text-red-400">{error ?? 'Saved scan not found.'}</main>

  return (
    <main className="min-h-screen px-4 pb-20 pt-24 sm:px-6 sm:pt-28">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 border-b border-zinc-900 pb-6">
          <Button variant="ghost" size="sm" onClick={() => router.push('/expert')} className="-ml-2 mb-5 text-zinc-500"><ArrowLeft size={16} /> Back to Workspace</Button>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div><p className="mb-2 text-xs uppercase tracking-[0.2em] text-emerald-400">Expert review</p><h1 className="text-2xl font-medium text-zinc-100">Review & correct classification</h1><p className="mt-2 text-sm text-zinc-500" title={`Original file: ${scan.originalFilename}`}>{formatScanLabel(scan.createdAt)}</p></div>
            <Badge variant="muted" className="text-xs">Independent review</Badge>
          </div>
        </header>

        <div className="grid gap-7 lg:grid-cols-[minmax(0,1.45fr)_minmax(340px,0.8fr)]">
          <section className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/20">
            <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4"><span className="flex items-center gap-2 text-sm font-medium text-zinc-200"><Crosshair size={16} className="text-emerald-400" /> Subject boundary</span>{!bbox && <Button size="sm" variant="outline" onClick={() => createBox()}><Plus size={14} /> Add box</Button>}</div>
            <div className="flex min-h-[420px] items-center justify-center bg-zinc-950 p-4 sm:p-6">
              <div ref={imageRef} className={`relative inline-block max-h-[600px] max-w-full select-none ${bbox ? '' : 'cursor-crosshair'}`} onClick={(event) => createBox(event)} onMouseMove={updateBox} onMouseUp={() => setDragMode(null)} onMouseLeave={() => setDragMode(null)}>
                <img src={scan.imageUrl} alt="Saved subject for Expert review" className="block max-h-[600px] max-w-full rounded-lg object-contain" />
                {!bbox && <div className="pointer-events-none absolute inset-0 grid place-items-center"><span className="rounded-lg border border-zinc-700 bg-zinc-950/90 px-3 py-2 text-xs text-zinc-400">No AI box · click image or Add box</span></div>}
                {bbox && <div className="absolute cursor-move border-2 border-emerald-400 bg-emerald-500/10 shadow-[0_0_18px_rgba(16,185,129,0.22)]" style={{ left: `${bbox.x}%`, top: `${bbox.y}%`, width: `${bbox.width}%`, height: `${bbox.height}%` }} onMouseDown={(event) => beginBoxAction(event, 'move')}><span className="absolute -top-7 left-0 rounded bg-emerald-500 px-2 py-1 text-[10px] font-medium text-zinc-950">Review box</span><button type="button" aria-label="Resize review box" className="absolute -bottom-2 -right-2 grid h-5 w-5 cursor-nwse-resize place-items-center rounded-sm border border-emerald-200 bg-emerald-500 text-zinc-950 shadow" onMouseDown={(event) => beginBoxAction(event, 'resize')}><Maximize2 size={11} /></button></div>}
              </div>
            </div>
            <div className="border-t border-zinc-800 px-5 py-3 text-xs text-zinc-500">{bbox ? 'Drag inside the box to move it. Drag the lower-right handle to resize it.' : 'No box was detected by AI. Add one only if you identify a snake.'}</div>
          </section>

          <aside className="space-y-5">
            <section className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-5"><div className="flex items-center justify-between gap-3"><p className="text-xs uppercase tracking-widest text-zinc-500">AI prediction</p><Badge variant={scan.confidence === null ? 'muted' : 'info'} className="px-2 py-0.5 text-[11px]">{scan.confidence === null ? 'No AI confidence' : `${(scan.confidence * 100).toFixed(1)}% confidence`}</Badge></div><p className="mt-3 text-lg font-medium italic text-zinc-100">{scan.prediction.scientific}</p>{!scan.prediction.id && <p className="mt-3 text-xs leading-5 text-amber-400">AI could not identify a reviewed species. Inspect the image and decide whether a snake is present.</p>}</section>

            <section className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-5"><p className="text-xs uppercase tracking-widest text-zinc-500">Your decision</p><div className="mt-4 space-y-2"><DecisionOption active={decision === 'pending'} onClick={() => setDecision('pending')} title="Confirm or correct species" detail="Select the species you believe is in the image." /><DecisionOption active={decision === 'unclear'} onClick={() => setDecision('unclear')} title="Cannot identify confidently" detail="Counts as your review without selecting a species." tone="amber" /><DecisionOption active={decision === 'waiting_for_new_class'} onClick={() => setDecision('waiting_for_new_class')} title="Species is not in the list" detail="Flag this image for a new reference class." tone="blue" /></div>
              {decision === 'pending' && <div className="mt-5 border-t border-zinc-800 pt-5"><label className="text-xs font-medium text-zinc-400">Reference species</label><div className="relative mt-2"><Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search scientific or Thai name…" className="w-full rounded-lg border border-zinc-800 bg-zinc-950 py-2.5 pl-9 pr-3 text-sm text-zinc-200 outline-none transition-colors placeholder:text-zinc-600 focus:border-emerald-500" /></div><div className="relative mt-2"><select value={selectedSpeciesId ?? ''} onChange={(event) => setSelectedSpeciesId(Number(event.target.value) || null)} className="w-full appearance-none rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2.5 pr-9 text-sm text-zinc-200 outline-none focus:border-emerald-500"><option value="">Select reference species</option>{matchingSpecies.map((item) => <option key={item.id} value={item.id}>{item.scientific_name}{item.name_th ? ` — ${item.name_th}` : ''}</option>)}</select><ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500" /></div>{selectedSpecies && <p className="mt-3 text-xs text-emerald-400">Selected: <span className="italic">{selectedSpecies.scientific_name}</span>{selectedSpecies.name_th ? ` — ${selectedSpecies.name_th}` : ''}</p>}</div>}
              <Button disabled={saving} onClick={submit} className="mt-5 w-full">{saving ? 'Saving review…' : 'Save my review'} <Check size={16} /></Button>
            </section>

            {bbox && <section className="rounded-2xl border border-zinc-800 bg-zinc-900/10 p-5 text-xs text-zinc-500"><p className="mb-3 uppercase tracking-widest text-zinc-400">Review box</p><div className="grid grid-cols-2 gap-x-3 gap-y-2 font-mono"><span>X {bbox.x.toFixed(1)}%</span><span>Y {bbox.y.toFixed(1)}%</span><span>W {bbox.width.toFixed(1)}%</span><span>H {bbox.height.toFixed(1)}%</span></div></section>}
          </aside>
        </div>
      </div>
    </main>
  )
}

function DecisionOption({ active, onClick, title, detail, tone = 'emerald' }: { active: boolean; onClick: () => void; title: string; detail: string; tone?: 'emerald' | 'amber' | 'blue' }) {
  const activeStyle = tone === 'amber' ? 'border-amber-500/70 bg-amber-500/10' : tone === 'blue' ? 'border-blue-500/70 bg-blue-500/10' : 'border-emerald-500/70 bg-emerald-500/10'
  return <button type="button" onClick={onClick} className={`w-full rounded-xl border p-3 text-left transition-colors ${active ? activeStyle : 'border-zinc-800 bg-zinc-950/40 hover:border-zinc-600'}`}><span className="flex items-start gap-3"><span className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${active ? 'border-zinc-100' : 'border-zinc-600'}`}><span className={active ? 'h-2 w-2 rounded-full bg-zinc-100' : ''} /></span><span><span className="block text-sm font-medium text-zinc-200">{title}</span><span className="mt-1 block text-xs leading-5 text-zinc-500">{detail}</span></span></span></button>
}
