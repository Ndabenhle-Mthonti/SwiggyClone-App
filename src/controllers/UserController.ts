import { Request, Response } from 'express';

export class UserController {
  login(req: Request, res: Response) {
    console.log(req.query);
    const data = [{ name: 'Mthonti' }];
    res.status(200).send(data);
  }
}

export default new UserController();
