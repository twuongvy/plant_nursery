import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { getMe, login as loginApi } from '../api/auth'
import {
  ApiError,
  clearAuthSession,
  getStoredEmail,
  getStoredRole,
  getStoredToken,
  setAuthSession,
  subscribeAuthLogout,
} from '../api/client'
import type { Role } from '../types'

function parseStoredRole(raw: string | null): Role | null {
  if (raw === 'Admin' || raw === 'User') return raw
  return null
}

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
  const role = parseStoredRole(getStoredRole())
  const email = getStoredEmail()
  return { token, role, email }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<AuthState>(readInitialAuth)

  async function login(email: string, password: string) {
    const result = await loginApi({ email, password })
    setAuthSession(result.token, result.role, result.email)
    setAuth({
      token: result.token,
      role: result.role,
      email: result.email,
    })
  }

  function logout() {
    clearAuthSession()
    setAuth({ token: null, role: null, email: null })
  }

  useEffect(() => subscribeAuthLogout(() => {
    setAuth({ token: null, role: null, email: null })
  }), [])

  useEffect(() => {
    const token = getStoredToken()
    if (!token) return

    let isCancelled = false
    ;(async () => {
      try {
        const me = await getMe()
        if (isCancelled) return
        setAuthSession(token, me.role, me.email)
        setAuth({ token, role: me.role, email: me.email })
      } catch (err) {
        if (isCancelled) return
        if (err instanceof ApiError && err.status === 401) {
          clearAuthSession()
          setAuth({ token: null, role: null, email: null })
        }
      }
    })()

    return () => {
      isCancelled = true
    }
  }, [])

  const authContextValue: AuthContextValue = {
    ...auth,
    isAuthenticated: Boolean(auth.token),
    isAdmin: auth.role === 'Admin',
    login,
    logout,
  }

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return ctx
}
