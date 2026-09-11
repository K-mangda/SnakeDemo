import { PredictionView } from '@/lib/prediction'
import Badge from '@/components/ui/Badge'
import { getDangerColor } from '@/lib/utils'
import { AlertTriangle, ScanLine, ShieldAlert } from 'lucide-react'

interface PredictionResultProps {
  result: PredictionView | null;
}

export default function PredictionResult({ result }: PredictionResultProps) {
  if (!result) {
    return (
      <div className="flex-1 border border-zinc-800/50 rounded-xl bg-zinc-900/10 flex items-center justify-center text-zinc-600 text-sm p-6 text-center">
        Analysis results will appear here after processing.
      </div>
    )
  }

  const isLowConfidence = result.detection.confidence < 0.65

  return (
    <div className="flex-1 overflow-hidden rounded-xl border border-zinc-800 bg-[linear-gradient(145deg,rgba(24,24,27,0.65),rgba(9,9,11,0.9))] p-6 flex flex-col shadow-2xl shadow-black/20">
      <div className="flex items-center justify-between gap-3 mb-7">
        <Badge variant="success" className="animate-fade-up">Classification Complete</Badge>
        <span className="text-xs font-mono text-emerald-500">CONFIDENCE: {(result.detection.confidence * 100).toFixed(1)}%</span>
      </div>

      <div className="mb-6 flex items-start gap-3">
        <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-emerald-500/25 bg-emerald-500/10 text-emerald-400">
          <ScanLine size={20} />
        </div>
        <div>
          <p className="text-[11px] text-zinc-500 uppercase tracking-[0.18em] mb-1">Detected species</p>
          <h2 className="text-2xl font-medium text-zinc-100 leading-tight">{result.reference?.name_en ?? result.detection.scientific}</h2>
          <p className="text-sm text-zinc-400 mt-1 italic">{result.detection.scientific}</p>
          {result.reference && <p className="text-sm text-zinc-500 mt-1">{result.reference.name_th}</p>}
        </div>
      </div>

      <section className="mb-5 rounded-xl border border-zinc-800 bg-zinc-950/45 p-4">
        <div className="flex items-center justify-between text-xs">
          <span className="text-zinc-500 uppercase tracking-wider">AI confidence</span>
          <span className="font-mono font-medium text-emerald-400">{(result.detection.confidence * 100).toFixed(1)}%</span>
        </div>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-zinc-800">
          <div className={`h-full rounded-full ${isLowConfidence ? 'bg-amber-400' : 'bg-emerald-500'}`} style={{ width: `${Math.min(result.detection.confidence * 100, 100)}%` }} />
        </div>
        <p className="mt-3 text-xs leading-5 text-zinc-400">
          {isLowConfidence
            ? 'ความมั่นใจต่ำ ควรให้ผู้เชี่ยวชาญตรวจสอบเพิ่มเติม'
            : 'ผลลัพธ์นี้ใช้สำหรับคัดกรอง ไม่ใช่คำวินิจฉัยทางการแพทย์'}
        </p>
      </section>

      <div className="mb-5 flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.16em] text-zinc-500">
        <ShieldAlert size={14} className="text-amber-400" /> Safety guidance
      </div>

      <div className="space-y-3 flex-1">
        {result.reference ? <>
          <div className="flex justify-between items-center rounded-lg border border-zinc-800/70 bg-zinc-900/35 px-3 py-3"><span className="text-sm text-zinc-500">Toxicity profile</span><span className={`text-sm font-medium ${getDangerColor(result.reference.danger_level)}`}>{result.reference.danger_label}</span></div>
          <div className="flex justify-between items-center rounded-lg border border-zinc-800/70 bg-zinc-900/35 px-3 py-3"><span className="text-sm text-zinc-500">Venom type</span><span className="text-sm text-zinc-300 capitalize">{result.reference.venom_type}</span></div>
          <div className="rounded-lg border border-zinc-800/70 bg-zinc-900/35 px-3 py-3"><span className="block text-sm text-zinc-500 mb-1">Antivenom protocol</span><span className="text-sm text-zinc-300" title={result.reference.antivenom}>{result.reference.antivenom}</span></div>
        </> : <div className="rounded-xl border border-amber-500/30 bg-amber-500/[0.07] p-4 text-sm leading-6 text-amber-100"><div className="mb-2 flex items-center gap-2 font-medium text-amber-300"><AlertTriangle size={16} /> Reference not available</div>พบชนิดจากโมเดลแล้ว แต่ยังไม่มีข้อมูลคำเตือนที่ผ่านการอ้างอิงในระบบ โปรดหลีกเลี่ยงการสัมผัสและติดต่อหน่วยแพทย์หากถูกกัด</div>}
      </div>
    </div>
  )
}
