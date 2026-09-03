import { useCallback, useEffect, useState } from 'react'
import {
  createBatch,
  listBatches,
  markBatchForSale as markBatchForSaleRequest,
  updateBatch,
  updateBatchHealth,
} from '../api/batches'
import type { Batch, BatchInput, HealthStatus } from '../types'
import { runApi } from './api'

export function useBatches() {
  const [batches, setBatches] = useState<Batch[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [markingForSaleId, setMarkingForSaleId] = useState<number | null>(null)
  const [updatingHealthId, setUpdatingHealthId] = useState<number | null>(null)

  const reload = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    const result = await runApi(listBatches, 'Failed to load batches.')
    if (!result.ok) {
      setError(result.error)
    } else {
      setBatches(result.data)
    }
    setIsLoading(false)
  }, [])

  useEffect(() => {
    void reload()
  }, [reload])

  async function saveBatch(
    payload: BatchInput,
    batchId?: number,
  ): Promise<boolean> {
    setIsSaving(true)
    setError(null)
    const result = await runApi(
      () =>
        batchId != null ? updateBatch(batchId, payload) : createBatch(payload),
      'Save failed.',
    )
    if (!result.ok) {
      setError(result.error)
      setIsSaving(false)
      return false
    }
    await reload()
    setIsSaving(false)
    return true
  }

  async function markForSale(batchId: number): Promise<boolean> {
    setError(null)
    setMarkingForSaleId(batchId)
    const result = await runApi(
      () => markBatchForSaleRequest(batchId),
      'Could not mark for sale (must be sale-ready).',
    )
    if (!result.ok) {
      setError(result.error)
      setMarkingForSaleId(null)
      return false
    }
    await reload()
    setMarkingForSaleId(null)
    return true
  }

  async function updateHealth(
    batchId: number,
    healthStatus: HealthStatus,
  ): Promise<boolean> {
    setError(null)
    setUpdatingHealthId(batchId)
    const result = await runApi(
      () => updateBatchHealth(batchId, healthStatus),
      'Could not update health.',
    )
    if (!result.ok) {
      setError(result.error)
      setUpdatingHealthId(null)
      return false
    }
    setBatches((prev) =>
      prev.map((batch) => (batch.id === batchId ? result.data : batch)),
    )
    setUpdatingHealthId(null)
    return true
  }

  return {
    batches,
    error,
    isLoading,
    isSaving,
    markingForSaleId,
    updatingHealthId,
    saveBatch,
    markForSale,
    updateHealth,
  }
}
