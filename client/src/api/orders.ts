import api from './axios';

/**
 * Order API wrappers — keep HTTP details out of pages so components only
 * deal with domain data (and we can swap paths in one file).
 */

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
  status: string;
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
