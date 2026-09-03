import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "../components/Button";
import ConfirmDialog from "../components/ConfirmDialog";
import { ErrorBanner } from "../components/ErrorBanner";
import { EditIcon, IconButton, TrashIcon } from "../components/IconButton";
import { NumericInput } from "../components/NumericInput";
import { useSpecies } from "../hooks/useSpecies";
import type { PlantSpecies } from "../types";

const SpeciesFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  scientificName: z.string().optional(),
  wateringIntervalDays: z
    .number({ error: "Watering interval is required" })
    .min(1, "Watering interval must be at least 1 day"),
  minDaysBeforeSale: z
    .number({ error: "Min days before sale is required" })
    .min(1, "Min days before sale must be at least 1 day"),
});

type SpeciesForm = z.infer<typeof SpeciesFormSchema>;

const emptyForm: SpeciesForm = {
  name: "",
  scientificName: "",
  wateringIntervalDays: 7,
  minDaysBeforeSale: 30,
};

export function SpeciesPage() {
  const {
    speciesList,
    error,
    isLoading,
    isSaving,
    isDeleting,
    saveSpecies,
    removeSpecies,
  } = useSpecies();
  const [speciesToEdit, setSpeciesToEdit] = useState<PlantSpecies | null>(null);
  const [speciesToDelete, setSpeciesToDelete] = useState<PlantSpecies | null>(
    null,
  );

  const {
    control,
    formState: { errors: formErrors },
    reset,
    register,
    handleSubmit,
  } = useForm<SpeciesForm>({
    resolver: zodResolver(SpeciesFormSchema),
    reValidateMode: "onBlur",
    defaultValues: emptyForm,
  });

  function handleStartEdit(species: PlantSpecies) {
    setSpeciesToEdit(species);
    reset({
      name: species.name,
      scientificName: species.scientificName ?? undefined,
      wateringIntervalDays: species.wateringIntervalDays,
      minDaysBeforeSale: species.minDaysBeforeSale,
    });
  }

  function handleResetForm() {
    setSpeciesToEdit(null);
    reset(emptyForm);
  }

  async function handleSubmitForm(data: SpeciesForm) {
    const payload = {
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

  function handleAskDelete(species: PlantSpecies) {
    setSpeciesToDelete(species);
  }

  function handleCancelDelete() {
    if (isDeleting) return;
    setSpeciesToDelete(null);
  }

  async function handleDelete() {
    if (speciesToDelete == null || isDeleting) return;
    const speciesId = speciesToDelete.id;
    const didDelete = await removeSpecies(speciesId);
    if (!didDelete) return;
    setSpeciesToDelete(null);
    if (speciesToEdit?.id === speciesId) {
      handleResetForm();
    }
  }

  return (
    <div>
      <h1>Species</h1>
      <p className="muted">
        Admin only — watering interval and min age before sale.
      </p>
      <ErrorBanner message={error} />

      <form
        className="panel form-grid"
        onSubmit={handleSubmit((data) => void handleSubmitForm(data))}
      >
        {speciesToEdit != null ? (
          <h2>
            Edit{" "}
            <span className="text-green-900 font-bold">
              {speciesToEdit?.name}
            </span>
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
            <p className="text-red-500">
              {formErrors.minDaysBeforeSale.message}
            </p>
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

      {isLoading ? (
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
            {speciesList.length === 0 ? (
              <tr>
                <td colSpan={6}>No species yet.</td>
              </tr>
            ) : (
              speciesList.map((species) => (
                <tr key={species.id}>
                  <td>{species.id}</td>
                  <td>{species.name}</td>
                  <td>{species.scientificName || "—"}</td>
                  <td>{species.wateringIntervalDays}d</td>
                  <td>{species.minDaysBeforeSale}d</td>
                  <td>
                    <div className="row-actions">
                      <IconButton
                        label="Edit"
                        onClick={() => handleStartEdit(species)}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        label="Delete"
                        variant="danger"
                        onClick={() => handleAskDelete(species)}
                      >
                        <TrashIcon />
                      </IconButton>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}

      <ConfirmDialog
        open={speciesToDelete !== null}
        title="Delete species"
        message={
          speciesToDelete
            ? `Are you sure you want to delete ${speciesToDelete.name}?`
            : ""
        }
        isConfirmDisabled={isDeleting}
        onConfirm={() => void handleDelete()}
        onCancel={handleCancelDelete}
      />
    </div>
  );
}
