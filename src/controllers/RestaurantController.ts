import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { Restaurant } from '../models/Restaurant';

/**
 * DESIGN NOTES (RestaurantController)
 * -----------------------------------
 * - `authorize('restaurant_admin')` only proves the caller has the right role.
 *   It does NOT prove they own this specific restaurant.
 * - Ownership checks are resource-based authorization: once we load the target
 *   restaurant, we compare `restaurant.ownerId` to `req.user.id` before writes.
 * - ownerId always comes from the authenticated user, never from client input.
 */
export class RestaurantController {
  async listRestaurants(_req: Request, res: Response) {
    try {
      const restaurants = await Restaurant.find().populate('ownerId', 'name email');
      return res.status(200).json(restaurants);
    } catch (error) {
      console.error('List restaurants failed:', error);
      return res.status(500).json({ message: 'Failed to fetch restaurants' });
    }
  }

  async getRestaurant(req: Request, res: Response) {
    try {
      const restaurant = await Restaurant.findById(req.params.id).populate(
        'ownerId',
        'name email'
      );

      if (!restaurant) {
        return res.status(404).json({ message: 'Restaurant not found' });
      }

      return res.status(200).json(restaurant);
    } catch (error) {
      console.error('Get restaurant failed:', error);
      return res.status(500).json({ message: 'Failed to fetch restaurant' });
    }
  }

  async createRestaurant(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const { name, cuisineType, address, isOpen, menu } = req.body as {
        name?: string;
        cuisineType?: string;
        address?: string;
        isOpen?: boolean;
        menu?: Array<{
          itemName: string;
          price: number;
          isAvailable?: boolean;
        }>;
      };

      if (!name || !cuisineType || !address) {
        return res
          .status(400)
          .json({ message: 'name, cuisineType, and address are required' });
      }

      const restaurant = await Restaurant.create({
        name,
        cuisineType,
        address,
        isOpen,
        menu: Array.isArray(menu) ? menu : [],
        // Never trust a client-supplied ownerId; the JWT is the source of truth.
        ownerId: req.user.id,
      });

      return res.status(201).json(restaurant);
    } catch (error) {
      console.error('Create restaurant failed:', error);
      return res.status(500).json({ message: 'Failed to create restaurant' });
    }
  }

  async updateRestaurant(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const restaurant = await Restaurant.findById(req.params.id);
      if (!restaurant) {
        return res.status(404).json({ message: 'Restaurant not found' });
      }

      // Role-based auth got us "restaurant_admin"; this enforces "their restaurant".
      if (restaurant.ownerId.toString() !== req.user.id) {
        return res.status(403).json({ message: 'You can only update your own restaurant' });
      }

      const { ownerId, menu, ...allowedUpdates } = req.body as Record<string, unknown>;
      void ownerId;
      void menu;

      Object.assign(restaurant, allowedUpdates);
      await restaurant.save();

      return res.status(200).json(restaurant);
    } catch (error) {
      console.error('Update restaurant failed:', error);
      return res.status(500).json({ message: 'Failed to update restaurant' });
    }
  }

  async addMenuItem(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const restaurant = await Restaurant.findById(req.params.id);
      if (!restaurant) {
        return res.status(404).json({ message: 'Restaurant not found' });
      }

      if (restaurant.ownerId.toString() !== req.user.id) {
        return res
          .status(403)
          .json({ message: 'You can only change the menu of your own restaurant' });
      }

      const { itemName, price, isAvailable } = req.body as {
        itemName?: string;
        price?: number;
        isAvailable?: boolean;
      };

      if (!itemName || typeof price !== 'number') {
        return res.status(400).json({ message: 'itemName and price are required' });
      }

      restaurant.menu.push({
        _id: new Types.ObjectId(),
        itemName,
        price,
        isAvailable: typeof isAvailable === 'boolean' ? isAvailable : true,
      });
      await restaurant.save();

      return res.status(201).json(restaurant);
    } catch (error) {
      console.error('Add menu item failed:', error);
      return res.status(500).json({ message: 'Failed to add menu item' });
    }
  }

  async updateMenuItem(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const restaurant = await Restaurant.findById(req.params.id);
      if (!restaurant) {
        return res.status(404).json({ message: 'Restaurant not found' });
      }

      if (restaurant.ownerId.toString() !== req.user.id) {
        return res
          .status(403)
          .json({ message: 'You can only change the menu of your own restaurant' });
      }

      const menuItem = restaurant.menu.find(
        (item) => item._id?.toString() === req.params.itemId
      );

      if (!menuItem) {
        return res.status(404).json({ message: 'Menu item not found' });
      }

      const { itemName, price, isAvailable } = req.body as {
        itemName?: string;
        price?: number;
        isAvailable?: boolean;
      };

      if (itemName !== undefined) menuItem.itemName = itemName;
      if (price !== undefined) menuItem.price = price;
      if (isAvailable !== undefined) menuItem.isAvailable = isAvailable;

      await restaurant.save();
      return res.status(200).json(restaurant);
    } catch (error) {
      console.error('Update menu item failed:', error);
      return res.status(500).json({ message: 'Failed to update menu item' });
    }
  }
}

export default new RestaurantController();
