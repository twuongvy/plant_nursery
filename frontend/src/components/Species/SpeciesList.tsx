import type { PlantSpecies } from "@/types";
import { EditIcon, IconButton, TrashIcon } from "../IconButton";

interface SpeciesListProps {
  isLoading: boolean;
  speciesList: PlantSpecies[];
  handleStartEdit: (species: PlantSpecies) => void;
  handleAskDelete: (species: PlantSpecies) => void;
}

export default function SpeciesList({
  isLoading,
  speciesList,
  handleStartEdit,
  handleAskDelete,
}: SpeciesListProps) {
  return (
    <div className="table-body-scroll">
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
    </div>
  );
}
