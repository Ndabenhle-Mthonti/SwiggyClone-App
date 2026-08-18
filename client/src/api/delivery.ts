import api from './axios';
import type { Order } from './orders';

/**
 * Delivery API wrappers — keep HTTP details out of pages so components only
 * deal with domain data (and we can swap paths in one file).
 */

export interface DeliveryLocation {
  lat: number;
  lng: number;
}

export interface AvailabilityResponse {
  id: string;
  isAvailable: boolean;
}

// The backend flips isAvailable rather than accepting a target value — it's a
// toggle endpoint, not a set endpoint, so the frontend calls it once per click
// and trusts whatever boolean comes back in the response.
export async function toggleAvailability(): Promise<AvailabilityResponse> {
  const { data } = await api.post<AvailabilityResponse>('/delivery/availability');
  return data;
}

export interface LocationResponse {
  id: string;
  currentLocation: DeliveryLocation;
}

export async function updateLocation(lat: number, lng: number): Promise<LocationResponse> {
  const { data } = await api.post<LocationResponse>('/delivery/location', { lat, lng });
  return data;
}

// The backend already scopes this to orders where deliveryPartnerId matches the
// logged-in partner AND status is 'out_for_delivery' — so the frontend receives
// exactly the right list with no client-side filtering needed.
export async function getAssignedOrders(): Promise<Order[]> {
  const { data } = await api.get<Order[]>('/delivery/orders');
  return data;
}
