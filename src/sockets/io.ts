import { Server as SocketIOServer } from 'socket.io';

/**
 * Shared Socket.io handle for HTTP controllers.
 *
 * Controllers are default-exported singletons (`export default new XController()`),
 * created at import time — before `Server` exists — so constructor-injection of `io`
 * does not fit this repo's pattern. Instead `Server` calls `setIO(this.io)` once at
 * boot; controllers call `getIO()` when they need to emit into rooms.
 */
let io: SocketIOServer | null = null;

export function setIO(instance: SocketIOServer): void {
  io = instance;
}

export function getIO(): SocketIOServer {
  if (!io) {
    throw new Error('Socket.io has not been initialized yet');
  }
  return io;
}
