import SpeciesForm from "@/components/Species/SpeciesForm";
import SpeciesList from "@/components/Species/SpeciesList";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import ConfirmDialog from "../components/ConfirmDialog";
import { ErrorBanner } from "../components/ErrorBanner";
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

export type SpeciesFormValues = z.infer<typeof SpeciesFormSchema>;

const emptyForm: SpeciesFormValues = {
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
  } = useForm<SpeciesFormValues>({
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
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <h1>Species</h1>
      <p className="muted">
        Admin only — watering interval and min age before sale.
      </p>
      <ErrorBanner message={error} />

      <SpeciesForm
        speciesToEdit={speciesToEdit}
        isSaving={isSaving}
        handleResetForm={handleResetForm}
        saveSpecies={saveSpecies}
        control={control}
        register={register}
        formErrors={formErrors}
        handleSubmit={handleSubmit}
      />

      <div className="mt-4 min-h-0 flex-1 overflow-hidden">
        <SpeciesList
          isLoading={isLoading}
          speciesList={speciesList}
          handleStartEdit={handleStartEdit}
          handleAskDelete={handleAskDelete}
        />
      </div>

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
