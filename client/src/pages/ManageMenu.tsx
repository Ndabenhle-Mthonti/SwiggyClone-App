import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { isAxiosError } from 'axios';
import {
  addMenuItem,
  getMyRestaurant,
  updateMenuItem,
  type Restaurant,
} from '../api/restaurants';
import { useAuth } from '../context/AuthContext';
import './ManageMenu.css';

/**
 * DESIGN NOTES (ManageMenu)
 * -------------------------
 * After any add/update call, we update state directly from that call's
 * response (the backend returns the whole updated restaurant document)
 * rather than re-fetching the entire restaurant from scratch — fewer
 * network calls, and it's the same "trust the response you just got"
 * pattern used in AuthContext after login.
 */
export function ManageMenu() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [itemName, setItemName] = useState('');
  const [price, setPrice] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [updatingItemId, setUpdatingItemId] = useState<string | null>(null);

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
        if (!existing) {
          shouldRedirect = true;
          navigate('/admin/create-restaurant', { replace: true });
          return;
        }
        setRestaurant(existing);
      } catch {
        if (!cancelled) {
          setError('Could not load your restaurant.');
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

  async function handleToggleAvailable(itemId: string, isAvailable: boolean) {
    if (!restaurant) return;

    setError('');
    setUpdatingItemId(itemId);
    try {
      const updated = await updateMenuItem(restaurant._id, itemId, {
        isAvailable: !isAvailable,
      });
      setRestaurant(updated);
    } catch (err) {
      if (isAxiosError(err)) {
        setError(err.response?.data?.message ?? 'Could not update menu item');
      } else {
        setError('Could not update menu item');
      }
    } finally {
      setUpdatingItemId(null);
    }
  }

  async function handleAddItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!restaurant) return;

    setError('');
    setIsAdding(true);
    try {
      const updated = await addMenuItem(restaurant._id, {
        itemName,
        price: Number(price),
      });
      setRestaurant(updated);
      setItemName('');
      setPrice('');
    } catch (err) {
      if (isAxiosError(err)) {
        setError(err.response?.data?.message ?? 'Could not add menu item');
      } else {
        setError('Could not add menu item');
      }
    } finally {
      setIsAdding(false);
    }
  }

  return (
    <main className="manage-menu-page">
      <header className="manage-menu-header">
        {isLoading ? <p className="manage-menu-status">Loading…</p> : null}
        {error ? (
          <p className="manage-menu-error" role="alert">
            {error}
          </p>
        ) : null}
        {restaurant ? <h1>{restaurant.name}</h1> : null}
      </header>

      {restaurant ? (
        <div className="manage-menu-layout">
          <section className="manage-menu-card" aria-label="Menu">
            <h2>Menu</h2>
            {restaurant.menu.length === 0 ? (
              <p className="manage-menu-status">No menu items yet.</p>
            ) : (
              <ul className="manage-menu-list">
                {restaurant.menu.map((item) => (
                  <li key={item._id} className="manage-menu-item">
                    <div>
                      <h3>{item.itemName}</h3>
                      <p className="manage-menu-price">R{item.price.toFixed(2)}</p>
                    </div>
                    <label className="manage-menu-toggle">
                      <input
                        type="checkbox"
                        checked={item.isAvailable}
                        disabled={updatingItemId === item._id}
                        onChange={() =>
                          void handleToggleAvailable(item._id, item.isAvailable)
                        }
                      />
                      Available
                    </label>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <form
            className="manage-menu-card"
            onSubmit={handleAddItem}
            noValidate
            aria-label="Add menu item"
          >
            <h2>Add menu item</h2>
            <div className="manage-menu-field">
              <label htmlFor="itemName">Item name</label>
              <input
                id="itemName"
                name="itemName"
                type="text"
                value={itemName}
                onChange={(event) => setItemName(event.target.value)}
                required
              />
            </div>
            <div className="manage-menu-field">
              <label htmlFor="price">Price</label>
              <input
                id="price"
                name="price"
                type="number"
                min="0"
                step="0.01"
                value={price}
                onChange={(event) => setPrice(event.target.value)}
                required
              />
            </div>
            <button
              className="manage-menu-submit"
              type="submit"
              disabled={isAdding}
            >
              {isAdding ? 'Adding…' : 'Add menu item'}
            </button>
          </form>
        </div>
      ) : null}
    </main>
  );
}
