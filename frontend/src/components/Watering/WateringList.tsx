import type { WateringDueItem } from "@/types";
import { formatDateTime } from "@/utils/date";
import { Badge } from "../Badge";
import { Button } from "../Button";

interface WateringListProps {
  isLoading: boolean;
  dueItems: WateringDueItem[];
  notesByBatchId: Record<number, string>;
  isRecording: boolean;
  recordingBatchId: number | null;
  handleNoteChange: (batchId: number, note: string) => void;
  handleRecord: (batchId: number) => void;
}

export default function WateringList({
  isLoading,
  dueItems,
  notesByBatchId,
  isRecording,
  recordingBatchId,
  handleNoteChange,
  handleRecord,
}: WateringListProps) {
  return (
    <div className="table-body-scroll">
      {isLoading ? (
        <p>Loading…</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Batch</th>
              <th>Species</th>
              <th>Location</th>
              <th>Last watered</th>
              <th>Due</th>
              <th>Status</th>
              <th>Note</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {dueItems.length === 0 ? (
              <tr>
                <td colSpan={8}>Nothing due right now.</td>
              </tr>
            ) : (
              dueItems.map((dueItem) => (
                <tr
                  key={dueItem.batchId}
                  className={dueItem.isOverdue ? "row-overdue" : undefined}
                >
                  <td>#{dueItem.batchId}</td>
                  <td>{dueItem.speciesName || "—"}</td>
                  <td>{dueItem.location || "—"}</td>
                  <td>
                    {dueItem.lastWateredAt
                      ? formatDateTime(dueItem.lastWateredAt)
                      : "Never"}
                  </td>
                  <td>{formatDateTime(dueItem.dueAt)}</td>
                  <td>
                    {dueItem.isOverdue ? (
                      <Badge tone="bad">
                        Overdue
                        {dueItem.daysOverdue != null
                          ? ` (${dueItem.daysOverdue}d)`
                          : ""}
                      </Badge>
                    ) : (
                      <Badge tone="warn">Due</Badge>
                    )}
                  </td>
                  <td>
                    <input
                      value={notesByBatchId[dueItem.batchId] ?? ""}
                      onChange={(e) =>
                        handleNoteChange(dueItem.batchId, e.target.value)
                      }
                      placeholder="Optional note"
                      disabled={isRecording}
                    />
                  </td>
                  <td>
                    <Button
                      type="button"
                      size="sm"
                      disabled={isRecording}
                      onClick={() => void handleRecord(dueItem.batchId)}
                    >
                      {recordingBatchId === dueItem.batchId
                        ? "Saving…"
                        : "Record watering"}
                    </Button>
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
