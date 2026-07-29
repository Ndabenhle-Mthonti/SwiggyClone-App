import { Server as SocketIOServer, Socket } from 'socket.io';
import { Order } from '../models/Order';
import { Restaurant } from '../models/Restaurant';
import { socketAuth } from './socketAuth';

/**
 * DESIGN NOTES (order rooms)
 * --------------------------
 * Room-per-order (`order:<id>`) is the right granularity: clients only receive
 * updates for orders they explicitly subscribed to *and* were authorized for —
 * not a global firehose of every order status/location change in the system.
 */

async function canSubscribeToOrder(
  user: { id: string; role: string },
  orderId: string
): Promise<boolean> {
  const order = await Order.findById(orderId);
  if (!order) return false;

  if (user.role === 'customer') {
    return order.customerId.toString() === user.id;
  }

  if (user.role === 'delivery_partner') {
    return order.deliveryPartnerId?.toString() === user.id;
  }

  if (user.role === 'restaurant_admin') {
    const restaurant = await Restaurant.findById(order.restaurantId);
    return restaurant?.ownerId.toString() === user.id;
  }

  return false;
}

export function initOrderSocket(io: SocketIOServer): void {
  // Same identity gate as HTTP authenticate, applied to every socket connection
  io.use(socketAuth);

  io.on('connection', (socket: Socket) => {
    const user = socket.data.user;
    console.log(
      `Socket connected: user=${user?.id ?? 'unknown'} role=${user?.role ?? 'unknown'}`
    );

    socket.on('order:subscribe', async (payload: { orderId?: string }) => {
      const orderId = payload?.orderId;
      if (!orderId || !user) {
        socket.emit('error', { message: 'orderId is required' });
        return;
      }

      // Resource check: JWT proves who you are; this proves you may watch *this* order.
      const allowed = await canSubscribeToOrder(user, orderId);
      if (!allowed) {
        socket.emit('error', {
          message: 'Not authorized to subscribe to this order',
        });
        return;
      }

      await socket.join(`order:${orderId}`);
      socket.emit('order:subscribed', { orderId });
    });
  });
}
