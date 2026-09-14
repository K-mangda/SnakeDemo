import Button from '@/components/ui/Button'
import StatusBadge from '@/components/expert/StatusBadge'
import { FilterStatus } from '@/components/expert/ExpertTabs'
import { CalendarDays } from 'lucide-react'
import { formatScanDate, formatScanLabel } from '@/lib/scan-label'

interface ImageItem {
  id: string;
  originalFilename: string;
  imageUrl: string | null;
  status: string;
  bbox: { x: number, y: number, width: number, height: number } | null;
  confidence: number | null;
  createdAt: string;
  prediction: { scientific: string, nameTh: string | null };
}

interface ImageGridProps {
  filtered: ImageItem[];
  currentFilter: FilterStatus;
}

export default function ImageGrid({ filtered, currentFilter }: ImageGridProps) {
  if (filtered.length === 0) return null;

  return (
    <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {filtered.map((img) => {
        const isPending = img.status === 'pending'
        return (
          <div
            key={`${currentFilter}-${img.id}`}
            className="h-full border border-zinc-800 rounded-xl bg-zinc-900/20 p-5 flex flex-col hover:border-zinc-700 transition-colors"
          >
            {/* Top row */}
            <div className="flex justify-between items-start mb-4 gap-2">
              <span className="inline-flex min-w-0 items-center gap-1.5 text-[11px] text-zinc-500" title={`Original file: ${img.originalFilename} · ${formatScanLabel(img.createdAt)}`}>
                <CalendarDays size={12} className="shrink-0" />
                {formatScanDate(img.createdAt)}
              </span>
              <div className="shrink-0"><StatusBadge status={img.status} /></div>
            </div>

            {/* Image */}
            <div className="aspect-video bg-zinc-900 border border-zinc-800/50 rounded-lg mb-4 flex items-center justify-center relative overflow-hidden">
              {img.imageUrl ? <img src={img.imageUrl} alt="Saved subject" className="w-full h-full object-cover" /> : <span className="text-xs text-zinc-600">Image unavailable</span>}
              {img.bbox && <div
                className="absolute border-2 border-emerald-500 bg-emerald-500/20"
                style={{
                  left: `${img.bbox.x}%`, top: `${img.bbox.y}%`, width: `${img.bbox.width}%`, height: `${img.bbox.height}%`,
                }}
              />}
            </div>

            {/* Prediction info */}
            <div className="mb-4">
              <p className="text-xs text-zinc-500 mb-0.5">AI prediction · {((img.confidence ?? 0) * 100).toFixed(1)}%</p>
              <p className="text-sm font-medium text-zinc-300 italic">{img.prediction.scientific}</p>
            </div>

            {/* ── Single CTA ── */}
            <Button
              href={`/expert/annotate/${img.id}`}
              variant={isPending ? 'primary' : 'secondary'}
              className="mt-auto w-full justify-center"
            >
              {isPending ? 'Verify Classification' : 'View Details'}
            </Button>
          </div>
        )
      })}
    </div>
  )
}
