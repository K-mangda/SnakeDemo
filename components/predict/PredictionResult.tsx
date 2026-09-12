import { PredictionView } from '@/lib/prediction'
import Badge from '@/components/ui/Badge'
import { ScanLine, SearchX } from 'lucide-react'

interface PredictionResultProps {
  result: PredictionView | null;
  noDetection?: boolean;
  noDetectionSaved?: boolean;
}

export default function PredictionResult({ result, noDetection = false, noDetectionSaved = false }: PredictionResultProps) {
  if (!result && noDetection) {
    return <div className="flex-1 rounded-xl border border-zinc-800 bg-zinc-900/40 p-6"><Badge variant={noDetectionSaved ? 'info' : 'muted'}>{noDetectionSaved ? 'Sent for expert review' : 'No AI detection'}</Badge><div className="mt-7 flex items-start gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-900 text-zinc-400"><SearchX size={20} /></div><div><p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">Detection outcome</p><h2 className="mt-1 text-xl font-medium text-zinc-100">No snake detected</h2></div></div><p className="mt-6 rounded-lg border border-zinc-700 bg-zinc-900/60 p-3 text-sm leading-5 text-zinc-300">{noDetectionSaved ? 'This image has been saved as a no-detection case for expert review.' : 'This image was not saved. If you believe it contains a snake, send it for expert review so the model can be checked.'}</p></div>
  }
  if (!result) {
    return (
      <div className="flex-1 border border-zinc-800/50 rounded-xl bg-zinc-900/10 flex items-center justify-center text-zinc-600 text-sm p-6 text-center">
        Analysis results will appear here after processing.
      </div>
    )
  }

  const requiresReview = result.detection.confidence < 0.5

  return (
    <div className="flex-1 border border-zinc-800 rounded-xl bg-zinc-900/40 p-6 flex flex-col">
      <div className="flex items-center justify-between gap-3 mb-7">
        <Badge variant={requiresReview ? 'warning' : 'success'} className="animate-fade-up">{requiresReview ? 'Review required' : 'Classification complete'}</Badge>
        <span className={`text-xs font-mono ${requiresReview ? 'text-amber-400' : 'text-emerald-500'}`}>CONFIDENCE: {(result.detection.confidence * 100).toFixed(1)}%</span>
      </div>

      <div className="mb-8 flex items-start gap-3">
        <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-emerald-500/25 bg-emerald-500/10 text-emerald-400">
          <ScanLine size={20} />
        </div>
        <div>
          <p className="text-[11px] text-zinc-500 uppercase tracking-[0.18em] mb-1">{requiresReview ? 'Possible match' : 'Detected species'}</p>
          <h2 className="text-2xl font-medium text-zinc-100 leading-tight">{result.reference?.name_en ?? result.detection.scientific}</h2>
          <p className="text-sm text-zinc-400 mt-1 italic">{result.reference?.accepted_scientific_name ?? result.detection.scientific}</p>
          {result.reference && <p className="mt-1 text-sm text-zinc-500">ชื่อไทย: {result.reference.name_th ?? 'รอผู้เชี่ยวชาญยืนยัน'}</p>}
        </div>
      </div>

      <div className={`mb-5 rounded-lg border p-3 text-sm leading-5 ${requiresReview ? 'border-amber-500/40 bg-amber-500/10 text-amber-100' : 'border-zinc-700 bg-zinc-900/60 text-zinc-300'}`}>
        {requiresReview
          ? 'AI ยังไม่สามารถระบุชนิดได้อย่างน่าเชื่อถือ จึงไม่แสดงข้อมูลพิษหรือคำแนะนำเฉพาะชนิด โปรดหลีกเลี่ยงการสัมผัสและให้ผู้เชี่ยวชาญตรวจสอบเพิ่มเติม'
          : 'ผลลัพธ์นี้เป็นการคัดกรองด้วย AI ไม่ใช่คำวินิจฉัยทางการแพทย์'}
      </div>

      <div className="space-y-4 flex-1">
        {requiresReview ? <p className="rounded-lg border border-zinc-800 bg-zinc-900/30 p-3 text-sm text-zinc-400">The detected region is retained for expert review. No species-specific reference is shown for low-confidence results.</p> : result.reference ? <>
          <div className="flex justify-between items-center py-3 border-b border-zinc-800/50"><span className="text-sm text-zinc-500">Taxonomic reference</span><span className="text-sm text-zinc-300 text-right max-w-[200px] truncate" title={result.reference.accepted_scientific_name ?? result.reference.scientific_name}>{result.reference.accepted_scientific_name ?? result.reference.scientific_name}</span></div>
          {result.reference.family && <div className="flex justify-between items-center py-3 border-b border-zinc-800/50"><span className="text-sm text-zinc-500">Family</span><span className="text-sm text-zinc-300">{result.reference.family}</span></div>}
          {result.reference.medical_source && <div className="flex justify-between items-center py-3 border-b border-zinc-800/50"><span className="text-sm text-zinc-500">Medical reference</span><span className="text-sm text-emerald-300">QSMI</span></div>}
          {result.reference.reference_note && <p className="rounded-lg border border-zinc-800 bg-zinc-900/30 p-3 text-xs leading-5 text-zinc-400">{result.reference.reference_note}</p>}
        </> : <p className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-sm text-amber-200">พบชนิดจากโมเดลแล้ว แต่ยังไม่มีข้อมูลคำเตือนที่ผ่านการอ้างอิงในระบบ โปรดหลีกเลี่ยงการสัมผัสและติดต่อหน่วยแพทย์หากถูกกัด</p>}
      </div>
    </div>
  )
}
