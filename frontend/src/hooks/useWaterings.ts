import { useCallback, useEffect, useState } from 'react'
import {
  listDueWaterings,
  recordWatering as postWatering,
} from '../api/waterings'
import type { RecordWateringInput, WateringDueItem } from '../types'
import { runApi } from './api'

export function useWaterings() {
  const [dueItems, setDueItems] = useState<WateringDueItem[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [recordingBatchId, setRecordingBatchId] = useState<number | null>(null)

  const reload = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    const result = await runApi(
      listDueWaterings,
      'Failed to load watering queue.',
    )
    if (!result.ok) {
      setError(result.error)
    } else {
      setDueItems(result.data)
    }
    setIsLoading(false)
  }, [])

  useEffect(() => {
    void reload()
  }, [reload])

  async function recordBatchWatering(
    payload: RecordWateringInput,
  ): Promise<boolean> {
    setError(null)
    setRecordingBatchId(payload.batchId)
    const result = await runApi(
      () => postWatering(payload),
      'Could not record watering.',
    )
    if (!result.ok) {
      setError(result.error)
      setRecordingBatchId(null)
      return false
    }
    await reload()
    setRecordingBatchId(null)
    return true
  }

  return {
    dueItems,
    error,
    isLoading,
    recordingBatchId,
    recordBatchWatering,
  }
}
