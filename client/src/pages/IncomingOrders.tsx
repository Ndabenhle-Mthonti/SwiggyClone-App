import { useEffect, useState } from 'react';
import { isAxiosError } from 'axios';
import {
  getMyOrders,
  updateOrderStatus,
  type Order,
  type OrderStatus,
} from '../api/orders';
import './IncomingOrders.css';

/**
 * DESIGN NOTES (IncomingOrders)
 * -----------------------------
 * The button-visibility mapping here is deliberately "what should the UI
 * offer right now" and not a re-implementation of RESTAURANT_ADMIN_TRANSITIONS
 * from the backend — the backend remains the actual authority and will reject
 * an illegal transition regardless of what the UI shows, so this mapping only
 * needs to be a reasonable UX guess, not a security boundary.
 */
export function IncomingOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError('');
      try {
        const data = await getMyOrders();
        if (!cancelled) {
          setOrders(data);
        }
      } catch {
        if (!cancelled) {
          setError('Could not load incoming orders.');
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

  async function handleUpdateStatus(orderId: string, status: OrderStatus) {
    setError('');
    setUpdatingOrderId(orderId);
    try {
      const updated = await updateOrderStatus(orderId, status);
      setOrders((current) =>
        current.map((order) => (order._id === updated._id ? updated : order))
      );
    } catch (err) {
      if (isAxiosError(err)) {
        setError(err.response?.data?.message ?? 'Could not update order status');
      } else {
        setError('Could not update order status');
      }
    } finally {
      setUpdatingOrderId(null);
    }
  }

  return (
    <main className="incoming-orders-page">
      <header className="incoming-orders-header">
        <p className="incoming-orders-eyebrow">Restaurant admin</p>
        <h1>Incoming orders</h1>
      </header>

      {isLoading ? (
        <p className="incoming-orders-status">Loading orders…</p>
      ) : null}
      {error ? (
        <p className="incoming-orders-error" role="alert">
          {error}
        </p>
      ) : null}
      {!isLoading && orders.length === 0 ? (
        <p className="incoming-orders-status">No orders yet.</p>
      ) : null}

      <ul className="incoming-orders-list">
        {orders.map((order) => {
          const itemCount = order.items.reduce(
            (sum, item) => sum + item.quantity,
            0
          );

          return (
            <li
              key={order._id}
              className={`incoming-orders-card incoming-orders-card-${statusSlug(order.status)}`}
            >
              <div className="incoming-orders-card-top">
                <h2>#{shortId(order._id)}</h2>
                <span
                  className={`incoming-orders-badge incoming-orders-badge-${statusSlug(order.status)}`}
                >
                  {formatStatus(order.status)}
                </span>
              </div>
              <p className="incoming-orders-meta">
                R{order.totalAmount.toFixed(2)} · {itemCount}{' '}
                {itemCount === 1 ? 'item' : 'items'}
              </p>
              <div className="incoming-orders-action">
                {order.status === 'placed' ? (
                  <button
                    type="button"
                    className="incoming-orders-btn"
                    disabled={updatingOrderId === order._id}
                    onClick={() => void handleUpdateStatus(order._id, 'confirmed')}
                  >
                    {updatingOrderId === order._id ? 'Updating…' : 'Confirm order'}
                  </button>
                ) : null}
                {order.status === 'confirmed' ? (
                  <button
                    type="button"
                    className="incoming-orders-btn"
                    disabled={updatingOrderId === order._id}
                    onClick={() => void handleUpdateStatus(order._id, 'preparing')}
                  >
                    {updatingOrderId === order._id ? 'Updating…' : 'Start preparing'}
                  </button>
                ) : null}
                {order.status === 'preparing' ? (
                  <p className="incoming-orders-waiting">
                    Waiting for delivery pickup
                  </p>
                ) : null}
                {order.status !== 'placed' &&
                order.status !== 'confirmed' &&
                order.status !== 'preparing' ? (
                  <p className="incoming-orders-status-text">
                    {formatStatus(order.status)}
                  </p>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
    </main>
  );
}

function shortId(id: string): string {
  return id.slice(-6);
}

function formatStatus(status: OrderStatus): string {
  return status.replaceAll('_', ' ');
}

function statusSlug(status: OrderStatus): string {
  return status.replaceAll('_', '-');
}
