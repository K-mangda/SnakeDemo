import { useState } from 'react'
import { Archive, Check, Download, FileJson, FileSpreadsheet, Image as ImageIcon, ShieldCheck, X } from 'lucide-react'
import { useToast } from '@/components/ui/Toast'
import Button from '@/components/ui/Button'

type DatasetFormat = 'YOLO' | 'COCO' | 'CSV'

interface DatasetExportModalProps {
  onClose: () => void
}

const formatOptions: Array<{
  value: DatasetFormat
  icon: typeof Archive
  title: string
  description: string
  contents: string
}> = [
  {
    value: 'YOLO',
    icon: Archive,
    title: 'YOLO',
    description: 'For Ultralytics and YOLO training workflows.',
    contents: 'images/ · labels/ · data.yaml',
  },
  {
    value: 'COCO',
    icon: FileJson,
    title: 'COCO',
    description: 'For computer-vision tooling that uses COCO annotations.',
    contents: 'images/ · annotations.json',
  },
  {
    value: 'CSV',
    icon: FileSpreadsheet,
    title: 'CSV',
    description: 'A compact record of filenames, species, and normalized boxes.',
    contents: 'dataset.csv',
  },
]

export default function DatasetExportModal({ onClose }: DatasetExportModalProps) {
  const [format, setFormat] = useState<DatasetFormat>('YOLO')
  const [downloading, setDownloading] = useState(false)
  const { showToast } = useToast()
  const selectedFormat = formatOptions.find(option => option.value === format) ?? formatOptions[0]

  function handleDownload() {
    setDownloading(true)
    setTimeout(() => {
      setDownloading(false)
      showToast(`Dataset export is being prepared as ${format}.`)
      onClose()
    }, 900)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/75 p-4 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-xl overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl shadow-black/50 animate-in zoom-in-95 duration-200">
        <header className="flex items-start justify-between gap-6 border-b border-zinc-800 px-6 py-5">
          <div className="flex items-start gap-3">
            <div className="grid size-10 shrink-0 place-items-center rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
              <ImageIcon size={19} />
            </div>
            <div>
              <h2 className="text-base font-semibold tracking-tight text-zinc-100">Export verified dataset</h2>
              <p className="mt-1 text-sm leading-5 text-zinc-500">Choose a format for the reviewed training data.</p>
            </div>
          </div>
          <button onClick={onClose} aria-label="Close export dialog" className="grid size-9 shrink-0 place-items-center rounded-lg border border-zinc-800 text-zinc-500 transition hover:border-zinc-700 hover:bg-zinc-900 hover:text-zinc-200">
            <X size={17} />
          </button>
        </header>

        <div className="space-y-6 px-6 py-6">
          <section className="flex gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
            <ShieldCheck size={18} className="mt-0.5 shrink-0 text-emerald-400" />
            <div>
              <p className="text-sm font-medium text-zinc-200">Verified annotations only</p>
              <p className="mt-1 text-sm leading-5 text-zinc-500">Exports include images with a final species and final bounding box. Incomplete records are excluded.</p>
            </div>
          </section>

          <section>
            <div className="mb-3 flex items-baseline justify-between">
              <h3 className="text-sm font-medium text-zinc-200">Export format</h3>
              <span className="text-xs text-zinc-600">One ZIP archive</span>
            </div>
            <div className="space-y-2">
              {formatOptions.map(option => {
                const Icon = option.icon
                const selected = option.value === format
                return (
                  <button
                    key={option.value}
                    onClick={() => setFormat(option.value)}
                    className={`group flex w-full items-center gap-4 rounded-xl border p-4 text-left transition-colors ${selected ? 'border-emerald-500/60 bg-emerald-500/[0.07]' : 'border-zinc-800 bg-zinc-900/30 hover:border-zinc-700 hover:bg-zinc-900/60'}`}
                  >
                    <span className={`grid size-9 shrink-0 place-items-center rounded-lg ${selected ? 'bg-emerald-500/15 text-emerald-400' : 'bg-zinc-900 text-zinc-500 group-hover:text-zinc-300'}`}>
                      <Icon size={17} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className={`block text-sm font-medium ${selected ? 'text-emerald-300' : 'text-zinc-200'}`}>{option.title}</span>
                      <span className="mt-0.5 block text-xs leading-5 text-zinc-500">{option.description}</span>
                    </span>
                    <span className={`grid size-5 shrink-0 place-items-center rounded-full border ${selected ? 'border-emerald-400 bg-emerald-400 text-zinc-950' : 'border-zinc-700 text-transparent'}`}>
                      <Check size={13} strokeWidth={3} />
                    </span>
                  </button>
                )
              })}
            </div>
          </section>

          <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Archive contents</p>
            <p className="mt-1 text-sm text-zinc-300">{selectedFormat.contents}</p>
            <p className="mt-1 text-xs text-zinc-600">manifest.json is included with class counts and excluded records.</p>
          </div>
        </div>

        <footer className="flex items-center justify-between gap-4 border-t border-zinc-800 bg-zinc-900/30 px-6 py-4">
          <p className="hidden text-xs text-zinc-500 sm:block">The archive uses final review data only.</p>
          <Button onClick={handleDownload} disabled={downloading} className="ml-auto min-w-52 justify-center py-2.5">
            {downloading ? <><Archive className="animate-spin" size={17} /> Preparing archive…</> : <><Download size={17} /> Download {format} ZIP</>}
          </Button>
        </footer>
      </div>
    </div>
  )
}
