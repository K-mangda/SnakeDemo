import Button from '@/components/ui/Button'
import StatusBadge from '@/components/expert/StatusBadge'
import { FilterStatus } from '@/components/expert/ExpertTabs'

interface ImageItem {
  id: number;
  filename: string;
  status: string;
  bounding_box: { x: number, y: number, w: number, h: number };
  ai_confidence: number | string;
  ai_prediction: { scientific: string, name_th: string };
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
              <span className="font-mono text-xs text-zinc-500 truncate" title={img.filename}>
                IMG_{String(img.id).padStart(4, '0')}.jpg
              </span>
              <div className="shrink-0"><StatusBadge status={img.status} /></div>
            </div>

            {/* Image */}
            <div className="aspect-video bg-zinc-900 border border-zinc-800/50 rounded-lg mb-4 flex items-center justify-center relative overflow-hidden">
              <img src={img.filename} alt="Subject" className="w-full h-full object-cover" />
              <div
                className="absolute border-2 border-emerald-500 bg-emerald-500/20"
                style={{
                  left:   `${img.bounding_box.x}%`,
                  top:    `${img.bounding_box.y}%`,
                  width:  `${img.bounding_box.w}%`,
                  height: `${img.bounding_box.h}%`,
                }}
              />
            </div>

            {/* Prediction info */}
            <div className="mb-4">
              <p className="text-xs text-zinc-500 mb-0.5">AI Prediction ({img.ai_confidence}%)</p>
              <p className="text-sm font-medium text-zinc-300 italic">{img.ai_prediction.scientific}</p>
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
