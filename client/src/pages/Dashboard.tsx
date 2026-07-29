import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Dashboard.css';

/**
 * DESIGN NOTES (Dashboard)
 * ------------------------
 * Customer gets a clear path into /restaurants — role-specific home for admins
 * and partners still comes later; we only unlock the customer browse flow now.
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
        {user?.role === 'customer' ? (
          <>
            <h2>Order food</h2>
            <p>Browse restaurants, build a cart, and track your order live.</p>
            <Link className="dashboard-cta" to="/restaurants">
              Browse restaurants
            </Link>
          </>
        ) : (
          <>
            <h2>Coming next</h2>
            <p>
              Role-specific dashboards for restaurant admins and delivery partners
              will land in a later phase.
            </p>
          </>
        )}
      </section>
    </main>
  );
}
