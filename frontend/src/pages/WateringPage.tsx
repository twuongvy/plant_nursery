import WateringList from "@/components/Watering/WateringList";
import { useState } from "react";
import { ErrorBanner } from "../components/ErrorBanner";
import { useWaterings } from "../hooks/useWaterings";

export function WateringPage() {
  const {
    dueItems,
    error,
    isLoading,
    recordingBatchId,
    recordBatchWatering,
  } = useWaterings();
  const [notesByBatchId, setNotesByBatchId] = useState<Record<number, string>>(
    {},
  );

  function handleNoteChange(batchId: number, note: string) {
    setNotesByBatchId((prev) => ({ ...prev, [batchId]: note }));
  }

  async function handleRecord(batchId: number) {
    const didRecord = await recordBatchWatering({
      batchId,
      note: notesByBatchId[batchId]?.trim() || null,
    });
    if (!didRecord) return;
    setNotesByBatchId((prev) => {
      const next = { ...prev };
      delete next[batchId];
      return next;
    });
  }

  const isRecording = recordingBatchId !== null;

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <h1>Watering</h1>
      <p className="muted">
        Due and overdue batches based on species watering interval.
      </p>
      <ErrorBanner message={error} />

      <div className="mt-4 min-h-0 flex-1 overflow-hidden">
        <WateringList
          isLoading={isLoading}
          dueItems={dueItems}
          notesByBatchId={notesByBatchId}
          isRecording={isRecording}
          recordingBatchId={recordingBatchId}
          handleNoteChange={handleNoteChange}
          handleRecord={handleRecord}
        />
      </div>
    </div>
  );
}
