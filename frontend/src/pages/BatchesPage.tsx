import { useState } from "react";
import "react-datepicker/dist/react-datepicker.css";
import * as z from "zod";
import { useAuth } from "../auth/AuthContext";
import { useBatches } from "../hooks/useBatches";
import { useSpecies } from "../hooks/useSpecies";

import BatchForm from "@/components/Batches/BatchForm";
import BatchList from "@/components/Batches/BatchList";
import { ErrorBanner } from "@/components/ErrorBanner";
import { todayLocalIsoDate } from "@/utils/date";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { BATCH_STATUSES, type Batch } from "../types";

export const BatchFormSchema = z.object({
  plantSpeciesId: z.number().min(1, "Species is required"),
  quantity: z.number().min(1, "Quantity must be at least 1"),
  plantedAt: z.string().min(1, "Planted at is required"),
  healthStatus: z.string().min(1, "Health status is required"),
  location: z.string().optional(),
  status: z.enum(BATCH_STATUSES).optional(),
});
export type BatchForm = z.infer<typeof BatchFormSchema>;

export function BatchesPage() {
  const { isAdmin } = useAuth();
  const {
    batches,
    error,
    isLoading: isBatchesLoading,
    isSaving,
    markingForSaleId,
    saveBatch,
    markForSale,
    updateHealth,
  } = useBatches();
  const {
    speciesList,
    error: speciesError,
    isLoading: isSpeciesLoading,
  } = useSpecies({ enabled: isAdmin });
  const [editingId, setEditingId] = useState<number | null>(null);
  const isLoading = isBatchesLoading || isSpeciesLoading;
  const bannerError = speciesError ?? error;
  const emptyForm: BatchForm = {
    plantSpeciesId: 0,
    quantity: 10,
    plantedAt: todayLocalIsoDate(),
    healthStatus: "Healthy",
    location: "",
    status: "Growing",
  };

  const {
    control,
    formState: { errors: formErrors },
    reset,
    handleSubmit,
    setValue,
    watch,
  } = useForm<BatchForm>({
    resolver: zodResolver(BatchFormSchema),
    reValidateMode: "onBlur",
    defaultValues: emptyForm,
  });

  function handleStartEdit(batch: Batch) {
    setEditingId(batch.id);
    reset({
      plantSpeciesId: batch.plantSpeciesId,
      quantity: batch.quantity,
      plantedAt: batch.plantedAt,
      healthStatus: batch.healthStatus,
      location: batch.location ?? "",
      status: batch.status,
    });
  }

  function handleResetForm() {
    setEditingId(null);
    reset(emptyForm);
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <h1>Batches</h1>
      <p className="muted">
        Readiness is calculated on the server (age, health, watering, status).
        Mark for sale is the only way to set ForSale.
      </p>
      <ErrorBanner message={bannerError as string} />

      {isAdmin && (
        <BatchForm
          editingId={editingId}
          speciesList={speciesList}
          isSaving={isSaving}
          isAdmin={isAdmin}
          handleResetForm={handleResetForm}
          saveBatch={saveBatch}
          control={control}
          formErrors={formErrors}
          handleSubmit={handleSubmit}
          setValue={setValue}
          watch={watch}
        />
      )}

      <div className="mt-4 min-h-0 flex-1 overflow-hidden">
        <BatchList
          isLoading={isLoading}
          batches={batches}
          control={control}
          updateHealth={updateHealth}
          formErrors={formErrors}
          handleStartEdit={handleStartEdit}
          isAdmin={isAdmin}
          markingForSaleId={markingForSaleId}
          markForSale={markForSale}
        />
      </div>
    </div>
  );
}
