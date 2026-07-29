import { Router } from 'express';
import OrderController from '../controllers/OrderController';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';

class OrderRouter {
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
    this.router.get('/mine', authenticate, (req, res) =>
      OrderController.getMyOrders(req, res)
    );
  }

  postRoutes() {
    this.router.post('/', authenticate, authorize('customer'), (req, res) =>
      OrderController.createOrder(req, res)
    );
  }

  patchRoutes() {
    this.router.patch(
      '/:id/status',
      authenticate,
      authorize('restaurant_admin', 'delivery_partner'),
      (req, res) => OrderController.updateOrderStatus(req, res)
    );
  }

  putRoutes() {}

  deleteRoutes() {}
}

export default new OrderRouter().router;
