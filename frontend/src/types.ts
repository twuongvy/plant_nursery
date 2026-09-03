export type Role = 'Admin' | 'User'

export type HealthStatus = 'Healthy' | 'Sick' | 'Quarantine'
export type BatchStatus = 'Growing' | 'ForSale' | 'SoldOut'

export const HEALTH_STATUSES: HealthStatus[] = ['Healthy', 'Sick', 'Quarantine']
export const BATCH_STATUSES: BatchStatus[] = ['Growing', 'ForSale', 'SoldOut']

export function isHealthStatus(value: string): value is HealthStatus {
  return HEALTH_STATUSES.some((status) => status === value)
}

export function isBatchStatus(value: string): value is BatchStatus {
  return BATCH_STATUSES.some((status) => status === value)
}

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  token: string
  email: string
  username: string
  role: Role
  expiresAtUtc: string
}

export interface MeResponse {
  id: number
  email: string
  username: string
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
  isWateringOverdue?: boolean
  lastWateredAt?: string | null
  nextWateringDueAt?: string
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
  plantedAt?: string
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
  failedRules?: string[]
  errors?: Record<string, string[]>
}
