'use client'

import { use, useEffect, useRef, useState, type MouseEvent as ReactMouseEvent } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, Check, ChevronLeft, ChevronRight, Crosshair, MousePointer2, Plus, Search } from 'lucide-react'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import { supabase } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/Toast'
import { formatScanLabel } from '@/lib/scan-label'
import { clearPrefetchedReview, getPrefetchedReview, prefetchExpertReview } from '@/lib/expert-review-cache'
import { clearWorkspaceCache } from '@/lib/expert-workspace-cache'

type Box = { x: number; y: number; width: number; height: number }
type Decision = 'pending' | 'unclear' | 'waiting_for_new_class'
type DragMode = 'move' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'nw'
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
  consensus: { scientific: string; bbox: Box; reviewCount: number } | null
  reviewHistory: { reviewer: string; species: string | null; createdAt: string }[]
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

export default function AnnotatePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { id } = use(params)
  const requestedReturnTo = searchParams.get('returnTo')
  const returnTo = requestedReturnTo?.startsWith('/expert') ? requestedReturnTo : '/expert?filter=pending'
  const requestedQueueFilter = new URLSearchParams(returnTo.split('?')[1] ?? '').get('filter')
  const queueFilter = ['all', 'pending', 'verified', 'unclear', 'waiting_for_new_class'].includes(requestedQueueFilter ?? '') ? requestedQueueFilter! : 'pending'
  const { showToast } = useToast()
  const [scan, setScan] = useState<Scan | null>(null)
  const [species, setSpecies] = useState<Species[]>([])
  const [bbox, setBbox] = useState<Box | null>(null)
  const [selectedSpeciesId, setSelectedSpeciesId] = useState<number | null>(null)
  const [hasExpertSelectedSpecies, setHasExpertSelectedSpecies] = useState(false)
  const [decision, setDecision] = useState<Decision>('pending')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [imageState, setImageState] = useState<'loading' | 'ready' | 'error'>('loading')
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [speciesMenuOpen, setSpeciesMenuOpen] = useState(false)
  const [placingBox, setPlacingBox] = useState(false)
  const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(null)
  const [dragMode, setDragMode] = useState<DragMode | null>(null)
  const [startPoint, setStartPoint] = useState({ x: 0, y: 0 })
  const [startBox, setStartBox] = useState<Box | null>(null)
  const [queueIds, setQueueIds] = useState<string[]>([])
  const [autoAdvance, setAutoAdvance] = useState(true)
  const [showFinalConsensus, setShowFinalConsensus] = useState(false)
  const imageRef = useRef<HTMLDivElement>(null)
  const [readyImageUrl, setReadyImageUrl] = useState<string | null>(null)
  const [imageReloadKey, setImageReloadKey] = useState(0)
  const refreshedImageUrl = useRef<string | null>(null)

  useEffect(() => {
    const imageUrl = scan?.imageUrl
    if (!imageUrl) return
    let active = true
    setImageState('loading')
    setReadyImageUrl(null)
    const image = new Image()
    image.onload = () => {
      if (!active) return
      refreshedImageUrl.current = null
      setReadyImageUrl(imageUrl)
      setImageState('ready')
    }
    image.onerror = () => {
      if (!active) return
      if (refreshedImageUrl.current !== imageUrl) {
        refreshedImageUrl.current = imageUrl
        clearPrefetchedReview(id)
        setImageReloadKey((value) => value + 1)
        return
      }
      setReadyImageUrl(null)
      setImageState('error')
    }
    image.src = imageUrl
    return () => { active = false }
  }, [id, imageReloadKey, scan?.imageUrl])

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError(null)
      setImageState('loading')
      setReadyImageUrl(null)
      setDecision('pending')
      setSpeciesMenuOpen(false)
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setError('Your session has expired. Please sign in again.')
        setLoading(false)
        return
      }

      const applyPayload = (payload: { image: Scan; species: Species[]; queueIds: string[] }) => {
        const item = payload.image
        setScan(item)
        setSpecies(payload.species)
        const ids = payload.queueIds ?? []
        setQueueIds(ids)
        const nextId = ids[ids.indexOf(id) + 1]
        if (nextId) void prefetchExpertReview(nextId, session.access_token, queueFilter)
        setBbox(item.existingVerification ? item.existingVerification.bbox : item.bbox)
        setSelectedSpeciesId(item.existingVerification?.voted_species_id ?? item.prediction.id)
        setHasExpertSelectedSpecies(item.existingVerification?.voted_species_id !== null && item.existingVerification?.voted_species_id !== undefined)
        // A new review benefits from a fast queue flow. When reopening an
        // existing review, staying on the image is safer for careful edits.
        setAutoAdvance(!item.existingVerification)
        setShowFinalConsensus(false)
        if (item.existingVerification?.voted_species_id === null && item.existingVerification) {
          setDecision(item.status === 'waiting_for_new_class' ? 'waiting_for_new_class' : 'unclear')
        }
        setLoading(false)
      }

      const prefetched = getPrefetchedReview(id, queueFilter) as { image: Scan; species: Species[]; queueIds: string[] } | null
      if (prefetched) {
        applyPayload(prefetched)
        return
      }

      const payload = await prefetchExpertReview(id, session.access_token, queueFilter) as { image: Scan; species: Species[]; queueIds: string[] } | null
      if (!payload) {
        setError('Could not load saved scan.')
        setLoading(false)
        return
      }
      applyPayload(payload)
    }
    load()
  }, [id, imageReloadKey, queueFilter])

  const queueIndex = queueIds.indexOf(id)
  const previousQueueId = queueIndex > 0 ? queueIds[queueIndex - 1] : null
  const nextQueueId = queueIndex >= 0 && queueIndex + 1 < queueIds.length ? queueIds[queueIndex + 1] : null

  function goToQueueItem(imageId: string | null) {
    if (imageId) router.push(`/expert/annotate/${imageId}?returnTo=${encodeURIComponent(returnTo)}`)
  }

  function beginPlacingBox() {
    if (!bbox) setPlacingBox(true)
  }

  function clearBox() {
    setBbox(null)
    setPlacingBox(false)
    setDrawStart(null)
    setDragMode(null)
  }

  function redrawBox() {
    clearBox()
    setPlacingBox(true)
  }

  function beginDrawingBox(event: ReactMouseEvent) {
    if (bbox || !placingBox || !imageRef.current) return
    event.preventDefault()
    const rect = imageRef.current.getBoundingClientRect()
    const clickX = ((event.clientX - rect.left) / rect.width) * 100
    const clickY = ((event.clientY - rect.top) / rect.height) * 100
    const start = { x: clamp(clickX, 0, 100), y: clamp(clickY, 0, 100) }
    setDrawStart(start)
    setBbox({ x: start.x, y: start.y, width: 0, height: 0 })
  }

  function beginBoxAction(event: ReactMouseEvent, mode: DragMode) {
    if (!bbox) return
    event.preventDefault()
    event.stopPropagation()
    setDragMode(mode)
    setStartPoint({ x: event.clientX, y: event.clientY })
    setStartBox(bbox)
  }

  function updateBox(event: ReactMouseEvent) {
    if (placingBox && drawStart && bbox && imageRef.current) {
      const rect = imageRef.current.getBoundingClientRect()
      const endX = clamp(((event.clientX - rect.left) / rect.width) * 100, 0, 100)
      const endY = clamp(((event.clientY - rect.top) / rect.height) * 100, 0, 100)
      setBbox({
        x: Math.min(drawStart.x, endX),
        y: Math.min(drawStart.y, endY),
        width: Math.abs(endX - drawStart.x),
        height: Math.abs(endY - drawStart.y),
      })
      return
    }

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
      const minSize = 5
      const right = startBox.x + startBox.width
      const bottom = startBox.y + startBox.height
      let nextX = startBox.x
      let nextY = startBox.y
      let nextWidth = startBox.width
      let nextHeight = startBox.height

      if (dragMode.includes('w')) {
        nextX = clamp(startBox.x + dx, 0, right - minSize)
        nextWidth = right - nextX
      }
      if (dragMode.includes('e')) {
        nextWidth = clamp(startBox.width + dx, minSize, 100 - startBox.x)
      }
      if (dragMode.includes('n')) {
        nextY = clamp(startBox.y + dy, 0, bottom - minSize)
        nextHeight = bottom - nextY
      }
      if (dragMode.includes('s')) {
        nextHeight = clamp(startBox.height + dy, minSize, 100 - startBox.y)
      }

      setBbox({ x: nextX, y: nextY, width: nextWidth, height: nextHeight })
    }
  }

  function endBoxAction() {
    if (placingBox && drawStart) {
      if (!bbox || bbox.width < 3 || bbox.height < 3) {
        setBbox(null)
        return
      }
      setPlacingBox(false)
      setDrawStart(null)
    }
    setDragMode(null)
  }

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement
      if (target instanceof HTMLInputElement || target instanceof HTMLSelectElement || target instanceof HTMLTextAreaElement) return

      if (event.key === 'ArrowLeft' && previousQueueId) {
        event.preventDefault()
        goToQueueItem(previousQueueId)
        return
      }
      if (event.key === 'ArrowRight' && nextQueueId) {
        event.preventDefault()
        goToQueueItem(nextQueueId)
        return
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [nextQueueId, previousQueueId])

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
    clearWorkspaceCache()
    clearPrefetchedReview(id)
    if (autoAdvance && nextQueueId) {
      router.push(`/expert/annotate/${nextQueueId}?returnTo=${encodeURIComponent(returnTo)}`)
    } else if (autoAdvance) {
      router.push(returnTo)
    } else {
      setScan((current) => current ? {
        ...current,
        existingVerification: { voted_species_id: decision === 'pending' ? selectedSpeciesId : null, bbox },
      } : current)
    }
  }

  const matchingSpecies = species.filter((item) =>
    `${item.scientific_name} ${item.name_th ?? ''} ${item.name_en ?? ''}`.toLowerCase().includes(search.toLowerCase())
  )
  const selectedSpecies = species.find((item) => item.id === selectedSpeciesId) ?? null
  const isEditingExistingReview = Boolean(scan?.existingVerification)
  const boxLabel = hasExpertSelectedSpecies && selectedSpecies
    ? selectedSpecies.scientific_name
    : scan?.confidence !== null ? scan?.prediction.scientific : 'Review box'
  const displayedBox = showFinalConsensus && scan?.consensus ? scan.consensus.bbox : bbox
  const displayedBoxLabel = showFinalConsensus && scan?.consensus ? scan.consensus.scientific : boxLabel
  const saveLabel = saving
    ? 'Saving review…'
    : autoAdvance
      ? nextQueueId ? 'Save & next' : 'Save & return to Workspace'
      : isEditingExistingReview ? 'Save changes' : 'Save my review'
  const reviewSummary = decision === 'pending'
    ? selectedSpecies && bbox
      ? { title: 'Ready to verify', detail: `${selectedSpecies.scientific_name} · 1 review box`, tone: 'text-emerald-300' }
      : selectedSpecies
        ? { title: 'Review box needed', detail: 'Draw a box around the subject before saving.', tone: 'text-amber-300' }
        : { title: 'Choose a reference species', detail: 'Select the species you identified before saving.', tone: 'text-amber-300' }
    : decision === 'unclear'
      ? { title: 'Save as unclear', detail: 'No species or review box will be saved.', tone: 'text-amber-300' }
      : { title: 'Request a new class', detail: 'This image will be sent for a new reference class.', tone: 'text-sky-300' }

  if (loading) return <main className="grid min-h-screen place-items-center text-sm text-zinc-500">Loading review task…</main>
  if (error || !scan) return <main className="grid min-h-screen place-items-center text-sm text-red-400">{error ?? 'Saved scan not found.'}</main>

  return (
    <main className="min-h-screen px-4 pb-20 pt-24 sm:px-6 sm:pt-28">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 border-b border-zinc-900 pb-6">
          <Button variant="ghost" size="sm" onClick={() => router.push(returnTo)} className="-ml-2 mb-5 text-zinc-500"><ArrowLeft size={16} /> Back to Workspace</Button>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div><p className="mb-2 text-xs uppercase tracking-[0.2em] text-emerald-400">Expert review</p><h1 className="text-2xl font-medium text-zinc-100">Review & correct classification</h1><p className="mt-2 text-sm text-zinc-500" title={`Original file: ${scan.originalFilename}`}>{formatScanLabel(scan.createdAt)}</p></div>
            <div className="flex flex-wrap items-center justify-end gap-2"><Badge variant="muted" className="text-xs">Independent review</Badge><label className="flex cursor-pointer items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-1.5 text-xs text-zinc-400 transition-colors hover:border-zinc-700"><input type="checkbox" checked={autoAdvance} onChange={(event) => setAutoAdvance(event.target.checked)} className="h-3.5 w-3.5 accent-emerald-500" />Auto-advance after saving</label>{queueIndex >= 0 && <div className="flex items-center rounded-lg border border-zinc-800 bg-zinc-900/50"><Button size="sm" variant="ghost" title="Previous task (Left arrow)" disabled={!previousQueueId} onClick={() => goToQueueItem(previousQueueId)} className="rounded-r-none px-2.5"><ChevronLeft size={15} /> Previous</Button><span className="border-x border-zinc-800 px-3 py-1.5 text-xs text-zinc-400">{queueIndex + 1} / {queueIds.length}</span><Button size="sm" variant="ghost" title="Next task (Right arrow)" disabled={!nextQueueId} onClick={() => goToQueueItem(nextQueueId)} className="rounded-l-none px-2.5">Next <ChevronRight size={15} /></Button></div>}</div>
          </div>
        </header>

        <div className="grid gap-7 lg:grid-cols-[minmax(0,1.45fr)_minmax(340px,0.8fr)]">
          <section className="flex h-full flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/20">
            <div className="flex items-center justify-between gap-3 border-b border-zinc-800 px-5 py-4"><span className="flex items-center gap-2 text-sm font-medium text-zinc-200"><Crosshair size={16} className="text-emerald-400" /> {showFinalConsensus ? 'Final consensus boundary' : 'Subject boundary'}</span><div className="flex items-center gap-2">{scan.consensus && <Button size="sm" variant={showFinalConsensus ? 'primary' : 'outline'} onClick={() => setShowFinalConsensus((current) => !current)}>{showFinalConsensus ? 'Back to my review' : 'View final consensus'}</Button>}{!showFinalConsensus && (bbox ? <Button size="sm" variant="outline" disabled={imageState !== 'ready'} onClick={redrawBox}><MousePointer2 size={14} /> Redraw</Button> : <Button size="sm" variant={placingBox ? 'primary' : 'outline'} disabled={imageState !== 'ready'} onClick={beginPlacingBox}>{placingBox ? 'Drag on image to draw' : <><Plus size={14} /> Add box</>}</Button>)}</div></div>
            <div className="flex min-h-[420px] flex-1 items-center justify-center bg-zinc-950 p-4 sm:p-6">
              {imageState === 'error' ? <p className="text-sm text-zinc-500">Image unavailable. Please return to Workspace and try again.</p> : readyImageUrl && <div ref={imageRef} className={`relative inline-block max-h-[600px] max-w-full select-none ${!showFinalConsensus && placingBox && imageState === 'ready' ? 'cursor-crosshair' : ''}`} onMouseDown={!showFinalConsensus && imageState === 'ready' ? beginDrawingBox : undefined} onMouseMove={!showFinalConsensus && imageState === 'ready' ? updateBox : undefined} onMouseUp={!showFinalConsensus && imageState === 'ready' ? endBoxAction : undefined} onMouseLeave={!showFinalConsensus && imageState === 'ready' ? endBoxAction : undefined}>
                <img src={readyImageUrl} alt="Saved subject for Expert review" draggable={false} className="block max-h-[600px] max-w-full rounded-lg object-contain" />
                {imageState === 'ready' && !displayedBox && <div className="pointer-events-none absolute inset-0 grid place-items-center"><span className="rounded-lg border border-zinc-700 bg-zinc-950/90 px-3 py-2 text-xs text-zinc-400">{placingBox ? 'Drag over the snake to draw a box' : 'No AI box · click Add box to create one'}</span></div>}
                {imageState === 'ready' && displayedBox && <div className={`absolute border-2 border-emerald-400 bg-emerald-500/10 shadow-[0_0_18px_rgba(16,185,129,0.22)] ${showFinalConsensus ? 'cursor-default' : 'cursor-move'}`} style={{ left: `${displayedBox.x}%`, top: `${displayedBox.y}%`, width: `${displayedBox.width}%`, height: `${displayedBox.height}%` }} onMouseDown={showFinalConsensus ? undefined : (event) => beginBoxAction(event, 'move')}><span className="absolute -top-7 left-0 max-w-[220px] truncate rounded bg-emerald-500 px-2 py-1 text-[10px] font-medium text-zinc-950">{displayedBoxLabel}</span>{!showFinalConsensus && <ResizeHandles onStart={beginBoxAction} />}</div>}
              </div>}
            </div>
            <div className="border-t border-zinc-800 px-5 py-3 text-xs text-zinc-500">{imageState === 'loading' ? 'Loading image…' : imageState === 'error' ? 'The image could not be loaded, so the review box is hidden.' : showFinalConsensus && scan.consensus ? `Final consensus: ${scan.consensus.scientific} · ${scan.consensus.reviewCount} expert reviews.` : bbox ? 'Drag inside the box to move it. Drag any edge or corner to resize it.' : placingBox ? 'Click and drag over the snake to draw a review box.' : 'No box was detected by AI. Add one only if you identify a snake.'}</div>
          </section>

          <aside className="flex h-full flex-col gap-5">
            <section className="shrink-0 rounded-2xl border border-zinc-800 bg-zinc-900/30 p-5"><div className="flex items-center justify-between gap-3"><p className="text-xs uppercase tracking-widest text-zinc-500">AI prediction</p><Badge variant={scan.confidence === null ? 'muted' : 'info'} className="px-2 py-0.5 text-[11px]">{scan.confidence === null ? 'No AI confidence' : `${(scan.confidence * 100).toFixed(1)}% confidence`}</Badge></div><p className="mt-3 text-lg font-medium italic text-zinc-100">{scan.prediction.scientific}</p>{!scan.prediction.id && <p className="mt-3 text-xs leading-5 text-amber-400">AI could not identify a reviewed species. Inspect the image and decide whether a snake is present.</p>}</section>

            <section className="flex flex-1 flex-col rounded-2xl border border-zinc-800 bg-zinc-900/30 p-5"><p className="text-xs uppercase tracking-widest text-zinc-500">Your decision</p><div className="mt-4 space-y-2"><DecisionOption active={decision === 'pending'} onClick={() => setDecision('pending')} title="Confirm or correct species" detail="Saves species + box · Consensus updates automatically." /><DecisionOption active={decision === 'unclear'} onClick={() => setDecision('unclear')} title="Cannot identify confidently" detail="Saves no species vote · Can be reviewed again." tone="amber" /><DecisionOption active={decision === 'waiting_for_new_class'} onClick={() => setDecision('waiting_for_new_class')} title="Species is not in the list" detail="Saves request · Waiting for New Class." tone="blue" /></div>
              {decision === 'pending' && <div className="mt-5 border-t border-zinc-800 pt-5"><label className="text-xs font-medium text-zinc-400">Reference species</label><div className="relative mt-2">{selectedSpecies && !speciesMenuOpen ? <button type="button" onClick={() => { setSearch(''); setSpeciesMenuOpen(true) }} className="flex w-full items-center justify-between gap-3 rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-left transition-colors hover:border-zinc-500"><span className="min-w-0"><span className="block truncate text-sm font-medium italic text-zinc-100">{selectedSpecies.scientific_name}</span><span className="mt-0.5 block truncate text-xs text-zinc-500">{selectedSpecies.name_th ?? selectedSpecies.name_en ?? 'No common name'}</span></span><span className="shrink-0 text-xs font-medium text-emerald-400">Change</span></button> : <><Search size={15} className="pointer-events-none absolute left-3 top-3 text-zinc-500" /><input value={search} autoFocus={speciesMenuOpen} onFocus={() => setSpeciesMenuOpen(true)} onChange={(event) => { setSearch(event.target.value); setSpeciesMenuOpen(true) }} placeholder="Search scientific or Thai name…" className="w-full rounded-lg border border-zinc-800 bg-zinc-950 py-2.5 pl-9 pr-3 text-sm text-zinc-200 outline-none transition-colors placeholder:text-zinc-600 focus:border-emerald-500" />{speciesMenuOpen && <div className="absolute z-20 mt-2 max-h-64 w-full overflow-y-auto overscroll-contain rounded-xl border border-zinc-700 bg-zinc-950 p-1.5 shadow-2xl shadow-black/50"><p className="px-3 pb-2 pt-1 text-[11px] text-zinc-500">{matchingSpecies.length} reference species</p>{matchingSpecies.length ? matchingSpecies.map((item) => { const isSelected = item.id === selectedSpeciesId; return <button key={item.id} type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => { setSelectedSpeciesId(item.id); setHasExpertSelectedSpecies(true); setSearch(''); setSpeciesMenuOpen(false) }} className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${isSelected ? 'bg-emerald-500/15 text-emerald-300' : 'text-zinc-200 hover:bg-zinc-800'}`}><span className="min-w-0"><span className="block truncate text-sm font-medium italic">{item.scientific_name}</span><span className="mt-0.5 block truncate text-xs text-zinc-500">{item.name_th ?? item.name_en ?? 'No common name'}</span></span>{isSelected && <Check size={16} className="shrink-0" />}</button> }) : <p className="px-3 py-4 text-center text-xs text-zinc-500">No reference species found.</p>}</div>}</>}</div></div>}
              <div className="mt-auto border-t border-zinc-800 pt-4">
                <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 px-3.5 py-3"><p className={`text-xs font-medium ${reviewSummary.tone}`}>{reviewSummary.title}</p><p className="mt-1 truncate text-xs text-zinc-500">{reviewSummary.detail}</p></div>
                <Button disabled={saving} onClick={submit} className="mt-3 w-full">{saveLabel}</Button>
              </div>
            </section>

            {scan.reviewHistory.length > 1 && <section className="rounded-2xl border border-zinc-800 bg-zinc-900/10 p-5"><p className="text-xs uppercase tracking-widest text-zinc-400">Review history</p><div className="mt-3 space-y-2">{scan.reviewHistory.map((review, index) => <div key={`${review.reviewer}-${review.createdAt}-${index}`} className="flex items-center justify-between gap-3 rounded-lg border border-zinc-800/80 bg-zinc-950/50 px-3 py-2.5"><span className="truncate text-xs text-zinc-400">{review.reviewer}</span><span className={`truncate text-right text-xs font-medium ${review.species ? 'italic text-zinc-200' : 'text-amber-400'}`}>{review.species ?? 'Unclear'}</span></div>)}</div></section>}

          </aside>
        </div>
      </div>
    </main>
  )
}

function ResizeHandles({ onStart }: { onStart: (event: ReactMouseEvent, mode: DragMode) => void }) {
  const handles: Array<{ mode: Exclude<DragMode, 'move'>; className: string; label: string }> = [
    { mode: 'nw', className: '-left-2 -top-2 cursor-nwse-resize', label: 'Resize from top left' },
    { mode: 'n', className: 'left-1/2 -top-1.5 h-3 w-10 -translate-x-1/2 cursor-ns-resize', label: 'Resize from top' },
    { mode: 'ne', className: '-right-2 -top-2 cursor-nesw-resize', label: 'Resize from top right' },
    { mode: 'e', className: '-right-1.5 top-1/2 h-10 w-3 -translate-y-1/2 cursor-ew-resize', label: 'Resize from right' },
    { mode: 'se', className: '-bottom-2 -right-2 cursor-nwse-resize', label: 'Resize from bottom right' },
    { mode: 's', className: '-bottom-1.5 left-1/2 h-3 w-10 -translate-x-1/2 cursor-ns-resize', label: 'Resize from bottom' },
    { mode: 'sw', className: '-bottom-2 -left-2 cursor-nesw-resize', label: 'Resize from bottom left' },
    { mode: 'w', className: '-left-1.5 top-1/2 h-10 w-3 -translate-y-1/2 cursor-ew-resize', label: 'Resize from left' },
  ]

  return <>{handles.map((handle) => <button key={handle.mode} type="button" aria-label={handle.label} className={`absolute z-10 h-4 w-4 rounded-sm border border-emerald-100 bg-emerald-500 shadow ${handle.className}`} onMouseDown={(event) => onStart(event, handle.mode)} />)}</>
}

function DecisionOption({ active, onClick, title, detail, tone = 'emerald' }: { active: boolean; onClick: () => void; title: string; detail: string; tone?: 'emerald' | 'amber' | 'blue' }) {
  const activeStyle = tone === 'amber' ? 'border-amber-500/70 bg-amber-500/10' : tone === 'blue' ? 'border-blue-500/70 bg-blue-500/10' : 'border-emerald-500/70 bg-emerald-500/10'
  return <button type="button" onClick={onClick} className={`w-full rounded-xl border p-3 text-left transition-colors ${active ? activeStyle : 'border-zinc-800 bg-zinc-950/40 hover:border-zinc-600'}`}><span className="flex items-start gap-3"><span className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${active ? 'border-zinc-100' : 'border-zinc-600'}`}><span className={active ? 'h-2 w-2 rounded-full bg-zinc-100' : ''} /></span><span><span className="block text-sm font-medium text-zinc-200">{title}</span><span className="mt-1 block text-xs leading-5 text-zinc-500">{detail}</span></span></span></button>
}
