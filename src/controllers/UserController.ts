import { Request, Response } from 'express';
import { Customer } from '../models/Customer';
import { DeliveryPartner } from '../models/DeliveryPartner';
import { RestaurantAdmin } from '../models/RestaurantAdmin';
import { generateToken, UserRole } from '../utils/jwt';

/**
 * DESIGN NOTES (UserController auth)
 * ----------------------------------
 * - One login endpoint, role picks the collection — keeps clients simple while
 *   still isolating customer / admin / partner documents.
 * - Always .select('+password') then comparePassword; never return the hash.
 * - Failed email OR password both yield the same 401 text so attackers can't
 *   enumerate which accounts exist.
 */

function isUserRole(value: unknown): value is UserRole {
  return (
    value === 'customer' ||
    value === 'restaurant_admin' ||
    value === 'delivery_partner'
  );
}

export class UserController {
  async login(req: Request, res: Response) {
    try {
      const { email, password, role } = req.body as {
        email?: string;
        password?: string;
        role?: string;
      };

      if (!email || !password || !isUserRole(role)) {
        return res.status(400).json({
          message: 'email, password, and a valid role are required',
        });
      }

      // password has select: false — opt back in only for this auth check
      // Branch per role so TS isn't stuck on a union of incompatible Model.findOne types
      const user =
        role === 'customer'
          ? await Customer.findOne({ email }).select('+password')
          : role === 'restaurant_admin'
            ? await RestaurantAdmin.findOne({ email }).select('+password')
            : await DeliveryPartner.findOne({ email }).select('+password');

      /**
       * Generic "invalid credentials" whether the user is missing OR the
       * password is wrong. Revealing "email not found" vs "wrong password"
       * lets attackers harvest registered emails (user enumeration).
       */
      if (!user || !(await user.comparePassword(password))) {
        return res.status(401).json({ message: 'invalid credentials' });
      }

      const token = generateToken({ id: user.id, role });

      return res.status(200).json({
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role,
        },
      });
    } catch (error) {
      console.error('Login failed:', error);
      return res.status(500).json({ message: 'Login failed' });
    }
  }
}

export default new UserController();
