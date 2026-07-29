import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { isAxiosError } from 'axios';
import { createOrder } from '../api/orders';
import { getRestaurant, type Restaurant } from '../api/restaurants';
import { useCart } from '../context/CartContext';
import './RestaurantDetail.css';

/**
 * DESIGN NOTES (RestaurantDetail)
 * -------------------------------
 * Cart UI only for *this* restaurant's items — if the shared cart belongs to
 * another place, we still show the menu but Place order stays tied to matching
 * restaurantId so we never POST a mismatched order.
 */
export function RestaurantDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    restaurantId,
    items,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    total,
  } = useCart();

  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [cartMessage, setCartMessage] = useState('');
  const [isPlacing, setIsPlacing] = useState(false);

  useEffect(() => {
    if (!id) return;

    let cancelled = false;
    const restaurantIdParam = id;

    async function load() {
      setIsLoading(true);
      setError('');
      try {
        const data = await getRestaurant(restaurantIdParam);
        if (!cancelled) {
          setRestaurant(data);
        }
      } catch {
        if (!cancelled) {
          setError('Could not load this restaurant.');
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
  }, [id]);

  const cartBelongsHere = Boolean(id && restaurantId === id && items.length > 0);

  async function handlePlaceOrder() {
    if (!id || !cartBelongsHere) return;

    setIsPlacing(true);
    setCartMessage('');
    try {
      const order = await createOrder(
        id,
        items.map((item) => ({
          menuItemId: item.menuItemId,
          quantity: item.quantity,
        }))
      );
      clearCart();
      navigate(`/orders/${order._id}`);
    } catch (err) {
      if (isAxiosError(err)) {
        setCartMessage(err.response?.data?.message ?? 'Could not place order');
      } else {
        setCartMessage('Could not place order');
      }
    } finally {
      setIsPlacing(false);
    }
  }

  return (
    <main className="restaurant-detail-page">
      <header className="restaurant-detail-header">
        <Link className="restaurant-detail-back" to="/restaurants">
          ← All restaurants
        </Link>
        {isLoading ? <p className="restaurant-detail-status">Loading…</p> : null}
        {error ? (
          <p className="restaurant-detail-error" role="alert">
            {error}
          </p>
        ) : null}
        {restaurant ? (
          <div>
            <h1>{restaurant.name}</h1>
            <p className="restaurant-detail-meta">
              {restaurant.cuisineType} · {restaurant.address}
            </p>
          </div>
        ) : null}
      </header>

      {restaurant ? (
        <div className="restaurant-detail-layout">
          <section className="restaurant-menu" aria-label="Menu">
            <h2>Menu</h2>
            <ul className="restaurant-menu-list">
              {restaurant.menu.map((item) => (
                <li key={item._id} className="restaurant-menu-item">
                  <div>
                    <h3>{item.itemName}</h3>
                    <p className="restaurant-menu-price">
                      R{item.price.toFixed(2)}
                      {!item.isAvailable ? ' · Unavailable' : ''}
                    </p>
                  </div>
                  {item.isAvailable ? (
                    <button
                      type="button"
                      className="restaurant-add-btn"
                      onClick={() => {
                        const ok = addItem(restaurant._id, {
                          menuItemId: item._id,
                          itemName: item.itemName,
                          price: item.price,
                        });
                        setCartMessage(
                          ok
                            ? ''
                            : 'Cart has items from another restaurant. Clear it first to switch.'
                        );
                      }}
                    >
                      Add to cart
                    </button>
                  ) : (
                    <span className="restaurant-unavailable">Unavailable</span>
                  )}
                </li>
              ))}
            </ul>
            {restaurant.menu.length === 0 ? (
              <p className="restaurant-detail-status">No menu items yet.</p>
            ) : null}
          </section>

          <aside className="restaurant-cart" aria-label="Cart">
            <h2>Your cart</h2>
            {!cartBelongsHere ? (
              <p className="restaurant-detail-status">
                {items.length > 0
                  ? 'Cart belongs to another restaurant.'
                  : 'Add items to get started.'}
              </p>
            ) : (
              <>
                <ul className="restaurant-cart-list">
                  {items.map((item) => (
                    <li key={item.menuItemId} className="restaurant-cart-row">
                      <div>
                        <p className="restaurant-cart-name">{item.itemName}</p>
                        <p className="restaurant-cart-line">
                          R{(item.price * item.quantity).toFixed(2)}
                        </p>
                      </div>
                      <div className="restaurant-cart-controls">
                        <button
                          type="button"
                          onClick={() =>
                            updateQuantity(item.menuItemId, item.quantity - 1)
                          }
                        >
                          −
                        </button>
                        <span>{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() =>
                            updateQuantity(item.menuItemId, item.quantity + 1)
                          }
                        >
                          +
                        </button>
                        <button
                          type="button"
                          className="restaurant-cart-remove"
                          onClick={() => removeItem(item.menuItemId)}
                        >
                          Remove
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
                <p className="restaurant-cart-total">Total: R{total.toFixed(2)}</p>
                <button
                  type="button"
                  className="restaurant-place-btn"
                  disabled={isPlacing}
                  onClick={() => void handlePlaceOrder()}
                >
                  {isPlacing ? 'Placing…' : 'Place order'}
                </button>
                <button
                  type="button"
                  className="restaurant-clear-btn"
                  onClick={clearCart}
                >
                  Clear cart
                </button>
              </>
            )}
            {cartMessage ? (
              <p className="restaurant-detail-error" role="alert">
                {cartMessage}
              </p>
            ) : null}
          </aside>
        </div>
      ) : null}
    </main>
  );
}
