import { Router } from 'express';
import DeliveryController from '../controllers/DeliveryController';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';

class DeliveryRouter {
  public router: Router;

  constructor() {
    this.router = Router();
    this.getRoutes();
    this.postRoutes();
    this.patchRoutes();
    this.putRoutes();
    this.deleteRoutes();
  }

  getRoutes() {
    this.router.get(
      '/assigned',
      authenticate,
      authorize('delivery_partner'),
      (req, res) => DeliveryController.getAssignedOrders(req, res)
    );
  }

  postRoutes() {}

  patchRoutes() {
    this.router.patch(
      '/availability',
      authenticate,
      authorize('delivery_partner'),
      (req, res) => DeliveryController.updateAvailability(req, res)
    );
    this.router.patch(
      '/location',
      authenticate,
      authorize('delivery_partner'),
      (req, res) => DeliveryController.updateLocation(req, res)
    );
  }

  putRoutes() {}

  deleteRoutes() {}
}

export default new DeliveryRouter().router;
