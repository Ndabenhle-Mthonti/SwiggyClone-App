import { ExtendedError, Socket } from 'socket.io';
import { TokenPayload, verifyToken } from '../utils/jwt';

/**
 * Augment Socket.io's SocketData so `socket.data.user` is typed after auth.
 */
declare module 'socket.io' {
  interface SocketData {
    user?: TokenPayload;
  }
}

/**
 * Socket.io connection middleware — WebSocket equivalent of HTTP `authenticate`.
 * Same goal (prove identity via JWT), different transport: handshake.auth.token
 * instead of the Authorization header.
 */
export function socketAuth(
  socket: Socket,
  next: (err?: ExtendedError) => void
): void {
  const token = socket.handshake.auth?.token;

  if (typeof token !== 'string' || !token.trim()) {
    return next(new Error('Authentication required'));
  }

  try {
    const payload = verifyToken(token);
    socket.data.user = { id: payload.id, role: payload.role };
    return next();
  } catch {
    return next(new Error('Invalid or expired token'));
  }
}
