'use client'
import { useState, useRef } from 'react'
import { Loader2, Image as ImageIcon } from 'lucide-react'
import { SNAKE_DATA } from '@/lib/data'
import { Snake } from '@/lib/types'
import { Detection, InferenceResponse, PredictionView } from '@/lib/prediction'
import Button from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'
import ImageUploader from '@/components/predict/ImageUploader'
import PredictionResult from '@/components/predict/PredictionResult'

export default function PredictPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<PredictionView | null>(null)
  const [detections, setDetections] = useState<Detection[]>([])
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { showToast } = useToast()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setPreviewUrl(URL.createObjectURL(file))
      setResult(null)
      setDetections([])
    }
  }

  const handlePredict = async () => {
    const file = fileInputRef.current?.files?.[0]
    if (!file) return
    setLoading(true)
    setResult(null)
    setDetections([])
    try {
      const form = new FormData()
      form.append('image', file)
      const response = await fetch('/api/predict', { method: 'POST', body: form })
      const payload = await response.json() as InferenceResponse & { detail?: string }
      if (!response.ok) throw new Error(payload.detail ?? 'AI analysis could not be completed.')
      if (!payload.top_detection) throw new Error('No snake was detected in this image.')
      const reference = SNAKE_DATA.find((snake) => snake.scientific === payload.top_detection?.scientific)
      setDetections(payload.detections)
      setResult({ detection: payload.top_detection, reference })
      setLoading(false)
      const requiresReview = payload.top_detection.confidence < 0.5
      showToast(requiresReview ? 'Low-confidence detection saved for expert review.' : payload.recorded ? 'Subject analysis complete. Saved for expert review.' : 'Subject analysis complete. Match found.')
    } catch (error) {
      setLoading(false)
      showToast(error instanceof Error ? error.message : 'AI analysis could not be completed.', 'error')
    }
  }

  return (
    <main className="min-h-screen pt-24 sm:pt-28 px-4 sm:px-6 pb-20 relative overflow-hidden">
      <div className="max-w-4xl mx-auto relative z-10">
        <header className="mb-12 border-b border-zinc-900 pb-8">
          <h1 className="text-3xl font-medium text-zinc-100 mb-2">Subject Analysis</h1>
          <p className="text-zinc-500 font-light">Upload an image for automated taxonomic classification.</p>
        </header>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Upload Area */}
          <div className="flex flex-col gap-4">
            <ImageUploader 
              previewUrl={previewUrl}
              loading={loading}
              detections={detections}
              fileInputRef={fileInputRef}
              handleFileChange={handleFileChange}
            />

            {previewUrl && (
              <Button onClick={result ? () => fileInputRef.current?.click() : handlePredict} disabled={loading} className="w-full flex justify-center items-center gap-2 py-3">
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Processing...
                  </>
                ) : result ? (
                  <>
                    <ImageIcon size={18} />
                    Analyze another image
                  </>
                ) : (
                  <>
                    <ImageIcon size={18} />
                    Run AI Analysis
                  </>
                )}
              </Button>
            )}
          </div>

          {/* Results Area */}
          <div className="flex flex-col h-full">
            <PredictionResult result={result} />
          </div>
        </div>
      </div>
    </main>
  )
}
