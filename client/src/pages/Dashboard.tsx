import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getMyRestaurant } from '../api/restaurants';
import { useAuth } from '../context/AuthContext';
import './Dashboard.css';

/**
 * DESIGN NOTES (Dashboard)
 * ------------------------
 * Customer gets a clear path into /restaurants. Restaurant admins get manage
 * or create depending on whether getMyRestaurant finds an owned restaurant;
 * delivery partner home still comes later.
 */
export function Dashboard() {
  const { user, logout } = useAuth();
  const [hasRestaurant, setHasRestaurant] = useState<boolean | null>(null);
  const [isCheckingRestaurant, setIsCheckingRestaurant] = useState(false);

  useEffect(() => {
    if (user?.role !== 'restaurant_admin' || !user.id) return;

    let cancelled = false;
    const userId = user.id;

    async function load() {
      setIsCheckingRestaurant(true);
      try {
        const existing = await getMyRestaurant(userId);
        if (!cancelled) {
          setHasRestaurant(existing !== null);
        }
      } catch {
        if (!cancelled) {
          setHasRestaurant(false);
        }
      } finally {
        if (!cancelled) {
          setIsCheckingRestaurant(false);
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [user?.id, user?.role]);

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
        ) : user?.role === 'restaurant_admin' ? (
          <>
            <h2>Manage your restaurant</h2>
            {isCheckingRestaurant ? (
              <p>Checking your restaurant…</p>
            ) : (
              <div className="dashboard-links">
                <Link
                  className="dashboard-cta"
                  to={hasRestaurant ? '/admin/restaurant' : '/admin/create-restaurant'}
                >
                  {hasRestaurant ? 'Manage menu' : 'Create restaurant'}
                </Link>
                <Link className="dashboard-cta" to="/admin/orders">
                  Incoming orders
                </Link>
              </div>
            )}
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
