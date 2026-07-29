import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getRestaurants, type Restaurant } from '../api/restaurants';
import './RestaurantList.css';

/**
 * DESIGN NOTES (RestaurantList)
 * -----------------------------
 * Fetch on mount only — restaurants are browsable catalog data. Loading/empty
 * states keep the UI honest instead of flashing a blank main while awaiting.
 */
export function RestaurantList() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError('');
      try {
        const data = await getRestaurants();
        if (!cancelled) {
          setRestaurants(data);
        }
      } catch {
        if (!cancelled) {
          setError('Could not load restaurants. Try again later.');
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="restaurant-list-page">
      <header className="restaurant-list-header">
        <div>
          <p className="restaurant-list-eyebrow">Customer</p>
          <h1>Restaurants</h1>
        </div>
        <Link className="restaurant-list-link" to="/dashboard">
          Dashboard
        </Link>
      </header>

      {isLoading ? <p className="restaurant-list-status">Loading restaurants…</p> : null}
      {error ? <p className="restaurant-list-error" role="alert">{error}</p> : null}

      {!isLoading && !error && restaurants.length === 0 ? (
        <p className="restaurant-list-status">No restaurants yet. Check back soon.</p>
      ) : null}

      <ul className="restaurant-list-grid">
        {restaurants.map((restaurant) => (
          <li key={restaurant._id}>
            <Link
              className="restaurant-card"
              to={`/restaurants/${restaurant._id}`}
            >
              <div className="restaurant-card-top">
                <h2>{restaurant.name}</h2>
                <span
                  className={
                    restaurant.isOpen
                      ? 'restaurant-badge restaurant-badge-open'
                      : 'restaurant-badge restaurant-badge-closed'
                  }
                >
                  {restaurant.isOpen ? 'Open' : 'Closed'}
                </span>
              </div>
              <p className="restaurant-cuisine">{restaurant.cuisineType}</p>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
