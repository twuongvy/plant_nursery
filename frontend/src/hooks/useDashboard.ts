import { useCallback, useEffect, useState } from 'react'
import { getDashboardSummary } from '../api/dashboard'
import type { DashboardSummary } from '../types'
import { runApi } from './api'

const emptySummary: DashboardSummary = {
  overdueWaterings: 0,
  saleReadyBatches: 0,
  growingBatches: 0,
}

export function useDashboard() {
  const [summary, setSummary] = useState<DashboardSummary>(emptySummary)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const reload = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    const result = await runApi(getDashboardSummary, 'Could not load dashboard.')
    if (!result.ok) {
      setError(result.error)
    } else {
      setSummary(result.data)
    }
    setIsLoading(false)
  }, [])

  useEffect(() => {
    void reload()
  }, [reload])

  return { summary, error, isLoading }
}
