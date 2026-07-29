import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { Order, OrderStatus } from '../models/Order';
import { Restaurant } from '../models/Restaurant';
import { getIO } from '../sockets/io';

const RESTAURANT_ADMIN_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  placed: ['confirmed'],
  confirmed: ['preparing'],
  preparing: [],
  out_for_delivery: [],
  delivered: [],
  cancelled: [],
};

const DELIVERY_PARTNER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  placed: [],
  confirmed: [],
  preparing: ['out_for_delivery'],
  out_for_delivery: ['delivered'],
  delivered: [],
  cancelled: [],
};

/**
 * DESIGN NOTES (OrderController)
 * ------------------------------
 * - Prices are calculated on the server from the restaurant's menu. Never trust
 *   a client-supplied `totalAmount` because clients are attacker-controlled.
 * - Role checks happen in middleware; ownership/resource checks still happen here
 *   when the action targets a specific restaurant or assigned delivery partner.
 * - The schema enum only says "these values exist". Transition rules here say
 *   "these values may follow one another" — that's business logic, not shape.
 * - Real-time: after save we emit to `order:<id>` via getIO(). Controllers are
 *   import-time singletons, so we cannot inject Server.io in the constructor;
 *   setIO()/getIO() is the shared handle that fits this pattern.
 */

function emitOrderStatusUpdated(order: {
  id: string;
  status: OrderStatus;
  updatedAt?: Date;
}) {
  getIO().to(`order:${order.id}`).emit('order:statusUpdated', {
    orderId: order.id,
    status: order.status,
    updatedAt: order.updatedAt ?? new Date(),
  });
}

export class OrderController {
  async createOrder(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const { restaurantId, items } = req.body as {
        restaurantId?: string;
        items?: Array<{ menuItemId?: string; quantity?: number }>;
      };

      if (!restaurantId || !Array.isArray(items) || items.length === 0) {
        return res
          .status(400)
          .json({ message: 'restaurantId and at least one item are required' });
      }

      const restaurant = await Restaurant.findById(restaurantId);
      if (!restaurant) {
        return res.status(404).json({ message: 'Restaurant not found' });
      }

      let totalAmount = 0;
      const normalizedItems: Array<{ menuItemId: string; quantity: number }> = [];

      for (const item of items) {
        if (!item.menuItemId || typeof item.quantity !== 'number' || item.quantity < 1) {
          return res
            .status(400)
            .json({ message: 'Each item must include menuItemId and quantity >= 1' });
        }

        const menuItem = restaurant.menu.find(
          (candidate) => candidate._id?.toString() === item.menuItemId
        );

        if (!menuItem) {
          return res
            .status(400)
            .json({ message: `Menu item ${item.menuItemId} does not exist` });
        }

        if (!menuItem.isAvailable) {
          return res
            .status(400)
            .json({ message: `Menu item ${menuItem.itemName} is not available` });
        }

        // Never accept totals from the client: price must come from current server data.
        totalAmount += menuItem.price * item.quantity;
        normalizedItems.push({
          menuItemId: item.menuItemId,
          quantity: item.quantity,
        });
      }

      const order = await Order.create({
        customerId: req.user.id,
        restaurantId,
        items: normalizedItems,
        totalAmount,
      });

      return res.status(201).json(order);
    } catch (error) {
      console.error('Create order failed:', error);
      return res.status(500).json({ message: 'Failed to create order' });
    }
  }

  async getMyOrders(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      if (req.user.role === 'customer') {
        const orders = await Order.find({ customerId: req.user.id });
        return res.status(200).json(orders);
      }

      if (req.user.role === 'restaurant_admin') {
        const restaurants = await Restaurant.find({ ownerId: req.user.id }).select('_id');
        const restaurantIds = restaurants.map((restaurant) => restaurant._id);
        const orders = await Order.find({ restaurantId: { $in: restaurantIds } });
        return res.status(200).json(orders);
      }

      const orders = await Order.find({ deliveryPartnerId: req.user.id });
      return res.status(200).json(orders);
    } catch (error) {
      console.error('Get my orders failed:', error);
      return res.status(500).json({ message: 'Failed to fetch orders' });
    }
  }

  async updateOrderStatus(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const { status } = req.body as { status?: OrderStatus };
      if (!status) {
        return res.status(400).json({ message: 'status is required' });
      }

      const order = await Order.findById(req.params.id);
      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }

      if (req.user.role === 'restaurant_admin') {
        const restaurant = await Restaurant.findById(order.restaurantId);
        if (!restaurant || restaurant.ownerId.toString() !== req.user.id) {
          // Role says "admin"; ownership says "admin of this restaurant".
          return res.status(403).json({ message: 'You can only manage orders for your restaurant' });
        }

        const allowedNext = RESTAURANT_ADMIN_TRANSITIONS[order.status] ?? [];
        /**
         * We enforce transitions here instead of trusting the enum because enum only
         * validates the target value is "real", not that the jump makes sense.
         * Example: "placed" -> "delivered" is a valid enum value but invalid workflow.
         */
        if (!allowedNext.includes(status)) {
          return res.status(400).json({
            message: `restaurant_admin cannot change status from ${order.status} to ${status}`,
          });
        }

        order.status = status;
        await order.save();
        emitOrderStatusUpdated(order as typeof order & { updatedAt?: Date });
        return res.status(200).json(order);
      }

      const allowedNext = DELIVERY_PARTNER_TRANSITIONS[order.status] ?? [];
      if (!allowedNext.includes(status)) {
        return res.status(400).json({
          message: `delivery_partner cannot change status from ${order.status} to ${status}`,
        });
      }

      // Resource check: a partner may only move orders they are handling.
      if (status === 'out_for_delivery') {
        if (
          order.deliveryPartnerId &&
          order.deliveryPartnerId.toString() !== req.user.id
        ) {
          return res.status(403).json({ message: 'Order is assigned to another delivery partner' });
        }
        // req.user.id is a string from the JWT; deliveryPartnerId is a Mongoose ObjectId.
        order.deliveryPartnerId = new Types.ObjectId(req.user.id);
      } else if (order.deliveryPartnerId?.toString() !== req.user.id) {
        return res
          .status(403)
          .json({ message: 'You can only update orders assigned to you' });
      }

      order.status = status;
      await order.save();
      emitOrderStatusUpdated(order as typeof order & { updatedAt?: Date });
      return res.status(200).json(order);
    } catch (error) {
      console.error('Update order status failed:', error);
      return res.status(500).json({ message: 'Failed to update order status' });
    }
  }
}

export default new OrderController();
