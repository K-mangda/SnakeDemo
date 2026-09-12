export interface Detection {
  class_name: string
  scientific: string
  confidence: number
  bbox: { x: number; y: number; width: number; height: number }
}

export interface SpeciesReference {
  scientific_name: string
  accepted_scientific_name: string | null
  name_th: string | null
  name_en: string | null
  family: string | null
  venom_type: string | null
  danger_level: string | null
  taxonomy_source: string | null
  medical_source: string | null
  reference_note: string | null
}

export interface InferenceResponse {
  detections: Detection[]
  top_detection: Detection | null
  recorded?: boolean
  reference?: SpeciesReference | null
}

export interface PredictionView {
  detection: Detection
  reference?: SpeciesReference | null
}
