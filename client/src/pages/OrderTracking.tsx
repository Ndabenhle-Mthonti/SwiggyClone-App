import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { io, type Socket } from 'socket.io-client';
import { getMyOrders } from '../api/orders';
import { useAuth } from '../context/AuthContext';
import './OrderTracking.css';

/**
 * DESIGN NOTES (OrderTracking)
 * ----------------------------
 * - Initial GET /orders/mine covers the common case: user just placed an order
 *   and navigated here before any socket event fired.
 * - Live updates come from the `order:<id>` room after order:subscribe.
 * - Cleanup disconnects the socket on unmount — without it, navigating away
 *   leaves open WebSocket connections (and duplicate listeners if they return).
 */
export function OrderTracking() {
  const { orderId } = useParams<{ orderId: string }>();
  const { token } = useAuth();

  const [status, setStatus] = useState<string>('Loading…');
  const [updatedAt, setUpdatedAt] = useState<string>('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!orderId || !token) return;

    let cancelled = false;

    async function loadInitialStatus() {
      setIsLoading(true);
      setError('');
      try {
        const orders = await getMyOrders();
        const order = orders.find((row) => row._id === orderId);
        if (cancelled) return;

        if (!order) {
          setError('Order not found.');
          setStatus('Unknown');
        } else {
          setStatus(order.status);
          setUpdatedAt(order.updatedAt ?? order.createdAt ?? '');
        }
      } catch {
        if (!cancelled) {
          setError('Could not load order status.');
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadInitialStatus();

    const socket: Socket = io(import.meta.env.VITE_API_URL, {
      auth: { token },
    });

    socket.on('connect', () => {
      socket.emit('order:subscribe', { orderId });
    });

    socket.on(
      'order:statusUpdated',
      (payload: { orderId: string; status: string; updatedAt?: string }) => {
        if (payload.orderId !== orderId) return;
        setStatus(payload.status);
        setUpdatedAt(payload.updatedAt ?? new Date().toISOString());
        setError('');
      }
    );

    socket.on('error', (payload: { message?: string }) => {
      setError(payload?.message ?? 'Socket error');
    });

    return () => {
      cancelled = true;
      // Tear down the socket so leaving /orders/:id does not leak connections.
      socket.disconnect();
    };
  }, [orderId, token]);

  return (
    <main className="order-tracking-page">
      <header className="order-tracking-header">
        <Link className="order-tracking-back" to="/restaurants">
          ← Browse restaurants
        </Link>
        <h1>Order tracking</h1>
        <p className="order-tracking-id">Order ID: {orderId}</p>
      </header>

      <section className="order-tracking-card">
        {isLoading ? <p className="order-tracking-status">Loading status…</p> : null}
        {error ? (
          <p className="order-tracking-error" role="alert">
            {error}
          </p>
        ) : null}
        {!isLoading ? (
          <>
            <p className="order-tracking-label">Current status</p>
            <p className="order-tracking-value">{formatStatus(status)}</p>
            {updatedAt ? (
              <p className="order-tracking-updated">
                Updated: {new Date(updatedAt).toLocaleString()}
              </p>
            ) : null}
          </>
        ) : null}
      </section>
    </main>
  );
}

function formatStatus(status: string): string {
  return status.replaceAll('_', ' ');
}
