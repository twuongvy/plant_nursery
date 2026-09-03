import { NavLink, Outlet } from "react-router-dom";
import { getApiBaseUrl } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { Button } from "./Button";

export function Layout() {
  const { email, role, isAdmin, logout } = useAuth();

  function handleLogout() {
    logout();
  }

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
          <Button
            type="button"
            variant="secondary"
            className={"text-center"}
            onClick={handleLogout}
          >
            Log out
          </Button>
        </div>
      </header>
      <main className="page">
        <Outlet />
      </main>
      <footer className="footer">
        API: <code>{getApiBaseUrl()}</code>
      </footer>
    </div>
  );
}
