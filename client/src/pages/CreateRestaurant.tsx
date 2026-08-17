import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { isAxiosError } from 'axios';
import { createRestaurant, getMyRestaurant } from '../api/restaurants';
import { useAuth } from '../context/AuthContext';
import './CreateRestaurant.css';

/**
 * DESIGN NOTES (CreateRestaurant)
 * -------------------------------
 * This page exists because a restaurant_admin's dashboard has nothing to
 * manage until a Restaurant document exists. ownerId is set server-side from
 * the JWT (never sent by the client) — so this form only ever creates a
 * restaurant owned by whoever is logged in.
 */
export function CreateRestaurant() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [cuisineType, setCuisineType] = useState('');
  const [address, setAddress] = useState('');
  const [isOpen, setIsOpen] = useState(true);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!user?.id) return;

    let cancelled = false;
    const userId = user.id;

    async function load() {
      setIsLoading(true);
      setError('');
      let shouldRedirect = false;
      try {
        const existing = await getMyRestaurant(userId);
        if (cancelled) return;
        if (existing) {
          shouldRedirect = true;
          navigate('/admin/restaurant', { replace: true });
          return;
        }
      } catch {
        if (!cancelled) {
          setError('Could not check for an existing restaurant.');
        }
      } finally {
        if (!cancelled && !shouldRedirect) {
          setIsLoading(false);
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [user?.id, navigate]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await createRestaurant({ name, cuisineType, address, isOpen });
      navigate('/admin/restaurant', { replace: true });
    } catch (err) {
      if (isAxiosError(err)) {
        setError(err.response?.data?.message ?? 'Could not create restaurant');
      } else {
        setError('Could not create restaurant');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="create-restaurant-page">
      {isLoading ? (
        <p className="create-restaurant-status">Loading…</p>
      ) : (
        <form className="create-restaurant-form" onSubmit={handleSubmit} noValidate>
          <h1 className="create-restaurant-title">Create restaurant</h1>
          <p className="create-restaurant-subtitle">
            Add your restaurant to start managing orders and the menu.
          </p>

          <div className="create-restaurant-field">
            <label htmlFor="name">Name</label>
            <input
              id="name"
              name="name"
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
            />
          </div>

          <div className="create-restaurant-field">
            <label htmlFor="cuisineType">Cuisine type</label>
            <input
              id="cuisineType"
              name="cuisineType"
              type="text"
              value={cuisineType}
              onChange={(event) => setCuisineType(event.target.value)}
              required
            />
          </div>

          <div className="create-restaurant-field">
            <label htmlFor="address">Address</label>
            <input
              id="address"
              name="address"
              type="text"
              value={address}
              onChange={(event) => setAddress(event.target.value)}
              required
            />
          </div>

          <div className="create-restaurant-checkbox">
            <input
              id="isOpen"
              name="isOpen"
              type="checkbox"
              checked={isOpen}
              onChange={(event) => setIsOpen(event.target.checked)}
            />
            <label htmlFor="isOpen">Open for orders</label>
          </div>

          {error ? (
            <p className="create-restaurant-error" role="alert">
              {error}
            </p>
          ) : null}

          <button
            className="create-restaurant-submit"
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating…' : 'Create restaurant'}
          </button>
        </form>
      )}
    </main>
  );
}
