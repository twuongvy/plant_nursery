export type Role = 'Admin' | 'User'

export type HealthStatus = 'Healthy' | 'Sick' | 'Quarantine'
export type BatchStatus = 'Growing' | 'ForSale' | 'SoldOut'

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  token: string
  email: string
  role: Role
}

export interface PlantSpecies {
  id: number
  name: string
  scientificName?: string | null
  wateringIntervalDays: number
  minDaysBeforeSale: number
}

export interface SpeciesInput {
  name: string
  scientificName?: string | null
  wateringIntervalDays: number
  minDaysBeforeSale: number
}

export interface Batch {
  id: number
  plantSpeciesId: number
  speciesName?: string
  quantity: number
  plantedAt: string
  healthStatus: HealthStatus
  location?: string | null
  status: BatchStatus
  isSaleReady: boolean
  readinessNotes?: string[]
}

export interface BatchInput {
  plantSpeciesId: number
  quantity: number
  plantedAt: string
  healthStatus: HealthStatus
  location?: string | null
  status?: BatchStatus
}

export interface WateringDueItem {
  batchId: number
  speciesName?: string
  location?: string | null
  quantity?: number
  lastWateredAt?: string | null
  dueAt?: string | null
  isOverdue: boolean
  daysOverdue?: number
}

export interface RecordWateringInput {
  batchId: number
  note?: string | null
}

export interface DashboardSummary {
  overdueWaterings: number
  saleReadyBatches: number
  growingBatches: number
}

export interface ApiErrorBody {
  message?: string
  title?: string
  detail?: string
  errors?: Record<string, string[]>
}
