'use client'
import { useState, useRef } from 'react'
import { Database, Loader2, Image as ImageIcon } from 'lucide-react'
import { Detection, InferenceResponse, PredictionView } from '@/lib/prediction'
import Button from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'
import ImageUploader from '@/components/predict/ImageUploader'
import PredictionResult from '@/components/predict/PredictionResult'

export default function PredictPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<PredictionView | null>(null)
  const [detections, setDetections] = useState<Detection[]>([])
  const [noDetection, setNoDetection] = useState(false)
  const [noDetectionSaved, setNoDetectionSaved] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { showToast } = useToast()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setPreviewUrl(URL.createObjectURL(file))
      setResult(null)
      setDetections([])
      setNoDetection(false)
      setNoDetectionSaved(false)
    }
  }

  const handlePredict = async (saveNoDetection = false) => {
    const file = fileInputRef.current?.files?.[0]
    if (!file) return
    setLoading(true)
    if (!saveNoDetection) {
      setResult(null)
      setDetections([])
      setNoDetection(false)
      setNoDetectionSaved(false)
    }
    try {
      const form = new FormData()
      form.append('image', file)
      const response = await fetch(saveNoDetection ? '/api/predict?save_no_detection=1' : '/api/predict', { method: 'POST', body: form })
      const payload = await response.json() as InferenceResponse & { detail?: string }
      if (!response.ok) throw new Error(payload.detail ?? 'AI analysis could not be completed.')
      if (!payload.top_detection) {
        setDetections(payload.detections)
        setNoDetection(true)
        setNoDetectionSaved(payload.recorded === true)
        setLoading(false)
        showToast(payload.recorded ? 'No-detection image saved for expert review.' : 'No snake detected. The image was not saved.')
        return
      }
      setDetections(payload.detections)
      setResult({ detection: payload.top_detection, reference: payload.reference })
      setLoading(false)
      const requiresReview = payload.top_detection.confidence < 0.5
      showToast(requiresReview ? 'Low-confidence detection saved for expert review.' : payload.recorded ? 'Subject analysis complete. Saved for expert review.' : 'Subject analysis complete. Match found.')
    } catch (error) {
      setLoading(false)
      // Render's free service can take a short time to wake after inactivity.
      // Keep a network-level failure understandable rather than exposing the
      // browser's technical "Failed to fetch" message.
      const message = error instanceof TypeError && error.message === 'Failed to fetch'
        ? 'AI service is starting. Please try again in about a minute.'
        : error instanceof Error
          ? error.message
          : 'AI analysis could not be completed.'
      showToast(message, 'error')
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
              detections={result ? [result.detection] : detections}
              fileInputRef={fileInputRef}
              handleFileChange={handleFileChange}
            />

            <p className="flex items-center gap-2 px-1 text-[11px] leading-4 text-zinc-500"><Database size={13} className="shrink-0 text-emerald-400" />Images with an AI detection may be saved for expert review and model improvement.</p>

            {previewUrl && (
              <Button onClick={result || noDetectionSaved ? () => fileInputRef.current?.click() : noDetection ? () => handlePredict(true) : () => handlePredict()} disabled={loading} className="w-full flex justify-center items-center gap-2 py-3">
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Processing...
                  </>
                ) : result || noDetectionSaved ? (
                  <>
                    <ImageIcon size={18} />
                    Analyze another image
                  </>
                ) : noDetection ? (
                  <>Send for expert review</>
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
            <PredictionResult result={result} noDetection={noDetection} noDetectionSaved={noDetectionSaved} />
          </div>
        </div>
      </div>
    </main>
  )
}
