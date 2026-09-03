import { apiFetch } from './client'
import type { Batch, BatchInput, HealthStatus } from '../types'

export function listBatches(): Promise<Batch[]> {
  return apiFetch<Batch[]>('/api/batches')
}

export function createBatch(payload: BatchInput): Promise<Batch> {
  return apiFetch<Batch>('/api/batches', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateBatch(id: number, payload: BatchInput): Promise<Batch> {
  return apiFetch<Batch>(`/api/batches/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export function updateBatchHealth(id: number, healthStatus: HealthStatus): Promise<Batch> {
  return apiFetch<Batch>(`/api/batches/${id}/health`, {
    method: 'PATCH',
    body: JSON.stringify({ healthStatus }),
  })
}

export function markBatchForSale(id: number): Promise<Batch> {
  return apiFetch<Batch>(`/api/batches/${id}/mark-for-sale`, {
    method: 'POST',
  })
}
