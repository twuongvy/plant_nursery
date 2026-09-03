import { useState } from 'react'
import { Badge } from '../components/Badge'
import { Button } from '../components/Button'
import { ErrorBanner } from '../components/ErrorBanner'
import { useWaterings } from '../hooks/useWaterings'
import { formatDateTime } from '../utils/date'

export function WateringPage() {
  const {
    dueItems,
    error,
    isLoading,
    recordingBatchId,
    recordBatchWatering,
  } = useWaterings()
  const [notesByBatchId, setNotesByBatchId] = useState<Record<number, string>>(
    {},
  )

  function handleNoteChange(batchId: number, note: string) {
    setNotesByBatchId((prev) => ({ ...prev, [batchId]: note }))
  }

  async function handleRecord(batchId: number) {
    const didRecord = await recordBatchWatering({
      batchId,
      note: notesByBatchId[batchId]?.trim() || null,
    })
    if (!didRecord) return
    setNotesByBatchId((prev) => {
      const next = { ...prev }
      delete next[batchId]
      return next
    })
  }

  const isRecording = recordingBatchId !== null

  return (
    <div>
      <h1>Watering</h1>
      <p className="muted">Due and overdue batches based on species watering interval.</p>
      <ErrorBanner message={error} />

      {isLoading ? (
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
              <th>Note</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {dueItems.length === 0 ? (
              <tr>
                <td colSpan={8}>Nothing due right now.</td>
              </tr>
            ) : (
              dueItems.map((dueItem) => (
                <tr key={dueItem.batchId} className={dueItem.isOverdue ? 'row-overdue' : undefined}>
                  <td>#{dueItem.batchId}</td>
                  <td>{dueItem.speciesName || '—'}</td>
                  <td>{dueItem.location || '—'}</td>
                  <td>
                    {dueItem.lastWateredAt
                      ? formatDateTime(dueItem.lastWateredAt)
                      : 'Never'}
                  </td>
                  <td>{formatDateTime(dueItem.dueAt)}</td>
                  <td>
                    {dueItem.isOverdue ? (
                      <Badge tone="bad">
                        Overdue
                        {dueItem.daysOverdue != null ? ` (${dueItem.daysOverdue}d)` : ''}
                      </Badge>
                    ) : (
                      <Badge tone="warn">Due</Badge>
                    )}
                  </td>
                  <td>
                    <input
                      value={notesByBatchId[dueItem.batchId] ?? ''}
                      onChange={(e) =>
                        handleNoteChange(dueItem.batchId, e.target.value)
                      }
                      placeholder="Optional note"
                      disabled={isRecording}
                    />
                  </td>
                  <td>
                    <Button
                      type="button"
                      size="sm"
                      disabled={isRecording}
                      onClick={() => void handleRecord(dueItem.batchId)}
                    >
                      {recordingBatchId === dueItem.batchId ? 'Saving…' : 'Record watering'}
                    </Button>
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
