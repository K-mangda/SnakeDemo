'use client'

import Link from 'next/link'
import StatusBadge from '@/components/expert/StatusBadge'
import { FilterStatus } from '@/components/expert/ExpertTabs'
import { CalendarDays } from 'lucide-react'
import { formatScanDate, formatScanLabel } from '@/lib/scan-label'
import { supabase } from '@/lib/supabase/client'
import { prefetchExpertReview } from '@/lib/expert-review-cache'

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

interface ImageGridProps {
  filtered: ImageItem[];
  currentFilter: FilterStatus;
}

export default function ImageGrid({ filtered, currentFilter }: ImageGridProps) {
  if (filtered.length === 0) return null;

  async function warmReview(imageId: string) {
    const { data: { session } } = await supabase.auth.getSession()
    if (session) void prefetchExpertReview(imageId, session.access_token)
  }

  const workingImages = currentFilter === 'all' ? filtered.filter((image) => image.status !== 'verified') : filtered
  const verifiedImages = currentFilter === 'all' ? filtered.filter((image) => image.status === 'verified') : []

  function renderCard(img: ImageItem) {
    const needsCurrentReview = (img.status === 'pending' || img.status === 'unclear') && !img.review.hasReviewed
    const canAudit = img.status === 'verified' && !img.review.hasReviewed
    return (
      <Link
        key={`${currentFilter}-${img.id}`}
        href={`/expert/annotate/${img.id}`}
        aria-label={`Open ${img.prediction.scientific} for review`}
        className="group h-full cursor-pointer rounded-xl border border-zinc-800 bg-zinc-900/20 p-5 flex flex-col transition-all hover:border-emerald-500/60 hover:bg-emerald-500/[0.035] focus:outline-none focus-visible:border-emerald-400 focus-visible:ring-2 focus-visible:ring-emerald-500/30"
        onMouseEnter={() => void warmReview(img.id)}
        onFocus={() => void warmReview(img.id)}
      >
        <div className="flex justify-between items-start mb-4 gap-2"><span className="inline-flex min-w-0 items-center gap-1.5 text-[11px] text-zinc-500" title={`Original file: ${img.originalFilename} · ${formatScanLabel(img.createdAt)}`}><CalendarDays size={12} className="shrink-0" />{formatScanDate(img.createdAt)}</span><div className="shrink-0"><StatusBadge status={img.status} /></div></div>
        <div className="aspect-video bg-zinc-900 border border-zinc-800/50 rounded-lg mb-4 flex items-center justify-center relative overflow-hidden">{img.imageUrl ? <img src={img.imageUrl} alt="Saved subject" className="w-full h-full object-cover" /> : <span className="text-xs text-zinc-600">Image unavailable</span>}{img.bbox && <div className="absolute border-2 border-emerald-500 bg-emerald-500/20" style={{ left: `${img.bbox.x}%`, top: `${img.bbox.y}%`, width: `${img.bbox.width}%`, height: `${img.bbox.height}%` }} />}</div>
        <div className="mb-4"><p className="text-xs text-zinc-500 mb-0.5">AI prediction · {((img.confidence ?? 0) * 100).toFixed(1)}%</p><p className="text-sm font-medium text-zinc-300 italic">{img.prediction.scientific}</p><p className="mt-1 text-[11px] text-zinc-500">{img.review.hasReviewed ? `Your review saved · ${img.review.count} total review${img.review.count === 1 ? '' : 's'}` : canAudit ? `Verified · ${img.review.count} expert review${img.review.count === 1 ? '' : 's'}` : img.status === 'pending' && img.review.count > 1 ? 'Review conflict · another review is needed' : 'Your review is needed'}</p></div>
        <span className={`mt-auto flex w-full justify-center rounded-lg px-3 py-2 text-sm font-medium transition-colors ${needsCurrentReview ? 'bg-emerald-600 text-white group-hover:bg-emerald-500' : 'border border-zinc-700 bg-zinc-800 text-zinc-300 group-hover:border-zinc-600 group-hover:text-zinc-100'}`}>{needsCurrentReview ? 'Verify Classification' : canAudit ? 'Review again' : img.review.hasReviewed ? 'Update my review' : 'View Details'}</span>
      </Link>
    )
  }

  return (
    <div className="space-y-8"><div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">{workingImages.map(renderCard)}</div>{verifiedImages.length > 0 && <><div className="flex items-center gap-3"><div className="h-px flex-1 bg-zinc-800" /><p className="text-xs font-medium uppercase tracking-widest text-emerald-400">Verified reviews · {verifiedImages.length}</p><div className="h-px flex-1 bg-zinc-800" /></div><div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">{verifiedImages.map(renderCard)}</div></>}</div>
  )
}
