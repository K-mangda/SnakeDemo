import { PredictionView } from '@/lib/prediction'
import Badge from '@/components/ui/Badge'
import { getDangerColor } from '@/lib/utils'
import { ScanLine } from 'lucide-react'

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
    <div className="flex-1 border border-zinc-800 rounded-xl bg-zinc-900/40 p-6 flex flex-col">
      <div className="flex items-center justify-between gap-3 mb-7">
        <Badge variant="success" className="animate-fade-up">Classification Complete</Badge>
        <span className="text-xs font-mono text-emerald-500">CONFIDENCE: {(result.detection.confidence * 100).toFixed(1)}%</span>
      </div>

      <div className="mb-8 flex items-start gap-3">
        <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-emerald-500/25 bg-emerald-500/10 text-emerald-400">
          <ScanLine size={20} />
        </div>
        <div>
          <p className="text-[11px] text-zinc-500 uppercase tracking-[0.18em] mb-1">Detected species</p>
          <h2 className="text-2xl font-medium text-zinc-100 leading-tight">{result.reference?.name_en ?? result.detection.scientific}</h2>
          <p className="text-sm text-zinc-400 mt-1 italic">{result.detection.scientific}</p>
          {result.reference && <p className="text-zinc-500 text-sm mt-1">{result.reference.name_th}</p>}
        </div>
      </div>

      <div className={`mb-5 rounded-lg border p-3 text-sm leading-5 ${isLowConfidence ? 'border-amber-500/40 bg-amber-500/10 text-amber-100' : 'border-zinc-700 bg-zinc-900/60 text-zinc-300'}`}>
        {isLowConfidence
          ? 'ความมั่นใจของผลลัพธ์ต่ำ จึงไม่ควรใช้ยืนยันชนิดงู โปรดหลีกเลี่ยงการสัมผัสและให้ผู้เชี่ยวชาญตรวจสอบเพิ่มเติม'
          : 'ผลลัพธ์นี้เป็นการคัดกรองด้วย AI ไม่ใช่คำวินิจฉัยทางการแพทย์'}
      </div>

      <div className="space-y-4 flex-1">
        {result.reference ? <>
          <div className="flex justify-between items-center py-3 border-b border-zinc-800/50"><span className="text-sm text-zinc-500">Toxicity Profile</span><span className={`text-sm font-medium ${getDangerColor(result.reference.danger_level)}`}>{result.reference.danger_label}</span></div>
          <div className="flex justify-between items-center py-3 border-b border-zinc-800/50"><span className="text-sm text-zinc-500">Venom Type</span><span className="text-sm text-zinc-300 capitalize">{result.reference.venom_type}</span></div>
          <div className="flex justify-between items-center py-3 border-b border-zinc-800/50"><span className="text-sm text-zinc-500">Antivenom Protocol</span><span className="text-sm text-zinc-300 text-right max-w-[200px] truncate" title={result.reference.antivenom}>{result.reference.antivenom}</span></div>
        </> : <p className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-sm text-amber-200">พบชนิดจากโมเดลแล้ว แต่ยังไม่มีข้อมูลคำเตือนที่ผ่านการอ้างอิงในระบบ โปรดหลีกเลี่ยงการสัมผัสและติดต่อหน่วยแพทย์หากถูกกัด</p>}
      </div>
    </div>
  )
}
