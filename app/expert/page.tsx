'use client'

import { useState, useMemo } from 'react'
import { User } from 'lucide-react'
import { MOCK_IMAGES } from '@/lib/data'

import ExpertHeader from '@/components/expert/ExpertHeader'
import ExpertTabs, { FilterStatus, ViewMode, SortMode } from '@/components/expert/ExpertTabs'
import ImageGrid from '@/components/expert/ImageGrid'
import ImageList from '@/components/expert/ImageList'

// จำลอง: ภาพที่ expert คนนี้โหวตไปแล้ว (ในระบบจริงจะมาจาก API)
// My Queue = pending ทั้งหมด ยกเว้นที่โหวตไปแล้ว
const ALREADY_VOTED_IDS = new Set([1, 9]) // expert คนนี้เคยโหวตไป 2 ใบแล้ว

export default function ExpertPage() {
  const [currentFilter, setCurrentFilter] = useState<FilterStatus>('my_queue')
  const [viewMode, setViewMode]           = useState<ViewMode>('grid')
  const [sortMode, setSortMode]           = useState<SortMode>('confidence_asc')
  
  // local override: id → new status (quick action)
  const [overrides] = useState<Record<number, string>>({})

  // Merge mock data with quick-action overrides
  const images = useMemo(
    () => MOCK_IMAGES.map(img => ({ ...img, status: overrides[img.id] ?? img.status })),
    [overrides]
  )

  // Count per filter
  const counts: Record<FilterStatus, number> = useMemo(() => ({
    all:                   images.length,
    pending:               images.filter(i => i.status === 'pending').length,
    verified:              images.filter(i => i.status === 'verified').length,
    unclear:               images.filter(i => i.status === 'unclear').length,
    waiting_for_new_class: images.filter(i => i.status === 'waiting_for_new_class').length,
    my_queue:              images.filter(i => i.status === 'pending' && !ALREADY_VOTED_IDS.has(i.id)).length,
  }), [images])

  // Filter + Sort
  const filtered = useMemo(() => {
    let list = [...images]

    if (currentFilter === 'my_queue') {
      list = list.filter(i => i.status === 'pending' && !ALREADY_VOTED_IDS.has(i.id))
    } else if (currentFilter !== 'all') {
      list = list.filter(i => i.status === currentFilter)
    }

    if (sortMode === 'confidence_asc')  list.sort((a, b) => +a.ai_confidence - +b.ai_confidence)
    if (sortMode === 'confidence_desc') list.sort((a, b) => +b.ai_confidence - +a.ai_confidence)
    // 'date' keeps original insertion order

    return list
  }, [images, currentFilter, sortMode])

  return (
    <main className="min-h-screen pt-28 px-6 pb-20">
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
              <span className="text-zinc-300">{counts.my_queue}</span> images awaiting your vote
              {' '}· <span className="text-zinc-300">{ALREADY_VOTED_IDS.size}</span> already voted, hidden from this view
            </span>
          </div>
        )}

        {/* ── Empty state ───────────────────────────────────────── */}
        {filtered.length === 0 && (
          <div className="py-20 text-center border border-zinc-800 border-dashed rounded-xl bg-zinc-900/10">
            <p className="text-zinc-500">No images found for this filter.</p>
          </div>
        )}

        {viewMode === 'grid' && <ImageGrid filtered={filtered} currentFilter={currentFilter} />}
        {viewMode === 'list' && <ImageList filtered={filtered} currentFilter={currentFilter} />}
      </div>
    </main>
  )
}
