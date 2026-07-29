import jwt from 'jsonwebtoken';
import { getEnvironmentVariables } from '../environments/environment';

/**
 * DESIGN NOTES (JWT helpers)
 * --------------------------
 * - Tokens carry only id + role (no email/password). Keep payloads small and
 *   non-sensitive; look up fresh user data from the DB when needed.
 * - Expiry (7d) limits damage if a token is stolen; pair with HTTPS in production.
 * - Secret comes from AppEnvironment so prod never silently uses a dev default.
 */

export type UserRole = 'customer' | 'restaurant_admin' | 'delivery_partner';

export interface TokenPayload {
  id: string;
  role: UserRole;
}

export function generateToken(payload: TokenPayload): string {
  const { jwt_secret } = getEnvironmentVariables();
  if (!jwt_secret) {
    throw new Error('JWT_SECRET is not configured');
  }

  // HS256 by default — secret must stay server-side only
  return jwt.sign(payload, jwt_secret, { expiresIn: '7d' });
}

export function verifyToken(token: string): TokenPayload {
  const { jwt_secret } = getEnvironmentVariables();
  if (!jwt_secret) {
    throw new Error('JWT_SECRET is not configured');
  }

  // Throws JsonWebTokenError / TokenExpiredError if tampered or expired
  const decoded = jwt.verify(token, jwt_secret) as TokenPayload;
  return decoded;
}
