import { Router } from 'express';
import RestaurantController from '../controllers/RestaurantController';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';

class RestaurantRouter {
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
    this.router.get('/', (req, res) => RestaurantController.listRestaurants(req, res));
    this.router.get('/:id', (req, res) => RestaurantController.getRestaurant(req, res));
  }

  postRoutes() {
    this.router.post(
      '/',
      authenticate,
      authorize('restaurant_admin'),
      (req, res) => RestaurantController.createRestaurant(req, res)
    );
    this.router.post(
      '/:id/menu',
      authenticate,
      authorize('restaurant_admin'),
      (req, res) => RestaurantController.addMenuItem(req, res)
    );
  }

  patchRoutes() {
    this.router.patch(
      '/:id',
      authenticate,
      authorize('restaurant_admin'),
      (req, res) => RestaurantController.updateRestaurant(req, res)
    );
    this.router.patch(
      '/:id/menu/:itemId',
      authenticate,
      authorize('restaurant_admin'),
      (req, res) => RestaurantController.updateMenuItem(req, res)
    );
  }

  putRoutes() {}

  deleteRoutes() {}
}

export default new RestaurantRouter().router;
