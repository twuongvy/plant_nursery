import type { ApiErrorBody } from '../types'

const API_BASE = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '')
  || 'http://localhost:5247'

const TOKEN_KEY = 'nursery_token'
const ROLE_KEY = 'nursery_role'
const EMAIL_KEY = 'nursery_email'

export function getApiBaseUrl(): string {
  return API_BASE
}

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function getStoredRole(): string | null {
  return localStorage.getItem(ROLE_KEY)
}

export function getStoredEmail(): string | null {
  return localStorage.getItem(EMAIL_KEY)
}

export function setAuthSession(token: string, role: string, email: string): void {
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(ROLE_KEY, role)
  localStorage.setItem(EMAIL_KEY, email)
}

export function clearAuthSession(): void {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(ROLE_KEY)
  localStorage.removeItem(EMAIL_KEY)
}

export class ApiError extends Error {
  status: number
  body: ApiErrorBody | null

  constructor(status: number, message: string, body: ApiErrorBody | null = null) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.body = body
  }
}

function messageFromBody(body: ApiErrorBody | null, fallback: string): string {
  if (!body) return fallback
  if (body.message) return body.message
  if (body.detail) return body.detail
  if (body.title) return body.title
  if (body.errors) {
    const parts = Object.entries(body.errors).flatMap(([key, msgs]) =>
      (msgs as string[]).map((m) => `${key}: ${m}`),
    )
    if (parts.length) return parts.join('; ')
  }
  return fallback
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers = new Headers(options.headers)
  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json')
  }

  const token = getStoredToken()
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  })

  if (response.status === 204) {
    return undefined as T
  }

  const text = await response.text()
  let parsed: unknown = null
  if (text) {
    try {
      parsed = JSON.parse(text)
    } catch {
      parsed = null
    }
  }

  if (!response.ok) {
    const body = (parsed as ApiErrorBody | null) ?? null
    throw new ApiError(
      response.status,
      messageFromBody(body, `Request failed (${response.status})`),
      body,
    )
  }

  return parsed as T
}
