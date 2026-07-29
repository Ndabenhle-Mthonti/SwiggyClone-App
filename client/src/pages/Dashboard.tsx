import { useAuth } from '../context/AuthContext';
import './Dashboard.css';

/**
 * DESIGN NOTES (Dashboard)
 * ------------------------
 * Intentionally minimal scaffold: prove auth + ProtectedRoute work. Role-specific
 * dashboards (menus, orders, delivery map) come in the next frontend phase.
 */
export function Dashboard() {
  const { user, logout } = useAuth();

  return (
    <main className="dashboard-page">
      <header className="dashboard-header">
        <div>
          <p className="dashboard-eyebrow">Signed in</p>
          <h1 className="dashboard-title">{user?.name ?? 'User'}</h1>
          <p className="dashboard-role">Role: {user?.role}</p>
        </div>
        <button className="dashboard-logout" type="button" onClick={logout}>
          Log out
        </button>
      </header>

      <section className="dashboard-card">
        <h2>Coming next</h2>
        <p>
          Role-specific dashboards for customers, restaurant admins, and delivery
          partners will land in a later phase.
        </p>
      </section>
    </main>
  );
}
