'use client'

import { useEffect, useMemo, useState } from 'react'
import { User } from 'lucide-react'
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
  review: { count: number; required: number; hasReviewed: boolean }
  prediction: { scientific: string; nameTh: string | null }
}

export default function ExpertPage() {
  const [currentFilter, setCurrentFilter] = useState<FilterStatus>('my_queue')
  const [viewMode, setViewMode]           = useState<ViewMode>('grid')
  const [sortMode, setSortMode]           = useState<SortMode>('confidence_asc')
  const [images, setImages] = useState<WorkspaceImage[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    async function loadImages() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const response = await fetch('/api/expert/images', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      const payload = await response.json()
      if (!response.ok) {
        setLoadError(payload.detail ?? 'Could not load saved scans.')
      } else {
        setImages(payload.images)
      }
      setLoading(false)
    }
    loadImages()
  }, [])

  // Count per filter
  const counts: Record<FilterStatus, number> = useMemo(() => ({
    all:                   images.length,
    pending:               images.filter(i => i.status === 'pending').length,
    verified:              images.filter(i => i.status === 'verified').length,
    unclear:               images.filter(i => i.status === 'unclear').length,
    waiting_for_new_class: images.filter(i => i.status === 'waiting_for_new_class').length,
    my_queue:              images.filter(i => (i.status === 'pending' || i.status === 'unclear') && !i.review.hasReviewed).length,
  }), [images])

  // Filter + Sort
  const filtered = useMemo(() => {
    let list = [...images]

    if (currentFilter === 'my_queue') {
      list = list.filter(i => (i.status === 'pending' || i.status === 'unclear') && !i.review.hasReviewed)
    } else if (currentFilter !== 'all') {
      list = list.filter(i => i.status === currentFilter)
    }

    if (sortMode === 'confidence_asc')  list.sort((a, b) => (a.confidence ?? 0) - (b.confidence ?? 0))
    if (sortMode === 'confidence_desc') list.sort((a, b) => (b.confidence ?? 0) - (a.confidence ?? 0))

    return list
  }, [images, currentFilter, sortMode])

  return (
    <main className="min-h-screen pt-24 sm:pt-28 px-4 sm:px-6 pb-20">
      <div className="max-w-[1400px] mx-auto">
        <ExpertHeader />

        <ExpertTabs 
          currentFilter={currentFilter}
          setCurrentFilter={setCurrentFilter}
          counts={counts}
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

        {/* ── Empty state ───────────────────────────────────────── */}
        {loading && <p className="py-20 text-center text-sm text-zinc-500">Loading saved scans…</p>}

        {loadError && <p className="py-20 text-center text-sm text-red-400">{loadError}</p>}

        {!loading && !loadError && filtered.length === 0 && (
          <div className="py-20 text-center border border-zinc-800 border-dashed rounded-xl bg-zinc-900/10">
            <p className="text-zinc-500">No images found for this filter.</p>
          </div>
        )}

        {!loading && !loadError && viewMode === 'grid' && <ImageGrid filtered={filtered} currentFilter={currentFilter} />}
        {!loading && !loadError && viewMode === 'list' && <ImageList filtered={filtered} currentFilter={currentFilter} />}
      </div>
    </main>
  )
}
