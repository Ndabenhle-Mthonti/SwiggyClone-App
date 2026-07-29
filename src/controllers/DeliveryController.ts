import { Request, Response } from 'express';
import { DeliveryPartner } from '../models/DeliveryPartner';
import { Order } from '../models/Order';
import { getIO } from '../sockets/io';

/**
 * DESIGN NOTES (DeliveryController)
 * ---------------------------------
 * - Route middleware proves the caller is a delivery partner.
 * - Controllers still scope every write/read to `req.user.id` so partners can
 *   only change their own availability/location and only read their assignments.
 * - Location pushes go to each active `order:<id>` room so only subscribers of
 *   those deliveries see the rider move — not every connected client.
 */
export class DeliveryController {
  async updateAvailability(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const partner = await DeliveryPartner.findById(req.user.id);
      if (!partner) {
        return res.status(404).json({ message: 'Delivery partner not found' });
      }

      partner.isAvailable = !partner.isAvailable;
      await partner.save();

      return res.status(200).json({
        id: partner.id,
        isAvailable: partner.isAvailable,
      });
    } catch (error) {
      console.error('Update availability failed:', error);
      return res.status(500).json({ message: 'Failed to update availability' });
    }
  }

  async updateLocation(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const { lat, lng } = req.body as { lat?: number; lng?: number };
      if (typeof lat !== 'number' || typeof lng !== 'number') {
        return res.status(400).json({ message: 'lat and lng must be numbers' });
      }

      const partner = await DeliveryPartner.findById(req.user.id);
      if (!partner) {
        return res.status(404).json({ message: 'Delivery partner not found' });
      }

      partner.currentLocation = { lat, lng };
      await partner.save();

      // Fan out only to orders this partner is actively delivering
      const activeOrders = await Order.find({
        deliveryPartnerId: req.user.id,
        status: 'out_for_delivery',
      }).select('_id');

      const io = getIO();
      for (const order of activeOrders) {
        io.to(`order:${order.id}`).emit('order:locationUpdated', {
          orderId: order.id,
          lat,
          lng,
        });
      }

      return res.status(200).json({
        id: partner.id,
        currentLocation: partner.currentLocation,
      });
    } catch (error) {
      console.error('Update location failed:', error);
      return res.status(500).json({ message: 'Failed to update location' });
    }
  }

  async getAssignedOrders(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const orders = await Order.find({
        deliveryPartnerId: req.user.id,
        status: 'out_for_delivery',
      });

      return res.status(200).json(orders);
    } catch (error) {
      console.error('Get assigned orders failed:', error);
      return res.status(500).json({ message: 'Failed to fetch assigned orders' });
    }
  }
}

export default new DeliveryController();
