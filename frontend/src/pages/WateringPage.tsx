import { useEffect, useState } from 'react'
import { listDueWaterings, recordWatering } from '../api/waterings'
import { ApiError } from '../api/client'
import { Badge } from '../components/Badge'
import { ErrorBanner } from '../components/ErrorBanner'
import type { WateringDueItem } from '../types'

export function WateringPage() {
  const [items, setItems] = useState<WateringDueItem[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [recordingId, setRecordingId] = useState<number | null>(null)
  const [note, setNote] = useState('')

  async function reload() {
    setLoading(true)
    setError(null)
    try {
      setItems(await listDueWaterings())
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'Failed to load watering queue.',
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void reload()
  }, [])

  async function onRecord(batchId: number) {
    setError(null)
    setRecordingId(batchId)
    try {
      await recordWatering({
        batchId,
        note: note.trim() || null,
      })
      setNote('')
      await reload()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not record watering.')
    } finally {
      setRecordingId(null)
    }
  }

  return (
    <div>
      <h1>Watering</h1>
      <p className="muted">Due and overdue batches based on species watering interval.</p>
      <ErrorBanner message={error} />

      <div className="panel">
        <label>
          Optional note for next watering
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. light mist"
          />
        </label>
      </div>

      {loading ? (
        <p>Loading…</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Batch</th>
              <th>Species</th>
              <th>Location</th>
              <th>Last watered</th>
              <th>Due</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={7}>Nothing due right now.</td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.batchId} className={item.isOverdue ? 'row-overdue' : undefined}>
                  <td>#{item.batchId}</td>
                  <td>{item.speciesName || '—'}</td>
                  <td>{item.location || '—'}</td>
                  <td>
                    {item.lastWateredAt
                      ? item.lastWateredAt.slice(0, 16).replace('T', ' ')
                      : 'Never'}
                  </td>
                  <td>
                    {item.dueAt
                      ? item.dueAt.slice(0, 16).replace('T', ' ')
                      : '—'}
                  </td>
                  <td>
                    {item.isOverdue ? (
                      <Badge tone="bad">
                        Overdue
                        {item.daysOverdue != null ? ` (${item.daysOverdue}d)` : ''}
                      </Badge>
                    ) : (
                      <Badge tone="warn">Due</Badge>
                    )}
                  </td>
                  <td>
                    <button
                      type="button"
                      className="btn btn-small"
                      disabled={recordingId === item.batchId}
                      onClick={() => void onRecord(item.batchId)}
                    >
                      {recordingId === item.batchId ? 'Saving…' : 'Record watering'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}
    </div>
  )
}
