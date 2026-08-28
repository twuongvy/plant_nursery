import { apiFetch } from './client'
import type { PlantSpecies, SpeciesInput } from '../types'

export function listSpecies(): Promise<PlantSpecies[]> {
  return apiFetch<PlantSpecies[]>('/api/species')
}

export function createSpecies(payload: SpeciesInput): Promise<PlantSpecies> {
  return apiFetch<PlantSpecies>('/api/species', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateSpecies(id: number, payload: SpeciesInput): Promise<PlantSpecies> {
  return apiFetch<PlantSpecies>(`/api/species/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export function deleteSpecies(id: number): Promise<void> {
  return apiFetch<void>(`/api/species/${id}`, {
    method: 'DELETE',
  })
}
