'use client'

import { useEffect, useState } from 'react'
import { ArrowUpRight, BrainCircuit, CheckCircle2, Database, Download, FileCode2, FileJson, Image as ImageIcon, Package, ShieldCheck } from 'lucide-react'
import { ACTIVE_MODEL, MOCK_STATS } from '@/lib/data'
import Button from '@/components/ui/Button'
import DatasetExportModal from '@/components/export/DatasetExportModal'
import ModelExportModal from '@/components/export/ModelExportModal'

export default function ExportPage() {
  const [showDatasetModal, setShowDatasetModal] = useState(false)
  const [showModelModal, setShowModelModal] = useState(false)

  useEffect(() => {
    const anyModalOpen = showDatasetModal || showModelModal
    document.body.style.overflow = anyModalOpen ? 'hidden' : 'unset'
    return () => { document.body.style.overflow = 'unset' }
  }, [showDatasetModal, showModelModal])

  return (
    <main className="min-h-screen bg-zinc-950 px-6 pb-24 pt-32 text-zinc-100">
      {showDatasetModal && <DatasetExportModal onClose={() => setShowDatasetModal(false)} />}
      {showModelModal && <ModelExportModal onClose={() => setShowModelModal(false)} />}

      <div className="mx-auto max-w-5xl">
        <header className="mb-12 max-w-2xl">
          <p className="text-sm font-medium text-emerald-400">NSTRU Vision resources</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-zinc-100 sm:text-5xl">Models and datasets, ready to use.</h1>
          <p className="mt-4 text-base leading-7 text-zinc-400">Download the latest snake-classification model weights or a verified dataset package for your own work.</p>
        </header>

        <section className="overflow-hidden rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/[0.12] via-zinc-950 to-zinc-950 shadow-2xl shadow-black/30">
          <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[1.25fr_0.75fr] lg:items-end">
            <div>
              <div className="mb-7 flex items-center gap-3">
                <div className="grid size-12 place-items-center rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400"><BrainCircuit size={23} /></div>
                <div>
                  <p className="text-sm font-medium text-emerald-300">Free model download</p>
                  <p className="mt-0.5 text-xs text-zinc-500">Latest production release</p>
                </div>
              </div>
              <h2 className="text-3xl font-semibold tracking-tight text-zinc-100">NSTRU Snake Classifier</h2>
              <p className="mt-2 text-sm text-zinc-400">{ACTIVE_MODEL.version} · released {ACTIVE_MODEL.date}</p>
              <p className="mt-5 max-w-xl text-sm leading-6 text-zinc-400">Trained model weights for identifying Thai snake species. Choose a release format that fits your inference environment.</p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Button onClick={() => setShowModelModal(true)} size="lg" className="min-w-48 justify-center bg-emerald-600 hover:bg-emerald-500"><Download size={18} /> Download model</Button>
                <span className="inline-flex items-center gap-2 px-3 py-3 text-sm text-zinc-400"><CheckCircle2 size={16} className="text-emerald-400" /> No account required</span>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              <Metric label="Validation accuracy" value={`${ACTIVE_MODEL.accuracy}%`} />
              <Metric label="Snake species" value={String(ACTIVE_MODEL.classes)} />
              <Metric label="Training images" value={ACTIVE_MODEL.trainImages.toLocaleString()} />
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/35 p-6 sm:p-7">
            <div className="flex items-start justify-between gap-5">
              <div className="grid size-11 place-items-center rounded-xl bg-zinc-800 text-zinc-300"><Package size={20} /></div>
              <span className="rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300">Model files</span>
            </div>
            <h2 className="mt-7 text-xl font-semibold tracking-tight">Choose your runtime</h2>
            <p className="mt-2 text-sm leading-6 text-zinc-500">All releases include the model weight file, class labels, and release metadata.</p>
            <div className="mt-6 grid gap-2 sm:grid-cols-3">
              <FormatTile icon={FileCode2} title="PyTorch" detail=".pt" />
              <FormatTile icon={FileJson} title="ONNX" detail=".onnx" />
              <FormatTile icon={Package} title="TFLite" detail=".tflite" />
            </div>
            <button onClick={() => setShowModelModal(true)} className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-emerald-400 transition hover:text-emerald-300">Browse releases <ArrowUpRight size={16} /></button>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/20 p-6 sm:p-7">
            <div className="flex items-start justify-between gap-5">
              <div className="grid size-11 place-items-center rounded-xl bg-zinc-800 text-zinc-300"><ImageIcon size={20} /></div>
              <span className="rounded-full border border-zinc-700 bg-zinc-800/60 px-3 py-1 text-xs font-medium text-zinc-400">Verified data</span>
            </div>
            <h2 className="mt-7 text-xl font-semibold tracking-tight">Training dataset</h2>
            <p className="mt-2 text-sm leading-6 text-zinc-500">Reviewed images with final species labels and bounding boxes for training and research.</p>
            <div className="mt-6 border-y border-zinc-800 py-4">
              <p className="text-2xl font-semibold tracking-tight text-zinc-100">{MOCK_STATS.validated_images.toLocaleString()}</p>
              <p className="mt-1 text-xs text-zinc-500">verified images across {ACTIVE_MODEL.classes} snake species</p>
            </div>
            <Button onClick={() => setShowDatasetModal(true)} variant="outline" className="mt-6 w-full justify-center"><Database size={16} /> Export dataset</Button>
          </div>
        </section>

        <section className="mt-8 flex gap-3 rounded-xl border border-zinc-800 bg-zinc-900/20 px-5 py-4 text-sm text-zinc-500">
          <ShieldCheck size={18} className="mt-0.5 shrink-0 text-emerald-400" />
          <p>Dataset packages include verified annotations only. Model and dataset downloads are available to all users.</p>
        </section>
      </div>
    </main>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 px-5 py-4"><p className="text-xs text-zinc-500">{label}</p><p className="mt-1 text-xl font-semibold tracking-tight text-zinc-100">{value}</p></div>
}

function FormatTile({ icon: Icon, title, detail }: { icon: typeof Package; title: string; detail: string }) {
  return <div className="rounded-lg border border-zinc-800 bg-zinc-950/40 p-3"><Icon size={16} className="text-zinc-400" /><p className="mt-3 text-sm font-medium text-zinc-200">{title}</p><p className="mt-0.5 text-xs text-zinc-500">{detail}</p></div>
}
