import api from './axios';

/**
 * API wrappers live here (not in components) so endpoint paths and response
 * shapes have one home — easier to mock in tests and safer to rename routes
 * without grepping every page.
 */

export interface MenuItem {
  _id: string;
  itemName: string;
  price: number;
  isAvailable: boolean;
}

export interface Restaurant {
  _id: string;
  name: string;
  cuisineType: string;
  address: string;
  isOpen: boolean;
  menu: MenuItem[];
}

export async function getRestaurants(): Promise<Restaurant[]> {
  const { data } = await api.get<Restaurant[]>('/restaurants');
  return data;
}

export async function getRestaurant(id: string): Promise<Restaurant> {
  const { data } = await api.get<Restaurant>(`/restaurants/${id}`);
  return data;
}
