import { useState, type FormEvent } from "react";
import { useAuth } from "../auth/AuthContext";
import { Badge } from "../components/Badge";
import { Button } from "../components/Button";
import { ErrorBanner } from "../components/ErrorBanner";
import {
  EditIcon,
  ForSaleIcon,
  IconButton,
} from "../components/IconButton";
import { NumericInput } from "../components/NumericInput";
import { useBatches } from "../hooks/useBatches";
import { useSpecies } from "../hooks/useSpecies";
import {
  HEALTH_STATUSES,
  isBatchStatus,
  isHealthStatus,
  type Batch,
  type BatchInput,
  type BatchStatus,
  type HealthStatus,
} from "../types";
import { todayLocalIsoDate } from "../utils/date";

type BatchForm = {
  plantSpeciesId: number;
  quantity: number | "";
  plantedAt: string;
  healthStatus: HealthStatus;
  location: string;
  status: BatchStatus;
};

function emptyForm(speciesId = 0): BatchForm {
  return {
    plantSpeciesId: speciesId,
    quantity: 10,
    plantedAt: todayLocalIsoDate(),
    healthStatus: "Healthy",
    location: "",
    status: "Growing",
  };
}

function readinessBadge(batch: Batch) {
  if (batch.status === "SoldOut") {
    return <Badge tone="neutral">Sold out</Badge>;
  }
  if (batch.status === "ForSale") {
    return (
      <Badge tone={batch.isSaleReady ? "info" : "warn"}>For sale</Badge>
    );
  }
  if (batch.isSaleReady) {
    return <Badge tone="ok">Ready</Badge>;
  }
  return <Badge tone="warn">Not ready</Badge>;
}

export function BatchesPage() {
  const { isAdmin } = useAuth();
  const {
    batches,
    error,
    isLoading: isBatchesLoading,
    isSaving,
    markingForSaleId,
    updatingHealthId,
    saveBatch,
    markForSale,
    updateHealth,
  } = useBatches();
  const { speciesList, error: speciesError, isLoading: isSpeciesLoading } =
    useSpecies({ enabled: isAdmin });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<BatchForm>(emptyForm());
  const [formError, setFormError] = useState<string | null>(null);

  const isLoading = isBatchesLoading || isSpeciesLoading;
  const bannerError = formError ?? error ?? speciesError;
  const selectedSpeciesId = form.plantSpeciesId || speciesList[0]?.id || 0;

  function handleStartEdit(batch: Batch) {
    setEditingId(batch.id);
    setForm({
      plantSpeciesId: batch.plantSpeciesId,
      quantity: batch.quantity,
      plantedAt: batch.plantedAt.slice(0, 10),
      healthStatus: batch.healthStatus,
      location: batch.location ?? "",
      status: batch.status,
    });
  }

  function handleResetForm() {
    setEditingId(null);
    setForm(emptyForm(speciesList[0]?.id || 0));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!isAdmin) return;
    const quantity = typeof form.quantity === "number" ? form.quantity : null;
    if (quantity == null || quantity < 1) {
      setFormError("Quantity must be a whole number of at least 1.");
      return;
    }
    setFormError(null);
    const payload: BatchInput = {
      plantSpeciesId: Number(selectedSpeciesId),
      quantity,
      plantedAt: form.plantedAt,
      healthStatus: form.healthStatus,
      location: form.location.trim() || null,
    };
    if (editingId != null) {
      payload.status = form.status;
    }
    const didSave = await saveBatch(payload, editingId ?? undefined);
    if (didSave) {
      handleResetForm();
    }
  }

  return (
    <div>
      <h1>Batches</h1>
      <p className="muted">
        Readiness is calculated on the server (age, health, watering, status).
        Mark for sale is the only way to set ForSale.
      </p>
      <ErrorBanner message={bannerError} />

      {isAdmin && (
        <form className="panel form-grid" onSubmit={handleSubmit}>
          <h2>
            {editingId != null ? `Edit batch #${editingId}` : "Create batch"}
          </h2>
          <label>
            Species
            <select
              value={selectedSpeciesId}
              onChange={(e) =>
                setForm({ ...form, plantSpeciesId: Number(e.target.value) })
              }
              required
            >
              {speciesList.length === 0 && <option value={0}>No species</option>}
              {speciesList.map((species) => (
                <option key={species.id} value={species.id}>
                  {species.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Quantity
            <NumericInput
              value={form.quantity === "" ? null : form.quantity}
              onChange={(quantity) =>
                setForm({ ...form, quantity: quantity ?? "" })
              }
              required
            />
          </label>
          <label>
            Planted at
            <input
              type="date"
              max={todayLocalIsoDate()}
              value={form.plantedAt}
              onChange={(e) => setForm({ ...form, plantedAt: e.target.value })}
              required
            />
          </label>
          <label>
            Health
            <select
              value={form.healthStatus}
              onChange={(e) => {
                if (!isHealthStatus(e.target.value)) return
                setForm({ ...form, healthStatus: e.target.value })
              }}
            >
              {HEALTH_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>
          {editingId != null && (
            <label>
              Status
              <select
                value={form.status}
                onChange={(e) => {
                  if (!isBatchStatus(e.target.value)) return
                  setForm({ ...form, status: e.target.value })
                }}
              >
                <option value="Growing">Growing</option>
                {form.status === "ForSale" && (
                  <option value="ForSale">ForSale</option>
                )}
                <option value="SoldOut">SoldOut</option>
              </select>
            </label>
          )}
          <label>
            Location / label
            <input
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
            />
          </label>
          <div className="form-actions">
            <Button type="submit" disabled={isSaving || speciesList.length === 0}>
              {isSaving ? "Saving…" : editingId != null ? "Update" : "Create"}
            </Button>
            <Button type="button" variant="outline" onClick={handleResetForm}>
              Cancel
            </Button>
          </div>
        </form>
      )}

      {isLoading ? (
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
              batches.map((batch) => (
                <tr key={batch.id}>
                  <td>{batch.id}</td>
                  <td>{batch.speciesName || `#${batch.plantSpeciesId}`}</td>
                  <td>{batch.quantity}</td>
                  <td>{batch.plantedAt.slice(0, 10)}</td>
                  <td>
                    {isAdmin ? (
                      batch.healthStatus
                    ) : (
                      <select
                        value={batch.healthStatus}
                        disabled={updatingHealthId === batch.id}
                        onChange={(e) => {
                          if (!isHealthStatus(e.target.value)) return
                          void updateHealth(batch.id, e.target.value)
                        }}
                      >
                        {HEALTH_STATUSES.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    )}
                  </td>
                  <td>{batch.status}</td>
                  <td>{batch.location || "—"}</td>
                  <td>
                    {readinessBadge(batch)}
                    {batch.readinessNotes && batch.readinessNotes.length > 0 && (
                      <div className="hint">{batch.readinessNotes.join("; ")}</div>
                    )}
                  </td>
                  <td>
                    <div className="row-actions">
                      {isAdmin && (
                        <IconButton
                          label="Edit"
                          onClick={() => handleStartEdit(batch)}
                        >
                          <EditIcon />
                        </IconButton>
                      )}
                      {isAdmin &&
                        batch.status === "Growing" &&
                        batch.isSaleReady && (
                          <IconButton
                            label="Mark ForSale"
                            variant="success"
                            disabled={markingForSaleId === batch.id}
                            onClick={() => void markForSale(batch.id)}
                          >
                            <ForSaleIcon />
                          </IconButton>
                        )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
