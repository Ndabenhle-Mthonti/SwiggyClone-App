import { useEffect, useState } from 'react';
import { isAxiosError } from 'axios';
import { getAssignedOrders } from '../api/delivery';
import { updateOrderStatus, type Order } from '../api/orders';
import './AssignedOrders.css';

/**
 * DESIGN NOTES (AssignedOrders)
 * -----------------------------
 * This screen only shows one possible action (mark delivered) because
 * DELIVERY_PARTNER_TRANSITIONS on the backend gives 'out_for_delivery'
 * exactly one legal next state — unlike IncomingOrders on the restaurant
 * admin side, which had to branch on multiple possible statuses.
 */
export function AssignedOrders() {
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
        const data = await getAssignedOrders();
        if (!cancelled) {
          setOrders(data);
        }
      } catch {
        if (!cancelled) {
          setError('Could not load assigned orders.');
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

  async function handleMarkDelivered(orderId: string) {
    setError('');
    setUpdatingOrderId(orderId);
    try {
      await updateOrderStatus(orderId, 'delivered');
      setOrders((current) => current.filter((order) => order._id !== orderId));
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
    <main className="assigned-orders-page">
      <header className="assigned-orders-header">
        <p className="assigned-orders-eyebrow">Delivery partner</p>
        <h1>Assigned orders</h1>
      </header>

      {isLoading ? (
        <p className="assigned-orders-status">Loading orders…</p>
      ) : null}
      {error ? (
        <p className="assigned-orders-error" role="alert">
          {error}
        </p>
      ) : null}
      {!isLoading && orders.length === 0 ? (
        <p className="assigned-orders-status">No orders assigned right now</p>
      ) : null}

      {orders.length > 0 ? (
        <ul className="assigned-orders-list">
          {orders.map((order) => {
            const itemCount = order.items.reduce(
              (sum, item) => sum + item.quantity,
              0
            );

            return (
              <li key={order._id} className="assigned-orders-card">
                <div className="assigned-orders-card-top">
                  <h2>#{shortId(order._id)}</h2>
                </div>
                <p className="assigned-orders-meta">
                  R{order.totalAmount.toFixed(2)} · {itemCount}{' '}
                  {itemCount === 1 ? 'item' : 'items'}
                </p>
                <div className="assigned-orders-action">
                  <button
                    type="button"
                    className="assigned-orders-btn"
                    disabled={updatingOrderId === order._id}
                    onClick={() => void handleMarkDelivered(order._id)}
                  >
                    {updatingOrderId === order._id ? 'Updating…' : 'Mark delivered'}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      ) : null}
    </main>
  );
}

function shortId(id: string): string {
  return id.slice(-6);
}
