'use client'

import Link from 'next/link'
import StatusBadge from '@/components/expert/StatusBadge'
import { FilterStatus } from '@/components/expert/ExpertTabs'
import { formatScanLabel } from '@/lib/scan-label'
import { supabase } from '@/lib/supabase/client'
import { prefetchExpertReview } from '@/lib/expert-review-cache'
import BoundingBoxThumbnail from '@/components/expert/BoundingBoxThumbnail'

interface ImageItem {
  id: string;
  originalFilename: string;
  imageUrl: string | null;
  status: string;
  bbox: { x: number, y: number, width: number, height: number } | null;
  confidence: number | null;
  createdAt: string;
  review: { count: number; hasReviewed: boolean };
  prediction: { scientific: string, nameTh: string | null };
}

interface ImageListProps {
  filtered: ImageItem[];
  currentFilter: FilterStatus;
  reviewHref: (imageId: string) => string;
}

export default function ImageList({ filtered, currentFilter, reviewHref }: ImageListProps) {
  if (filtered.length === 0) return null;

  async function warmReview(imageId: string) {
    const { data: { session } } = await supabase.auth.getSession()
    if (session) void prefetchExpertReview(imageId, session.access_token)
  }

  // Confidence color text (only for list view label — no bar per design)
  const confTextColor = (c: number) =>
    c >= 93 ? 'text-emerald-400' : c >= 88 ? 'text-amber-400' : 'text-red-400'
  const displayedImages = currentFilter === 'all'
    ? [...filtered.filter((image) => image.status !== 'verified'), ...filtered.filter((image) => image.status === 'verified')]
    : filtered

  return (
    <div className="flex flex-col gap-1.5">
      {/* List header */}
      <div className="hidden md:grid md:grid-cols-[64px_1fr_100px_120px_150px] gap-4 px-4 py-2
                      text-[10px] text-zinc-500 uppercase tracking-widest border-b border-zinc-800/60">
        <div aria-hidden="true"></div>
        <div>Species / File</div>
        <div className="text-center">Confidence</div>
        <div className="text-center">Status</div>
        <div className="text-right">Actions</div>
      </div>

      {displayedImages.map((img) => {
        const needsCurrentReview = (img.status === 'pending' || img.status === 'unclear') && !img.review.hasReviewed
        const canAudit = img.status === 'verified' && !img.review.hasReviewed
        const statusForViewer = img.status
        const statusLabel = undefined
        const conf = (img.confidence ?? 0) * 100

        return (
          <Link
            key={`${currentFilter}-${img.id}`}
            href={reviewHref(img.id)}
            aria-label={`Open ${img.prediction.scientific} for review`}
            className="grid grid-cols-[64px_1fr_auto] md:grid-cols-[64px_1fr_100px_120px_150px] gap-4
                       items-center px-4 py-3
                       border border-zinc-800/50 rounded-xl bg-zinc-900/10
                       hover:bg-emerald-500/[0.035] hover:border-emerald-500/60 transition-all cursor-pointer focus:outline-none focus-visible:border-emerald-400 focus-visible:ring-2 focus-visible:ring-emerald-500/30"
            onMouseEnter={() => void warmReview(img.id)}
            onFocus={() => void warmReview(img.id)}
          >
            {/* Thumbnail */}
            <BoundingBoxThumbnail imageUrl={img.imageUrl} bbox={img.bbox} alt="" aspectRatio={16 / 11} className="relative h-11 w-16 shrink-0 overflow-hidden rounded-lg bg-zinc-900" boxClassName="absolute border border-emerald-500/60" />

            {/* Species / File */}
            <div className="min-w-0">
              <p className="text-sm font-medium text-zinc-200 truncate italic">{img.prediction.scientific}</p>
              <p className="text-xs text-zinc-500 truncate">
                {img.prediction.nameTh ?? 'No mapped reference'} &middot; {formatScanLabel(img.createdAt)}
              </p>
              <p className="mt-1 text-[11px] text-zinc-600">
                {img.review.hasReviewed ? `Your review saved · ${img.review.count} total review${img.review.count === 1 ? '' : 's'}` : canAudit ? `Verified · ${img.review.count} expert review${img.review.count === 1 ? '' : 's'}` : img.status === 'pending' && img.review.count > 1 ? 'Review conflict · another review is needed' : 'Your review is needed'}
              </p>
            </div>

            {/* Confidence — text only, color-coded */}
            <div className="hidden md:block text-center">
              <span className={`font-mono text-sm font-semibold ${confTextColor(conf)}`}>
                {conf.toFixed(1)}%
              </span>
            </div>

            {/* Status */}
            <div className="hidden md:flex justify-center"><StatusBadge status={statusForViewer} label={statusLabel} /></div>

            {/* Actions */}
            <div className="flex w-full">
              <span className={`w-full text-center text-xs px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${needsCurrentReview ? 'bg-emerald-600 text-white' : 'bg-zinc-800 border border-zinc-700 text-zinc-300'}`}>
                {needsCurrentReview ? 'Verify Classification' : canAudit ? 'Review again' : img.review.hasReviewed ? 'Update my review' : 'View Details'}
              </span>
            </div>
          </Link>
        )
      })}
    </div>
  )
}
