import { Link } from 'react-router-dom'
import { ErrorBanner } from '../components/ErrorBanner'
import { useDashboard } from '../hooks/useDashboard'

export function DashboardPage() {
  const { summary, error, isLoading } = useDashboard()

  return (
    <div>
      <h1>Dashboard</h1>
      <p className="muted">Summary of watering risk and sale readiness.</p>
      <ErrorBanner message={error} />
      {isLoading ? (
        <p>Loading…</p>
      ) : (
        <div className="stat-row">
          <div className="stat-card">
            <div className="stat-label">Overdue waterings</div>
            <div className="stat-value warn">{summary.overdueWaterings}</div>
            <Link to="/watering">View queue</Link>
          </div>
          <div className="stat-card">
            <div className="stat-label">Sale-ready batches</div>
            <div className="stat-value ok">{summary.saleReadyBatches}</div>
            <Link to="/batches">View batches</Link>
          </div>
          <div className="stat-card">
            <div className="stat-label">Growing batches</div>
            <div className="stat-value">{summary.growingBatches}</div>
            <Link to="/batches">Manage</Link>
          </div>
        </div>
      )}
    </div>
  )
}
