'use client'
import { useState, useEffect } from 'react'
import { MOCK_STATS } from '@/lib/data'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { Database, Download, Image as ImageIcon, BrainCircuit } from 'lucide-react'
import DatasetExportModal from '@/components/export/DatasetExportModal'
import ModelExportModal from '@/components/export/ModelExportModal'

export default function DatabasePage() {
  const [showDatasetModal, setShowDatasetModal] = useState(false)
  const [showModelModal, setShowModelModal] = useState(false)

  useEffect(() => {
    const anyOpen = showDatasetModal || showModelModal
    document.body.style.overflow = anyOpen ? 'hidden' : 'unset'
    return () => { document.body.style.overflow = 'unset' }
  }, [showDatasetModal, showModelModal])

  return (
    <main className="min-h-screen pt-28 px-6 pb-20 relative overflow-hidden bg-black">
      
      {/* Dataset Export Modal */}
      {showDatasetModal && <DatasetExportModal onClose={() => setShowDatasetModal(false)} />}

      {/* Model Export Modal */}
      {showModelModal && <ModelExportModal onClose={() => setShowModelModal(false)} />}

      <div className="max-w-4xl mx-auto relative z-10">
        <header className="mb-12 border-b border-zinc-900 pb-8">
          <h1 className="text-3xl font-medium text-zinc-100 mb-2 flex items-center gap-3">
            <Database className="text-emerald-500" /> Database &amp; Exports
          </h1>
          <p className="text-zinc-500 font-light">Export cleaned datasets and download trained AI models for external use.</p>
        </header>

        <div className="grid md:grid-cols-2 gap-6 relative z-20">
          {/* Dataset Card */}
          <div className="border border-zinc-800/80 rounded-xl bg-zinc-950/80 backdrop-blur-xl shadow-2xl p-8 flex flex-col items-center text-center transition-all hover:bg-zinc-900/90">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 mb-6">
              <ImageIcon size={32} />
            </div>
            <h2 className="text-xl font-medium text-zinc-100 mb-2">Clean Dataset</h2>
            <p className="text-sm text-zinc-400 mb-6 flex-1">
              Export {MOCK_STATS.validated_images.toLocaleString()} verified images with corresponding bounding box annotations. เลือกชนิด, สถานะ, และ format ได้ก่อน export
            </p>
            <div className="flex gap-2 w-full justify-center mb-6">
              <Badge variant="success">YOLO / COCO / VOC</Badge>
              <Badge variant="muted">Filter by Species</Badge>
            </div>
            <Button onClick={() => setShowDatasetModal(true)} className="w-full flex items-center justify-center gap-2 py-3">
              <Download size={18} /> Export Dataset
            </Button>
          </div>

          {/* Model Card */}
          <div className="border border-zinc-800/80 rounded-xl bg-zinc-950/80 backdrop-blur-xl shadow-2xl p-8 flex flex-col items-center text-center transition-all hover:bg-zinc-900/90">
            <div className="w-16 h-16 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-400 mb-6">
              <BrainCircuit size={32} />
            </div>
            <h2 className="text-xl font-medium text-zinc-100 mb-2">Trained Model</h2>
            <p className="text-sm text-zinc-400 mb-6 flex-1">
              Download trained model weights พร้อมเลือกเวอร์ชันและ format ที่ต้องการ รองรับ PyTorch, ONNX, TFLite
            </p>
            <div className="flex gap-2 w-full justify-center mb-6">
              <Badge variant="info">PyTorch / ONNX</Badge>
              <Badge variant="warning">Version Select</Badge>
            </div>
            <Button
              onClick={() => setShowModelModal(true)}
              variant="secondary"
              className="w-full flex items-center justify-center gap-2 py-3 border-zinc-700 hover:border-purple-500/50 hover:bg-purple-500/10"
            >
              <Download size={18} /> Download Model
            </Button>
          </div>
        </div>
      </div>
    </main>
  )
}
