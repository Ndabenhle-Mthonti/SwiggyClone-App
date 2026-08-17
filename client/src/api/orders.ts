import api from './axios';

/**
 * Order API wrappers — keep HTTP details out of pages so components only
 * deal with domain data (and we can swap paths in one file).
 */

export type OrderStatus =
  | 'placed'
  | 'confirmed'
  | 'preparing'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled';

export interface OrderItemInput {
  menuItemId: string;
  quantity: number;
}

export interface Order {
  _id: string;
  customerId: string;
  restaurantId: string;
  deliveryPartnerId?: string | null;
  items: OrderItemInput[];
  status: OrderStatus;
  totalAmount: number;
  createdAt?: string;
  updatedAt?: string;
}

export async function createOrder(
  restaurantId: string,
  items: OrderItemInput[]
): Promise<Order> {
  const { data } = await api.post<Order>('/orders', { restaurantId, items });
  return data;
}

export async function getMyOrders(): Promise<Order[]> {
  const { data } = await api.get<Order[]>('/orders/mine');
  return data;
}

// The backend enforces which transitions are legal per role (e.g. restaurant_admin
// can only move placed → confirmed → preparing; delivery_partner only preparing →
// out_for_delivery → delivered). This function doesn't need to know the rules itself,
// since a disallowed transition is rejected by the API with a 400, and the calling
// UI should only ever show buttons for transitions that make sense for the current
// role and status.
export async function updateOrderStatus(orderId: string, status: OrderStatus): Promise<Order> {
  const { data } = await api.patch<Order>(`/orders/${orderId}/status`, { status });
  return data;
}
