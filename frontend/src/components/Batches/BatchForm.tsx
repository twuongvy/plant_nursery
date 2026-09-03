import type { BatchForm } from "@/pages/BatchesPage";
import {
  HEALTH_STATUSES,
  type BatchInput,
  type BatchStatus,
  type HealthStatus,
  type PlantSpecies,
} from "@/types";
import DatePicker from "react-datepicker";
import {
  Controller,
  type Control,
  type FieldErrors,
  type UseFormHandleSubmit,
  type UseFormSetValue,
  type UseFormWatch,
} from "react-hook-form";
import { Button } from "../Button";
import { NumericInput } from "../NumericInput";

interface BatchFormProps {
  editingId: number | null;
  speciesList: PlantSpecies[];
  isSaving: boolean;
  isAdmin: boolean;
  handleResetForm: () => void;
  saveBatch: (payload: BatchInput, batchId?: number) => Promise<boolean>;
  control: Control<BatchForm>;
  formErrors: FieldErrors<BatchForm>;
  handleSubmit: UseFormHandleSubmit<BatchForm>;
  setValue: UseFormSetValue<BatchForm>;
  watch: UseFormWatch<BatchForm>;
}
export default function BatchForm({
  editingId,
  speciesList,
  isSaving,
  isAdmin,
  handleResetForm,
  saveBatch,
  control,
  formErrors,
  handleSubmit,
  setValue,
  watch,
}: BatchFormProps) {
  async function handleSubmitForm(
    data: BatchForm,
    batchId: number | null = editingId,
  ) {
    if (!isAdmin) return;
    const payload: BatchInput = {
      plantSpeciesId: data.plantSpeciesId,
      quantity: data.quantity,
      plantedAt: data.plantedAt,
      healthStatus: data.healthStatus as HealthStatus,
      location: data.location?.trim() || null,
      status: data.status as BatchStatus,
    };

    const didSave = await saveBatch(payload, batchId ?? undefined);
    if (didSave) {
      handleResetForm();
    }
  }

  return (
    <form
      className="panel form-grid"
      onSubmit={handleSubmit((data: BatchForm) => void handleSubmitForm(data))}
    >
      <h2>{editingId != null ? `Edit batch #${editingId}` : "Create batch"}</h2>
      <label>
        Species
        <Controller
          name="plantSpeciesId"
          control={control}
          render={({ field }) => (
            <select
              name={field.name}
              ref={field.ref}
              value={field.value}
              onChange={(e) => field.onChange(Number(e.target.value))}
            >
              <option value={0}>No species</option>
              {speciesList.map((species) => (
                <option
                  key={species.id}
                  value={species.id}
                  selected={field.value === species.id}
                >
                  {species.name}
                </option>
              ))}
            </select>
          )}
        />
        {formErrors.plantSpeciesId && (
          <p className="text-red-500">{formErrors.plantSpeciesId.message}</p>
        )}
      </label>
      <label>
        <span>Quantity</span>
        <Controller
          name="quantity"
          control={control}
          render={({ field }) => (
            <NumericInput
              name={field.name}
              ref={field.ref}
              value={field.value}
              onBlur={field.onBlur}
              onChange={field.onChange}
            />
          )}
        />
        {formErrors.quantity && (
          <p className="text-red-500">{formErrors.quantity.message}</p>
        )}
      </label>
      <label>
        Planted at
        <Controller
          name="plantedAt"
          control={control}
          render={({ field }) => (
            <DatePicker
              name={field.name}
              ref={field.ref}
              selected={field.value ? new Date(field.value) : null}
              onBlur={field.onBlur}
              onChange={(date: Date | null) =>
                field.onChange(date?.toISOString() ?? "")
              }
              maxDate={new Date()}
              className="w-full"
              enableTabLoop={false}
            />
          )}
        />
        {formErrors.plantedAt && (
          <p className="text-red-500">{formErrors.plantedAt.message}</p>
        )}
      </label>
      <label>
        Health
        <select
          value={watch("healthStatus")}
          onChange={(e) => setValue("healthStatus", e.target.value)}
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
            value={watch("status")}
            onChange={(e) => setValue("status", e.target.value as BatchStatus)}
          >
            <option value="Growing">Growing</option>
            {watch("status") === "ForSale" && (
              <option value="ForSale">ForSale</option>
            )}
            <option value="SoldOut">SoldOut</option>
          </select>
        </label>
      )}
      <label>
        Location / label
        <input
          value={watch("location")}
          onChange={(e) => setValue("location", e.target.value)}
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
  );
}
