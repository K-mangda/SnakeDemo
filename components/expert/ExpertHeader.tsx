import { User } from 'lucide-react'
import { toast } from 'sonner'
import { MOCK_EXPERTS } from '@/lib/data'

// Mock: ข้อมูลส่วนตัว expert ที่ login อยู่
const expertData = MOCK_EXPERTS[0]
const MOCK_ME = {
  name:       expertData.name,
  specialty:  expertData.specialty,
  voted:      expertData.validated,
  accuracy:   expertData.accuracy,
  streak:     7,
}

export default function ExpertHeader() {
  return (
    <header className="mb-8 border-b border-zinc-900 pb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-6">
      <div>
        <h1 className="text-3xl font-medium text-zinc-100 mb-2">Expert Workspace</h1>
        <p className="text-zinc-500 font-light">Human-in-the-loop verification pipeline.</p>
      </div>
      {/* Expert identity & Accuracy */}
      <button 
        onClick={() => toast.success('บันทึกข้อมูลสำเร็จ', { description: 'อัปเดตสายพันธุ์ Naja kaouthia เรียบร้อยแล้ว' })}
        className="group flex items-center gap-3 px-3 py-2 rounded-2xl bg-zinc-900/40 hover:bg-zinc-800/60 border border-zinc-800/40 hover:border-zinc-700/50 transition-all text-left"
      >
        <div className="flex flex-col items-end">
          <span className="text-sm font-medium text-zinc-200 group-hover:text-white transition-colors">
            {MOCK_ME.name}
          </span>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[11px] text-zinc-500">{MOCK_ME.specialty}</span>
            <div className="flex items-center gap-1.5 px-1.5 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/80 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
              <span className="text-[10px] font-mono text-emerald-400 font-medium tracking-wide">
                {MOCK_ME.accuracy}%
              </span>
            </div>
          </div>
        </div>
        {/* Avatar with subtle gradient border */}
        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-violet-600/50 to-indigo-500/50 p-[1px] group-hover:from-violet-500 group-hover:to-indigo-400 transition-colors">
          <div className="w-full h-full rounded-full bg-zinc-950 flex items-center justify-center">
            <User size={16} className="text-violet-300 group-hover:text-violet-200 transition-colors" />
          </div>
        </div>
      </button>
    </header>
  )
}
