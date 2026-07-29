import { NextFunction, Request, Response } from 'express';
import { verifyToken } from '../utils/jwt';

/**
 * DESIGN NOTES (authenticate)
 * ----------------------------
 * - Gate: prove the caller has a valid JWT before hitting protected handlers.
 * - We only trust the Authorization: Bearer <token> header (not query/body) so
 *   tokens are less likely to end up in logs or Referer headers.
 * - On success, req.user is set for authorize() and controllers downstream.
 */

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;

  if (!header?.startsWith('Bearer ')) {
    // Missing or wrong scheme — treat as unauthenticated, not a server error
    return res.status(401).json({ message: 'Authentication required' });
  }

  const token = header.slice('Bearer '.length).trim();
  if (!token) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  try {
    const payload = verifyToken(token);
    req.user = { id: payload.id, role: payload.role };
    return next();
  } catch {
    // Invalid signature, malformed token, or expired — same 401 either way
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}
