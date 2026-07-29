import { NextFunction, Request, Response } from 'express';

/**
 * DESIGN NOTES (authorize)
 * ------------------------
 * - authenticate answers "who are you?"; authorize answers "are you allowed?".
 * - Factory returns middleware so routes can say:
 *     authenticate, authorize('restaurant_admin')
 * - Must run AFTER authenticate — otherwise req.user is undefined and everyone
 *   gets 403 (or you'd have to special-case missing user here).
 */

export function authorize(...allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      // Defense in depth if someone forgot authenticate in the chain
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      // Authenticated but wrong role — 403 Forbidden, not 401
      return res.status(403).json({ message: 'Forbidden' });
    }

    return next();
  };
}
