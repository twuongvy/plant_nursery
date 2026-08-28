import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getDashboardSummary } from '../api/dashboard'
import { ApiError } from '../api/client'
import { ErrorBanner } from '../components/ErrorBanner'
import type { DashboardSummary } from '../types'

const empty: DashboardSummary = {
  overdueWaterings: 0,
  saleReadyBatches: 0,
  growingBatches: 0,
}

export function DashboardPage() {
  const [data, setData] = useState<DashboardSummary>(empty)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        const summary = await getDashboardSummary()
        if (!cancelled) setData(summary)
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof ApiError
              ? err.message
              : 'Could not load dashboard.',
          )
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div>
      <h1>Dashboard</h1>
      <p className="muted">Summary of watering risk and sale readiness.</p>
      <ErrorBanner message={error} />
      {loading ? (
        <p>Loading…</p>
      ) : (
        <div className="stat-row">
          <div className="stat-card">
            <div className="stat-label">Overdue waterings</div>
            <div className="stat-value warn">{data.overdueWaterings}</div>
            <Link to="/watering">View queue</Link>
          </div>
          <div className="stat-card">
            <div className="stat-label">Sale-ready batches</div>
            <div className="stat-value ok">{data.saleReadyBatches}</div>
            <Link to="/batches">View batches</Link>
          </div>
          <div className="stat-card">
            <div className="stat-label">Growing batches</div>
            <div className="stat-value">{data.growingBatches}</div>
            <Link to="/batches">Manage</Link>
          </div>
        </div>
      )}
    </div>
  )
}
