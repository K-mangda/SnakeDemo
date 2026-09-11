import { Snake } from '@/lib/types'

export interface Detection {
  class_name: string
  scientific: string
  confidence: number
  bbox: { x: number; y: number; width: number; height: number }
}

export interface InferenceResponse {
  detections: Detection[]
  top_detection: Detection | null
  recorded?: boolean
}

export interface PredictionView {
  detection: Detection
  reference?: Snake
}
