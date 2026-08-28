import { useEffect, useState, type FormEvent } from 'react'
import {
  createSpecies,
  deleteSpecies,
  listSpecies,
  updateSpecies,
} from '../api/species'
import { ApiError } from '../api/client'
import { ErrorBanner } from '../components/ErrorBanner'
import type { PlantSpecies, SpeciesInput } from '../types'

const blank: SpeciesInput = {
  name: '',
  scientificName: '',
  wateringIntervalDays: 7,
  minDaysBeforeSale: 30,
}

export function SpeciesPage() {
  const [items, setItems] = useState<PlantSpecies[]>([])
  const [form, setForm] = useState<SpeciesInput>(blank)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)

  async function reload() {
    setLoading(true)
    setError(null)
    try {
      setItems(await listSpecies())
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load species.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void reload()
  }, [])

  function startEdit(item: PlantSpecies) {
    setEditingId(item.id)
    setForm({
      name: item.name,
      scientificName: item.scientificName ?? '',
      wateringIntervalDays: item.wateringIntervalDays,
      minDaysBeforeSale: item.minDaysBeforeSale,
    })
  }

  function resetForm() {
    setEditingId(null)
    setForm(blank)
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    const payload: SpeciesInput = {
      name: form.name.trim(),
      scientificName: form.scientificName?.trim() || null,
      wateringIntervalDays: Number(form.wateringIntervalDays),
      minDaysBeforeSale: Number(form.minDaysBeforeSale),
    }
    try {
      if (editingId != null) {
        await updateSpecies(editingId, payload)
      } else {
        await createSpecies(payload)
      }
      resetForm()
      await reload()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Save failed.')
    } finally {
      setBusy(false)
    }
  }

  async function onDelete(id: number) {
    if (!window.confirm('Delete this species?')) return
    setError(null)
    try {
      await deleteSpecies(id)
      if (editingId === id) resetForm()
      await reload()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Delete failed.')
    }
  }

  return (
    <div>
      <h1>Species</h1>
      <p className="muted">Admin only — watering interval and min age before sale.</p>
      <ErrorBanner message={error} />

      <form className="panel form-grid" onSubmit={onSubmit}>
        <h2>{editingId != null ? `Edit #${editingId}` : 'Add species'}</h2>
        <label>
          Name
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
        </label>
        <label>
          Scientific name
          <input
            value={form.scientificName ?? ''}
            onChange={(e) => setForm({ ...form, scientificName: e.target.value })}
          />
        </label>
        <label>
          Watering interval (days)
          <input
            type="number"
            min={1}
            value={form.wateringIntervalDays}
            onChange={(e) =>
              setForm({ ...form, wateringIntervalDays: Number(e.target.value) })
            }
            required
          />
        </label>
        <label>
          Min days before sale
          <input
            type="number"
            min={0}
            value={form.minDaysBeforeSale}
            onChange={(e) =>
              setForm({ ...form, minDaysBeforeSale: Number(e.target.value) })
            }
            required
          />
        </label>
        <div className="form-actions">
          <button type="submit" className="btn" disabled={busy}>
            {busy ? 'Saving…' : editingId != null ? 'Update' : 'Create'}
          </button>
          {editingId != null && (
            <button type="button" className="btn btn-secondary" onClick={resetForm}>
              Cancel
            </button>
          )}
        </div>
      </form>

      {loading ? (
        <p>Loading…</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Scientific</th>
              <th>Interval</th>
              <th>Min age</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={6}>No species yet.</td>
              </tr>
            ) : (
              items.map((s) => (
                <tr key={s.id}>
                  <td>{s.id}</td>
                  <td>{s.name}</td>
                  <td>{s.scientificName || '—'}</td>
                  <td>{s.wateringIntervalDays}d</td>
                  <td>{s.minDaysBeforeSale}d</td>
                  <td className="row-actions">
                    <button type="button" className="btn btn-small" onClick={() => startEdit(s)}>
                      Edit
                    </button>
                    <button
                      type="button"
                      className="btn btn-small btn-danger"
                      onClick={() => void onDelete(s.id)}
                    >
                      Delete
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
