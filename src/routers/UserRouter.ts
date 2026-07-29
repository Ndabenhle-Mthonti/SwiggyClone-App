import { Router } from 'express';
import UserController from '../controllers/UserController';

class UserRouter {
  public router: Router;

  constructor() {
    this.router = Router();
    this.getRoutes();
    this.postRoutes();
    this.patchRoutes();
    this.putRoutes();
    this.deleteRoutes();
  }

  getRoutes() {}

  postRoutes() {
    // POST so credentials live in the body (never on a GET query string / logs)
    this.router.post('/login', (req, res) => UserController.login(req, res));
  }

  patchRoutes() {}

  putRoutes() {}

  deleteRoutes() {}
}

export default new UserRouter().router;
