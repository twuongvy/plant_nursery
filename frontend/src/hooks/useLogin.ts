import { useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { apiErrorMessage } from './api'

export function useLogin() {
  const { isAuthenticated, login } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const [isSigningIn, setIsSigningIn] = useState(false)

  async function signIn(email: string, password: string): Promise<boolean> {
    setError(null)
    setIsSigningIn(true)
    try {
      await login(email, password)
      return true
    } catch (err) {
      setError(apiErrorMessage(err, 'Login failed. Is the API running?'))
      return false
    } finally {
      setIsSigningIn(false)
    }
  }

  return { isAuthenticated, error, isSigningIn, signIn }
}
