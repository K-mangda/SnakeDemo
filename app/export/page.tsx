'use client'

import { useEffect, useState } from 'react'
import { Archive, Download, FileJson, FileSpreadsheet, LoaderCircle, PackageCheck } from 'lucide-react'
import Button from '@/components/ui/Button'
import { supabase } from '@/lib/supabase/client'

type ExportFormat = 'yolo' | 'coco' | 'csv'
type Summary = { verified: number; ready: number; classes: number; skipped: number }

const formats: Array<{ value: ExportFormat; label: string; detail: string; icon: typeof Archive }> = [
  { value: 'yolo', label: 'YOLO', detail: 'images/, labels/, data.yaml', icon: Archive },
  { value: 'coco', label: 'COCO', detail: 'images/, annotations.json', icon: FileJson },
  { value: 'csv', label: 'CSV', detail: 'images/, dataset.csv', icon: FileSpreadsheet },
]

export default function ExportPage() {
  const [format, setFormat] = useState<ExportFormat>('yolo')
  const [summary, setSummary] = useState<Summary | null>(null)
  const [message, setMessage] = useState('')
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    let active = true
    async function loadSummary() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      const response = await fetch('/api/export/dataset', { headers: { Authorization: `Bearer ${session.access_token}` } })
      const data = await response.json()
      if (!active) return
      if (response.ok) setSummary(data)
      else setMessage(data.detail ?? 'Could not load export data.')
    }
    loadSummary()
    return () => { active = false }
  }, [])

  async function exportDataset() {
    setExporting(true)
    setMessage('')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Your session has expired.')
      const response = await fetch('/api/export/dataset', { method: 'POST', headers: { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ format }) })
      if (!response.ok) {
        const data = await response.json().catch(() => null)
        throw new Error(data?.detail ?? 'Could not create the export.')
      }
      const blob = await response.blob()
      const filename = response.headers.get('content-disposition')?.match(/filename="?([^";]+)"?/)?.[1] ?? `snake-verified-${format}.zip`
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      link.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not create the export.')
    } finally {
      setExporting(false)
    }
  }

  return (
    <main className="min-h-screen bg-zinc-950 px-6 pb-20 pt-32 text-zinc-100">
      <section className="mx-auto max-w-2xl">
        <header className="mb-10">
          <p className="mb-2 text-sm font-medium text-emerald-400">Verified dataset</p>
          <h1 className="text-3xl font-semibold tracking-tight">Export dataset</h1>
          <p className="mt-3 text-sm leading-6 text-zinc-400">Exports only verified scans with a final species and final bounding box. Predicted boxes are never included.</p>
        </header>

        <div className="mb-6 grid grid-cols-3 gap-3">
          {[
            ['พร้อม export', summary?.ready],
            ['คลาส', summary?.classes],
            ['ข้าม', summary?.skipped],
          ].map(([label, value]) => <div key={String(label)} className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4"><p className="text-xs text-zinc-500">{label}</p><p className="mt-1 text-2xl font-semibold text-emerald-400">{value ?? '—'}</p></div>)}
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
          <p className="mb-3 text-sm font-medium">เลือกรูปแบบ</p>
          <div className="space-y-2">
            {formats.map(item => {
              const Icon = item.icon
              return <button key={item.value} onClick={() => setFormat(item.value)} className={`flex w-full items-center gap-3 rounded-xl border p-4 text-left transition ${format === item.value ? 'border-emerald-500/60 bg-emerald-500/10' : 'border-zinc-800 bg-zinc-950/40 hover:border-zinc-700'}`}>
                <Icon size={19} className={format === item.value ? 'text-emerald-400' : 'text-zinc-500'} />
                <span className="font-medium">{item.label}</span><span className="ml-auto text-xs text-zinc-500">{item.detail}</span>
              </button>
            })}
          </div>
          <div className="mt-6 border-t border-zinc-800 pt-5">
            {message && <p className="mb-3 text-sm text-rose-400">{message}</p>}
            <Button onClick={exportDataset} disabled={exporting || !summary?.ready} className="w-full justify-center py-3">
              {exporting ? <><LoaderCircle className="animate-spin" size={18} /> Creating ZIP…</> : <><Download size={18} /> Export {format.toUpperCase()} ZIP</>}
            </Button>
            <p className="mt-3 flex items-center gap-2 text-xs text-zinc-500"><PackageCheck size={14} /> ZIP includes a manifest with class counts and skipped records.</p>
          </div>
        </div>
      </section>
    </main>
  )
}
