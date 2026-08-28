import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { login as loginApi } from '../api/auth'
import {
  clearAuthSession,
  getStoredEmail,
  getStoredRole,
  getStoredToken,
  setAuthSession,
} from '../api/client'
import type { Role } from '../types'

interface AuthState {
  token: string | null
  role: Role | null
  email: string | null
}

interface AuthContextValue extends AuthState {
  isAuthenticated: boolean
  isAdmin: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

function readInitialAuth(): AuthState {
  const token = getStoredToken()
  const role = getStoredRole() as Role | null
  const email = getStoredEmail()
  return { token, role, email }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<AuthState>(readInitialAuth)

  const login = useCallback(async (email: string, password: string) => {
    const result = await loginApi({ email, password })
    setAuthSession(result.token, result.role, result.email)
    setAuth({
      token: result.token,
      role: result.role,
      email: result.email,
    })
  }, [])

  const logout = useCallback(() => {
    clearAuthSession()
    setAuth({ token: null, role: null, email: null })
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      ...auth,
      isAuthenticated: Boolean(auth.token),
      isAdmin: auth.role === 'Admin',
      login,
      logout,
    }),
    [auth, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return ctx
}
