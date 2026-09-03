import type { SpeciesFormValues } from "@/pages/SpeciesPage";
import type { PlantSpecies, SpeciesInput } from "@/types";
import {
  Controller,
  type Control,
  type FieldErrors,
  type UseFormHandleSubmit,
  type UseFormRegister,
} from "react-hook-form";
import { Button } from "../Button";
import { NumericInput } from "../NumericInput";

interface SpeciesFormProps {
  speciesToEdit: PlantSpecies | null;
  isSaving: boolean;
  handleResetForm: () => void;
  saveSpecies: (payload: SpeciesInput, speciesId?: number) => Promise<boolean>;
  control: Control<SpeciesFormValues>;
  register: UseFormRegister<SpeciesFormValues>;
  formErrors: FieldErrors<SpeciesFormValues>;
  handleSubmit: UseFormHandleSubmit<SpeciesFormValues>;
}

export default function SpeciesForm({
  speciesToEdit,
  isSaving,
  handleResetForm,
  saveSpecies,
  control,
  register,
  formErrors,
  handleSubmit,
}: SpeciesFormProps) {
  async function handleSubmitForm(data: SpeciesFormValues) {
    const payload: SpeciesInput = {
      name: data.name.trim(),
      scientificName: data.scientificName?.trim() || "",
      wateringIntervalDays: Number(data.wateringIntervalDays),
      minDaysBeforeSale: Number(data.minDaysBeforeSale),
    };
    const didSave = await saveSpecies(payload, speciesToEdit?.id);
    if (didSave) {
      handleResetForm();
    }
  }

  return (
    <form
      className="panel form-grid"
      onSubmit={handleSubmit((data) => void handleSubmitForm(data))}
    >
      {speciesToEdit != null ? (
        <h2>
          Edit{" "}
          <span className="text-green-900 font-bold">{speciesToEdit.name}</span>
        </h2>
      ) : (
        <h2>Add species</h2>
      )}

      <label>
        <span className="font-bold">
          Name <span className="text-red-500 font-bold">*</span>
        </span>
        <input {...register("name")} />
        {formErrors.name && (
          <p className="text-red-500">{formErrors.name.message}</p>
        )}
      </label>
      <label>
        Scientific name
        <input {...register("scientificName")} />
      </label>
      <label>
        <span className="font-bold">
          Watering interval (days){" "}
          <span className="text-red-500 font-bold">*</span>
        </span>
        <Controller
          name="wateringIntervalDays"
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
        {formErrors.wateringIntervalDays && (
          <p className="text-red-500">
            {formErrors.wateringIntervalDays.message}
          </p>
        )}
      </label>
      <label>
        <span className="font-bold">
          Min days before sale{" "}
          <span className="text-red-500 font-bold">*</span>
        </span>
        <Controller
          name="minDaysBeforeSale"
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
        {formErrors.minDaysBeforeSale && (
          <p className="text-red-500">{formErrors.minDaysBeforeSale.message}</p>
        )}
      </label>
      <div className="form-actions">
        <Button type="submit" disabled={isSaving}>
          {isSaving ? "Saving…" : speciesToEdit != null ? "Update" : "Create"}
        </Button>
        <Button type="button" variant="outline" onClick={handleResetForm}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
