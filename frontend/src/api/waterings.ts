import { apiFetch } from './client'
import type { RecordWateringInput, WateringDueItem } from '../types'

export function listDueWaterings(): Promise<WateringDueItem[]> {
  return apiFetch<WateringDueItem[]>('/api/waterings/due')
}

export function recordWatering(payload: RecordWateringInput): Promise<void> {
  return apiFetch<void>('/api/waterings', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}
