import api from './axios';

/**
 * API wrappers live here (not in components) so endpoint paths and response
 * shapes have one home — easier to mock in tests and safer to rename routes
 * without grepping every page.
 */

export interface RestaurantOwner {
  _id: string;
  name: string;
  email: string;
}

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
  ownerId: RestaurantOwner;
}

export async function getRestaurants(): Promise<Restaurant[]> {
  const { data } = await api.get<Restaurant[]>('/restaurants');
  return data;
}

export async function getRestaurant(id: string): Promise<Restaurant> {
  const { data } = await api.get<Restaurant>(`/restaurants/${id}`);
  return data;
}

// There is no GET /restaurants/mine endpoint on the backend, so this filters
// the public list client-side using the populated ownerId — acceptable for a
// portfolio-scale dataset, but would need a real backend endpoint if the
// restaurant list ever grew large.
export async function getMyRestaurant(userId: string): Promise<Restaurant | null> {
  const restaurants = await getRestaurants();
  return restaurants.find((restaurant) => restaurant.ownerId._id === userId) ?? null;
}

export interface CreateRestaurantInput {
  name: string;
  cuisineType: string;
  address: string;
  isOpen?: boolean;
}

export async function createRestaurant(input: CreateRestaurantInput): Promise<Restaurant> {
  const { data } = await api.post<Restaurant>('/restaurants', input);
  return data;
}

export interface UpdateRestaurantInput {
  name?: string;
  cuisineType?: string;
  address?: string;
  isOpen?: boolean;
}

export async function updateRestaurant(id: string, input: UpdateRestaurantInput): Promise<Restaurant> {
  const { data } = await api.patch<Restaurant>(`/restaurants/${id}`, input);
  return data;
}

export interface AddMenuItemInput {
  itemName: string;
  price: number;
  isAvailable?: boolean;
}

export async function addMenuItem(restaurantId: string, input: AddMenuItemInput): Promise<Restaurant> {
  const { data } = await api.post<Restaurant>(`/restaurants/${restaurantId}/menu`, input);
  return data;
}

export interface UpdateMenuItemInput {
  itemName?: string;
  price?: number;
  isAvailable?: boolean;
}

export async function updateMenuItem(restaurantId: string, itemId: string, input: UpdateMenuItemInput): Promise<Restaurant> {
  const { data } = await api.patch<Restaurant>(`/restaurants/${restaurantId}/menu/${itemId}`, input);
  return data;
}
