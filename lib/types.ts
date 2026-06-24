export interface Snake {
  id: number
  name_th: string
  name_en: string
  scientific: string
  family: string
  venom_type: 'neurotoxic' | 'hemotoxic' | 'non-venomous'
  danger_level: number
  danger_label: string
  color: string
  length_cm: string
  habitat: string
  distribution: string
  description: string
  symptoms: string[]
  first_aid: string[]
  antivenom: string
  predictions: number
  confidence_avg: number
  tags: string[]
}

export interface MockImage {
  id: number
  filename: string
  upload_date: string
  ai_prediction: Snake
  ai_confidence: string
  status: 'pending' | 'verified' | 'unclear' | 'waiting_for_new_class'
  expert_votes: number
  required_votes: number
  bounding_box: { x: number; y: number; w: number; h: number }
}

export interface Expert {
  id: number
  name: string
  email: string
  specialty: string
  validated: number
  accuracy: number
  status: 'active' | 'inactive'
  joined: string
}

export interface Stats {
  total_images: number
  validated_images: number
  pending_images: number
  unclear_images: number
  waiting_for_new_class_images: number
  model_accuracy: number
  total_predictions: number
  active_experts: number
  total_experts: number
  species_distribution: number[]
  daily_uploads: number[]
  weekly_accuracy: number[]
  auto_train: {
    enabled: boolean
    min_validated: number
    current_progress: number
    last_trained: string
    model_version: string
  }
}

export interface Session {
  email: string
  role: 'admin' | 'expert'
  name: string
}
