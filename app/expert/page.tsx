'use client'

import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, User } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'

import ExpertHeader from '@/components/expert/ExpertHeader'
import ExpertTabs, { FilterStatus, ViewMode, SortMode } from '@/components/expert/ExpertTabs'
import ImageGrid from '@/components/expert/ImageGrid'
import ImageList from '@/components/expert/ImageList'

type WorkspaceImage = {
  id: string
  originalFilename: string
  imageUrl: string | null
  status: 'pending' | 'verified' | 'unclear' | 'waiting_for_new_class'
  confidence: number | null
  bbox: { x: number; y: number; width: number; height: number } | null
  createdAt: string
  review: { count: number; hasReviewed: boolean }
  prediction: { scientific: string; nameTh: string | null }
}

export default function ExpertPage() {
  const [currentFilter, setCurrentFilter] = useState<FilterStatus>('my_queue')
  const [viewMode, setViewMode]           = useState<ViewMode>('grid')
  const [sortMode, setSortMode]           = useState<SortMode>('confidence_asc')
  const [images, setImages] = useState<WorkspaceImage[]>([])
  const [counts, setCounts] = useState<Record<FilterStatus, number>>({ all: 0, pending: 0, verified: 0, unclear: 0, waiting_for_new_class: 0, my_queue: 0 })
  const [pageSize, setPageSize] = useState(20)
  const [page, setPage] = useState(0)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    // Never leave cards from the previous tab on screen while this tab loads.
    setLoading(true)
    setImages([])
    setLoadError(null)

    async function loadImages() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session || cancelled) {
        if (!cancelled) setLoading(false)
        return
      }

      try {
        const params = new URLSearchParams({
          filter: currentFilter,
          page: String(page),
          page_size: String(pageSize),
          sort: sortMode,
        })
        const response = await fetch(`/api/expert/images?${params}`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
          cache: 'no-store',
        })
        const payload = await response.json()
        if (cancelled) return

        if (!response.ok) {
          setLoadError(payload.detail ?? 'Could not load saved scans.')
          return
        }

        const nextImages = payload.images as WorkspaceImage[]
        setImages(nextImages)
        setCounts(payload.counts as Record<FilterStatus, number>)
        setTotal(payload.total as number)
        setLoadError(null)
      } catch {
        if (!cancelled) setLoadError('Could not load saved scans. Please try again.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadImages()

    return () => {
      cancelled = true
    }
  }, [currentFilter, page, pageSize, sortMode])

  const pageCount = Math.max(1, Math.ceil(total / pageSize))
  const visibleStart = total === 0 ? 0 : page * pageSize + 1
  const visibleEnd = Math.min(total, (page + 1) * pageSize)

  return (
    <main className="min-h-screen pt-24 sm:pt-28 px-4 sm:px-6 pb-20">
      <div className="max-w-[1400px] mx-auto">
        <ExpertHeader />

        <ExpertTabs 
          currentFilter={currentFilter}
          setCurrentFilter={(filter) => {
            setImages([])
            setLoadError(null)
            setLoading(true)
            setCurrentFilter(filter)
            setPage(0)
          }}
          counts={counts}
          pageSize={pageSize}
          setPageSize={(size) => { setPageSize(size); setPage(0) }}
          sortMode={sortMode}
          setSortMode={setSortMode}
          viewMode={viewMode}
          setViewMode={setViewMode}
        />

        {/* ── My Queue hint banner ─────────────────────────────── */}
        {currentFilter === 'my_queue' && (
          <div className="mb-6 flex items-center gap-2 text-zinc-500 text-xs">
            <User size={13} className="shrink-0" />
            <span>
              <span className="text-zinc-300">{counts.my_queue}</span> images need your review
            </span>
          </div>
        )}

        <p className="mb-6 max-w-3xl text-xs leading-5 text-zinc-500">
          Reviews are independent. When more than one Expert reviews an image, the system uses the majority vote and combines matching bounding boxes automatically.
        </p>

        {/* ── Empty state ───────────────────────────────────────── */}
        {loading && <p className="py-20 text-center text-sm text-zinc-500">Loading saved scans…</p>}

        {loadError && <p className="py-20 text-center text-sm text-red-400">{loadError}</p>}

        {!loading && !loadError && images.length === 0 && (
          <div className="py-20 text-center border border-zinc-800 border-dashed rounded-xl bg-zinc-900/10">
            <p className="text-zinc-500">No images found for this filter.</p>
          </div>
        )}

        {!loading && !loadError && viewMode === 'grid' && <ImageGrid filtered={images} currentFilter={currentFilter} />}
        {!loading && !loadError && viewMode === 'list' && <ImageList filtered={images} currentFilter={currentFilter} />}

        {!loading && !loadError && total > 0 && <div className="mt-8 flex flex-col-reverse gap-4 border-t border-zinc-800 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-zinc-500">Showing <span className="text-zinc-300">{visibleStart}–{visibleEnd}</span> of <span className="text-zinc-300">{total}</span> tasks</p>
          <div className="flex items-center justify-end gap-3">
            <div className="flex items-center rounded-lg border border-zinc-800 bg-zinc-900">
              <button type="button" aria-label="Previous page" disabled={page === 0} onClick={() => setPage((current) => current - 1)} className="p-1.5 text-zinc-400 transition hover:text-zinc-100 disabled:cursor-not-allowed disabled:opacity-30"><ChevronLeft size={16} /></button>
              <span className="border-x border-zinc-800 px-3 py-1.5 text-xs text-zinc-400">{page + 1} / {pageCount}</span>
              <button type="button" aria-label="Next page" disabled={page + 1 >= pageCount} onClick={() => setPage((current) => current + 1)} className="p-1.5 text-zinc-400 transition hover:text-zinc-100 disabled:cursor-not-allowed disabled:opacity-30"><ChevronRight size={16} /></button>
            </div>
          </div>
        </div>}
      </div>
    </main>
  )
}
