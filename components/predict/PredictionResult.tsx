import { Snake } from '@/lib/types'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { getDangerColor } from '@/lib/utils'

interface PredictionResultProps {
  result: Snake | null;
}

export default function PredictionResult({ result }: PredictionResultProps) {
  if (!result) {
    return (
      <div className="flex-1 border border-zinc-800/50 rounded-xl bg-zinc-900/10 flex items-center justify-center text-zinc-600 text-sm p-6 text-center">
        Analysis results will appear here after processing.
      </div>
    )
  }

  return (
    <div className="flex-1 border border-zinc-800 rounded-xl bg-zinc-900/40 p-6 flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <Badge variant="success" className="animate-fade-up">Classification Complete</Badge>
        <span className="text-xs font-mono text-emerald-500">CONFIDENCE: {result.confidence_avg}%</span>
      </div>

      <div className="mb-8">
        <p className="text-xs text-zinc-500 uppercase tracking-widest mb-1">{result.scientific}</p>
        <h2 className="text-2xl font-medium text-zinc-100">{result.name_en}</h2>
        <p className="text-zinc-400 text-sm mt-1">{result.name_th}</p>
      </div>

      <div className="space-y-4 mb-8 flex-1">
        <div className="flex justify-between items-center py-3 border-b border-zinc-800/50">
          <span className="text-sm text-zinc-500">Toxicity Profile</span>
          <span className={`text-sm font-medium ${getDangerColor(result.danger_level)}`}>{result.danger_label}</span>
        </div>
        <div className="flex justify-between items-center py-3 border-b border-zinc-800/50">
          <span className="text-sm text-zinc-500">Venom Type</span>
          <span className="text-sm text-zinc-300 capitalize">{result.venom_type}</span>
        </div>
        <div className="flex justify-between items-center py-3 border-b border-zinc-800/50">
          <span className="text-sm text-zinc-500">Antivenom Protocol</span>
          <span className="text-sm text-zinc-300 text-right max-w-[200px] truncate" title={result.antivenom}>{result.antivenom}</span>
        </div>
      </div>

      <Button href={`/database/${result.id}`} variant="secondary" className="w-full">
        View Full Medical Protocol
      </Button>
    </div>
  )
}
