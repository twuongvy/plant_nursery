import type { BatchForm } from "@/pages/BatchesPage";
import { HEALTH_STATUSES, type Batch, type HealthStatus } from "@/types";
import { EditIcon } from "lucide-react";
import { Controller, type Control, type FieldErrors } from "react-hook-form";
import { Badge } from "../Badge";
import { ForSaleIcon, IconButton } from "../IconButton";

interface BatchListProps {
  isLoading: boolean;
  batches: Batch[];
  control: Control<BatchForm>;
  updateHealth: (batchId: number, healthStatus: HealthStatus) => void;
  formErrors: FieldErrors<BatchForm>;
  handleStartEdit: (batch: Batch) => void;
  isAdmin: boolean;
  markingForSaleId: number | null;
  markForSale: (batchId: number) => void;
}

function readinessBadge(batch: Batch) {
  if (batch.status === "SoldOut") {
    return <Badge tone="neutral">Sold out</Badge>;
  }
  if (batch.status === "ForSale") {
    return <Badge tone={batch.isSaleReady ? "info" : "warn"}>For sale</Badge>;
  }
  if (batch.isSaleReady) {
    return <Badge tone="ok">Ready</Badge>;
  }
  return <Badge tone="bad">Not ready</Badge>;
}

export default function BatchList({
  isLoading,
  batches,
  control,
  updateHealth,
  formErrors,
  handleStartEdit,
  isAdmin,
  markingForSaleId,
  markForSale,
}: BatchListProps) {
  return (
    <div className="table-body-scroll">
      {isLoading ? (
        <p>Loading…</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Species</th>
              <th>Qty</th>
              <th className="w-40">Planted</th>
              <th className="w-40">Health</th>
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
                  <td className="w-40">
                    <Controller
                      name="healthStatus"
                      control={control}
                      render={({ field }) => (
                        <select
                          name={field.name}
                          ref={field.ref}
                          value={batch.healthStatus}
                          onBlur={field.onBlur}
                          onChange={(e) => {
                            field.onChange(e.target.value);
                            updateHealth(
                              batch.id,
                              e.target.value as HealthStatus,
                            );
                          }}
                        >
                          {HEALTH_STATUSES.map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                      )}
                    />
                    {formErrors.healthStatus && (
                      <p className="text-red-500">
                        {formErrors.healthStatus.message}
                      </p>
                    )}
                  </td>
                  <td>{batch.status}</td>
                  <td>{batch.location || "—"}</td>
                  <td>
                    {readinessBadge(batch)}
                    {batch.readinessNotes &&
                      batch.readinessNotes.length > 0 && (
                        <div className="hint">
                          {batch.readinessNotes.join("; ")}
                        </div>
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
