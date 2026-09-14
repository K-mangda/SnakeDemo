import Link from 'next/link'
import StatusBadge from '@/components/expert/StatusBadge'
import { FilterStatus } from '@/components/expert/ExpertTabs'
import { formatScanLabel } from '@/lib/scan-label'

interface ImageItem {
  id: string;
  originalFilename: string;
  imageUrl: string | null;
  status: string;
  bbox: { x: number, y: number, width: number, height: number } | null;
  confidence: number | null;
  createdAt: string;
  review: { count: number; required: number; hasReviewed: boolean };
  prediction: { scientific: string, nameTh: string | null };
}

interface ImageListProps {
  filtered: ImageItem[];
  currentFilter: FilterStatus;
}

export default function ImageList({ filtered, currentFilter }: ImageListProps) {
  if (filtered.length === 0) return null;

  // Confidence color text (only for list view label — no bar per design)
  const confTextColor = (c: number) =>
    c >= 93 ? 'text-emerald-400' : c >= 88 ? 'text-amber-400' : 'text-red-400'

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

      {filtered.map((img) => {
        const needsCurrentReview = (img.status === 'pending' || img.status === 'unclear' || img.status === 'no_detection') && !img.review.hasReviewed
        const statusForViewer = needsCurrentReview && img.status !== 'no_detection' ? 'pending' : img.status
        const statusLabel = img.status === 'no_detection' ? 'No AI detection' : needsCurrentReview ? 'Review needed' : img.status === 'pending' ? 'Submitted' : img.status === 'unclear' ? 'No consensus' : undefined
        const conf = (img.confidence ?? 0) * 100

        return (
          <div
            key={`${currentFilter}-${img.id}`}
            className="grid grid-cols-[64px_1fr_auto] md:grid-cols-[64px_1fr_100px_120px_150px] gap-4
                       items-center px-4 py-3
                       border border-zinc-800/50 rounded-xl bg-zinc-900/10
                       hover:bg-zinc-900/30 hover:border-zinc-700/70 transition-all"
          >
            {/* Thumbnail */}
            <div className="w-16 h-11 bg-zinc-900 rounded-lg overflow-hidden relative shrink-0">
              {img.imageUrl && <img src={img.imageUrl} alt="" className="w-full h-full object-cover" />}
              {img.bbox && <div
                className="absolute border border-emerald-500/60"
                style={{
                  left: `${img.bbox.x}%`, top: `${img.bbox.y}%`, width: `${img.bbox.width}%`, height: `${img.bbox.height}%`,
                }}
              />}
            </div>

            {/* Species / File */}
            <div className="min-w-0">
              <p className="text-sm font-medium text-zinc-200 truncate italic">{img.prediction.scientific}</p>
              <p className="text-xs text-zinc-500 truncate">
                {img.prediction.nameTh ?? 'No mapped reference'} &middot; {formatScanLabel(img.createdAt)}
              </p>
              <p className="mt-1 text-[11px] text-zinc-600">
                {img.review.hasReviewed ? `Your review submitted · ${img.review.count} expert review${img.review.count === 1 ? '' : 's'}` : img.status === 'verified' ? `Verified from ${img.review.count} expert review${img.review.count === 1 ? '' : 's'}` : 'Your review is needed'}
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
              {needsCurrentReview ? (
                <Link
                  href={`/expert/annotate/${img.id}`}
                  className="w-full text-center text-xs px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors whitespace-nowrap"
                >
                  Verify Classification
                </Link>
              ) : (
                <Link
                  href={`/expert/annotate/${img.id}`}
                  className="w-full text-center text-xs px-3 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700
                             text-zinc-300 hover:text-zinc-100 hover:border-zinc-600 transition-colors whitespace-nowrap"
                >
                  {img.review.hasReviewed ? 'Update my review' : 'View Details'}
                </Link>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
