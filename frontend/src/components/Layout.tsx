import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { getApiBaseUrl } from '../api/client'

export function Layout() {
  const { email, role, isAdmin, logout } = useAuth()

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">Plant Nursery</div>
        <nav className="nav">
          <NavLink to="/" end>
            Dashboard
          </NavLink>
          {isAdmin && <NavLink to="/species">Species</NavLink>}
          <NavLink to="/batches">Batches</NavLink>
          <NavLink to="/watering">Watering</NavLink>
        </nav>
        <div className="user-meta">
          <span>
            {email} ({role})
          </span>
          <button type="button" className="btn btn-secondary" onClick={logout}>
            Log out
          </button>
        </div>
      </header>
      <main className="page">
        <Outlet />
      </main>
      <footer className="footer">
        API: <code>{getApiBaseUrl()}</code>
      </footer>
    </div>
  )
}
