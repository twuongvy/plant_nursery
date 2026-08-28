import { apiFetch } from './client'
import type { LoginRequest, LoginResponse } from '../types'

export function login(payload: LoginRequest): Promise<LoginResponse> {
  return apiFetch<LoginResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}
