'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { cacheWorkspacePage, getCachedWorkspacePage } from '@/lib/expert-workspace-cache'

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
  consensus: { scientific: string; nameTh: string | null; reviewCount: number } | null
}

type WorkspacePayload = {
  images: WorkspaceImage[]
  counts: Record<FilterStatus, number>
  total: number
}

// The API response cache makes tab data instant. Warm the matching image URLs
// as well, so changing from All to a status tab does not feel like loading the
// same thumbnails for a second time.
const warmedThumbnailUrls = new Set<string>()

function warmThumbnails(images: WorkspaceImage[]) {
  for (const { imageUrl } of images) {
    if (!imageUrl || warmedThumbnailUrls.has(imageUrl)) continue
    warmedThumbnailUrls.add(imageUrl)
    const image = new window.Image()
    image.src = imageUrl
  }
}

function workspacePageKey(filter: FilterStatus, page: number, pageSize: number, sort: SortMode) {
  return `${filter}:${page}:${pageSize}:${sort}`
}

async function fetchWorkspacePage(accessToken: string, filter: FilterStatus, page: number, pageSize: number, sort: SortMode) {
  const params = new URLSearchParams({ filter, page: String(page), page_size: String(pageSize), sort })
  const response = await fetch(`/api/expert/images?${params}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: 'no-store',
  })
  const payload = await response.json()
  if (!response.ok) throw new Error(payload.detail ?? 'Could not load saved scans.')
  return payload as WorkspacePayload
}

export default function ExpertPage() {
  const searchParams = useSearchParams()
  const initialFilter = searchParams.get('filter')
  const initialView = searchParams.get('view')
  const initialSort = searchParams.get('sort')
  const initialPage = Number(searchParams.get('page'))
  const initialPageSize = Number(searchParams.get('pageSize'))
  const [currentFilter, setCurrentFilter] = useState<FilterStatus>(() => ['all', 'pending', 'verified', 'unclear', 'waiting_for_new_class'].includes(initialFilter ?? '') ? initialFilter as FilterStatus : 'pending')
  const [viewMode, setViewMode]           = useState<ViewMode>(() => initialView === 'list' ? 'list' : 'grid')
  const [sortMode, setSortMode]           = useState<SortMode>(() => ['date', 'confidence_asc', 'confidence_desc'].includes(initialSort ?? '') ? initialSort as SortMode : 'confidence_asc')
  const [images, setImages] = useState<WorkspaceImage[]>([])
  const [counts, setCounts] = useState<Record<FilterStatus, number>>({ all: 0, pending: 0, verified: 0, unclear: 0, waiting_for_new_class: 0 })
  const [pageSize, setPageSize] = useState(() => [20, 50, 100, 200].includes(initialPageSize) ? initialPageSize : 20)
  const [page, setPage] = useState(() => Number.isInteger(initialPage) && initialPage >= 0 ? initialPage : 0)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const cacheKey = workspacePageKey(currentFilter, page, pageSize, sortMode)
    const cached = getCachedWorkspacePage<WorkspacePayload>(cacheKey)
    const shouldRefresh = refreshKey === cacheKey

    if (cached) {
      setImages(cached.images)
      setCounts(cached.counts)
      setTotal(cached.total)
      setLoadError(null)
      setLoading(false)
    } else {
      setLoading(true)
      setImages([])
      setLoadError(null)
    }

    async function loadImages() {
      if (cached && !shouldRefresh) return
      const { data: { session } } = await supabase.auth.getSession()
      if (!session || cancelled) {
        if (!cancelled) setLoading(false)
        return
      }

      try {
        const payload = await fetchWorkspacePage(session.access_token, currentFilter, page, pageSize, sortMode)
        if (cancelled) return

        cacheWorkspacePage(cacheKey, payload)
        warmThumbnails(payload.images)
        setImages(payload.images)
        setCounts(payload.counts)
        setTotal(payload.total)
        setLoadError(null)

        // Warm only the first 20 records of non-empty tabs. The browser does
        // not download thumbnails until that tab is actually shown.
        if (page === 0 && pageSize === 20) {
          const filters: FilterStatus[] = ['all', 'pending', 'verified', 'unclear', 'waiting_for_new_class']
          for (const filter of filters) {
            const preloadKey = workspacePageKey(filter, 0, 20, sortMode)
            if (filter === currentFilter || payload.counts[filter] === 0 || getCachedWorkspacePage(preloadKey)) continue
            void fetchWorkspacePage(session.access_token, filter, 0, 20, sortMode)
              .then((preloaded) => {
                cacheWorkspacePage(preloadKey, preloaded)
                warmThumbnails(preloaded.images)
              })
              .catch(() => undefined)
          }
        }
      } catch (error) {
        // Keep cached cards visible if a background refresh has a transient error.
        if (!cancelled && !cached) setLoadError(error instanceof Error ? error.message : 'Could not load saved scans. Please try again.')
      } finally {
        if (!cancelled) {
          setLoading(false)
          if (shouldRefresh) setRefreshKey((current) => current === cacheKey ? null : current)
        }
      }
    }

    loadImages()

    return () => {
      cancelled = true
    }
  }, [currentFilter, page, pageSize, refreshKey, sortMode])

  useEffect(() => {
    const requestRefresh = () => {
      if (document.visibilityState === 'visible') {
        setRefreshKey(workspacePageKey(currentFilter, page, pageSize, sortMode))
      }
    }
    const handleVisibilityChange = () => requestRefresh()
    const interval = window.setInterval(requestRefresh, 30_000)

    window.addEventListener('focus', requestRefresh)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      window.clearInterval(interval)
      window.removeEventListener('focus', requestRefresh)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [currentFilter, page, pageSize, sortMode])

  const pageCount = Math.max(1, Math.ceil(total / pageSize))
  const visibleStart = total === 0 ? 0 : page * pageSize + 1
  const visibleEnd = Math.min(total, (page + 1) * pageSize)
  const reviewHref = (imageId: string) => {
    const returnTo = new URLSearchParams({ filter: currentFilter, page: String(page), pageSize: String(pageSize), sort: sortMode, view: viewMode })
    return `/expert/annotate/${imageId}?returnTo=${encodeURIComponent(`/expert?${returnTo}`)}`
  }

  return (
    <main className="min-h-screen pt-24 sm:pt-28 px-4 sm:px-6 pb-20">
      <div className="max-w-[1400px] mx-auto">
        <ExpertHeader />

        <ExpertTabs 
          currentFilter={currentFilter}
          setCurrentFilter={(filter) => {
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

        {!loading && !loadError && viewMode === 'grid' && <ImageGrid filtered={images} currentFilter={currentFilter} reviewHref={reviewHref} />}
        {!loading && !loadError && viewMode === 'list' && <ImageList filtered={images} currentFilter={currentFilter} reviewHref={reviewHref} />}

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
