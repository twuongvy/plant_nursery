import { useEffect, useState, type FormEvent } from 'react'
import {
  createBatch,
  listBatches,
  markBatchForSale,
  updateBatch,
} from '../api/batches'
import { listSpecies } from '../api/species'
import { ApiError } from '../api/client'
import { useAuth } from '../auth/AuthContext'
import { Badge } from '../components/Badge'
import { ErrorBanner } from '../components/ErrorBanner'
import type {
  Batch,
  BatchInput,
  BatchStatus,
  HealthStatus,
  PlantSpecies,
} from '../types'

const today = () => new Date().toISOString().slice(0, 10)

function readinessBadge(batch: Batch) {
  if (batch.status === 'SoldOut') {
    return <Badge tone="neutral">Sold out</Badge>
  }
  if (batch.status === 'ForSale') {
    return <Badge tone="info">For sale</Badge>
  }
  if (batch.isSaleReady) {
    return <Badge tone="ok">Ready</Badge>
  }
  return <Badge tone="warn">Not ready</Badge>
}

export function BatchesPage() {
  const { isAdmin } = useAuth()
  const [batches, setBatches] = useState<Batch[]>([])
  const [species, setSpecies] = useState<PlantSpecies[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<BatchInput>({
    plantSpeciesId: 0,
    quantity: 10,
    plantedAt: today(),
    healthStatus: 'Healthy',
    location: '',
    status: 'Growing',
  })

  async function reload() {
    setLoading(true)
    setError(null)
    try {
      const batchList = await listBatches()
      setBatches(batchList)
      if (isAdmin) {
        const speciesList = await listSpecies()
        setSpecies(speciesList)
        setForm((prev) => ({
          ...prev,
          plantSpeciesId: prev.plantSpeciesId || speciesList[0]?.id || 0,
        }))
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load batches.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void reload()
  }, [isAdmin])

  function startEdit(batch: Batch) {
    setEditingId(batch.id)
    setForm({
      plantSpeciesId: batch.plantSpeciesId,
      quantity: batch.quantity,
      plantedAt: batch.plantedAt.slice(0, 10),
      healthStatus: batch.healthStatus,
      location: batch.location ?? '',
      status: batch.status,
    })
  }

  function resetForm() {
    setEditingId(null)
    setForm({
      plantSpeciesId: species[0]?.id || 0,
      quantity: 10,
      plantedAt: today(),
      healthStatus: 'Healthy',
      location: '',
      status: 'Growing',
    })
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!isAdmin) return
    setBusy(true)
    setError(null)
    const payload: BatchInput = {
      plantSpeciesId: Number(form.plantSpeciesId),
      quantity: Number(form.quantity),
      plantedAt: form.plantedAt,
      healthStatus: form.healthStatus,
      location: form.location?.trim() || null,
      status: form.status,
    }
    try {
      if (editingId != null) {
        await updateBatch(editingId, payload)
      } else {
        await createBatch(payload)
      }
      resetForm()
      await reload()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Save failed.')
    } finally {
      setBusy(false)
    }
  }

  async function onMarkForSale(id: number) {
    setError(null)
    try {
      await markBatchForSale(id)
      await reload()
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'Could not mark for sale (must be sale-ready).',
      )
    }
  }

  return (
    <div>
      <h1>Batches</h1>
      <p className="muted">
        Readiness is calculated on the server (age, health, watering, status).
      </p>
      <ErrorBanner message={error} />

      {isAdmin && (
        <form className="panel form-grid" onSubmit={onSubmit}>
          <h2>{editingId != null ? `Edit batch #${editingId}` : 'Create batch'}</h2>
          <label>
            Species
            <select
              value={form.plantSpeciesId}
              onChange={(e) =>
                setForm({ ...form, plantSpeciesId: Number(e.target.value) })
              }
              required
            >
              {species.length === 0 && <option value={0}>No species</option>}
              {species.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Quantity
            <input
              type="number"
              min={1}
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })}
              required
            />
          </label>
          <label>
            Planted at
            <input
              type="date"
              value={form.plantedAt}
              onChange={(e) => setForm({ ...form, plantedAt: e.target.value })}
              required
            />
          </label>
          <label>
            Health
            <select
              value={form.healthStatus}
              onChange={(e) =>
                setForm({ ...form, healthStatus: e.target.value as HealthStatus })
              }
            >
              <option value="Healthy">Healthy</option>
              <option value="Sick">Sick</option>
              <option value="Quarantine">Quarantine</option>
            </select>
          </label>
          <label>
            Status
            <select
              value={form.status}
              onChange={(e) =>
                setForm({ ...form, status: e.target.value as BatchStatus })
              }
            >
              <option value="Growing">Growing</option>
              <option value="ForSale">ForSale</option>
              <option value="SoldOut">SoldOut</option>
            </select>
          </label>
          <label>
            Location / label
            <input
              value={form.location ?? ''}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
            />
          </label>
          <div className="form-actions">
            <button
              type="submit"
              className="btn"
              disabled={busy || species.length === 0}
            >
              {busy ? 'Saving…' : editingId != null ? 'Update' : 'Create'}
            </button>
            {editingId != null && (
              <button type="button" className="btn btn-secondary" onClick={resetForm}>
                Cancel
              </button>
            )}
          </div>
        </form>
      )}

      {loading ? (
        <p>Loading…</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Species</th>
              <th>Qty</th>
              <th>Planted</th>
              <th>Health</th>
              <th>Status</th>
              <th>Location</th>
              <th>Readiness</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {batches.length === 0 ? (
              <tr>
                <td colSpan={9}>No batches yet.</td>
              </tr>
            ) : (
              batches.map((b) => (
                <tr key={b.id}>
                  <td>{b.id}</td>
                  <td>{b.speciesName || `#${b.plantSpeciesId}`}</td>
                  <td>{b.quantity}</td>
                  <td>{b.plantedAt.slice(0, 10)}</td>
                  <td>{b.healthStatus}</td>
                  <td>{b.status}</td>
                  <td>{b.location || '—'}</td>
                  <td>
                    {readinessBadge(b)}
                    {b.readinessNotes && b.readinessNotes.length > 0 && (
                      <div className="hint">{b.readinessNotes.join('; ')}</div>
                    )}
                  </td>
                  <td className="row-actions">
                    {isAdmin && (
                      <button
                        type="button"
                        className="btn btn-small"
                        onClick={() => startEdit(b)}
                      >
                        Edit
                      </button>
                    )}
                    {isAdmin && b.status === 'Growing' && b.isSaleReady && (
                      <button
                        type="button"
                        className="btn btn-small"
                        onClick={() => void onMarkForSale(b.id)}
                      >
                        Mark ForSale
                      </button>
                    )}
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
