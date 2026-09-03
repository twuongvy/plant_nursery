import { useCallback, useEffect, useState } from 'react'
import {
  createSpecies,
  deleteSpecies,
  listSpecies,
  updateSpecies,
} from '../api/species'
import type { PlantSpecies, SpeciesInput } from '../types'
import { runApi } from './api'

export function useSpecies(options?: { enabled?: boolean }) {
  const enabled = options?.enabled ?? true
  const [speciesList, setSpeciesList] = useState<PlantSpecies[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(enabled)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const reload = useCallback(async () => {
    if (!enabled) return
    setIsLoading(true)
    setError(null)
    const result = await runApi(listSpecies, 'Failed to load species.')
    if (!result.ok) {
      setError(result.error)
    } else {
      setSpeciesList(result.data)
    }
    setIsLoading(false)
  }, [enabled])

  useEffect(() => {
    void reload()
  }, [reload])

  async function saveSpecies(
    payload: SpeciesInput,
    speciesId?: number,
  ): Promise<boolean> {
    setIsSaving(true)
    setError(null)
    const result = await runApi(
      () =>
        speciesId != null
          ? updateSpecies(speciesId, payload)
          : createSpecies(payload),
      'Save failed.',
    )
    if (!result.ok) {
      setError(result.error)
      setIsSaving(false)
      return false
    }
    await reload()
    setIsSaving(false)
    return true
  }

  async function removeSpecies(speciesId: number): Promise<boolean> {
    setIsDeleting(true)
    setError(null)
    const result = await runApi(
      () => deleteSpecies(speciesId),
      'Delete failed.',
    )
    if (!result.ok) {
      setError(result.error)
      setIsDeleting(false)
      return false
    }
    await reload()
    setIsDeleting(false)
    return true
  }

  return {
    speciesList,
    error,
    isLoading,
    isSaving,
    isDeleting,
    saveSpecies,
    removeSpecies,
  }
}
