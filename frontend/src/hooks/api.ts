import { ApiError } from '../api/client'

export function apiErrorMessage(err: unknown, fallback: string): string {
  return err instanceof ApiError ? err.message : fallback
}

export async function runApi<T>(
  request: () => Promise<T>,
  fallback: string,
): Promise<{ ok: true; data: T } | { ok: false; error: string }> {
  try {
    return { ok: true, data: await request() }
  } catch (err) {
    return { ok: false, error: apiErrorMessage(err, fallback) }
  }
}
