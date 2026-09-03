import { useState, type FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Button } from '../components/Button'
import { ErrorBanner } from '../components/ErrorBanner'
import { useLogin } from '../hooks/useLogin'

function redirectPathFromState(state: unknown): string {
  if (
    typeof state !== 'object' ||
    state === null ||
    !('from' in state) ||
    typeof state.from !== 'string'
  ) {
    return '/'
  }
  const from = state.from
  if (!from.startsWith('/') || from.startsWith('//')) return '/'
  return from
}

export function LoginPage() {
  const { isAuthenticated, error, isSigningIn, signIn } = useLogin()
  const navigate = useNavigate()
  const location = useLocation()
  const from = redirectPathFromState(location.state)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  if (isAuthenticated) {
    return <Navigate to={from} replace />
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const didSignIn = await signIn(email.trim(), password)
    if (didSignIn) {
      navigate(from, { replace: true })
    }
  }

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={handleSubmit}>
        <h1>Plant Nursery</h1>
        <p className="muted">Sign in to manage batches and watering.</p>
        <ErrorBanner message={error} />
        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="username"
          />
        </label>
        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
        </label>
        <Button type="submit" disabled={isSigningIn}>
          {isSigningIn ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>
    </div>
  )
}
