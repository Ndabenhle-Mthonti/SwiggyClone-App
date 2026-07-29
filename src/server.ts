import dns from 'dns';
import { createServer, Server as HttpServer } from 'http';
import express, { Application, Request, Response } from 'express';
import mongoose from 'mongoose';
import { Server as SocketIOServer } from 'socket.io';
import { getEnvironmentVariables } from './environments/environment';
import DeliveryRouter from './routers/DeliveryRouter';
import OrderRouter from './routers/OrderRouter';
import RestaurantRouter from './routers/RestaurantRouter';
import UserRouter from './routers/UserRouter';
import { setIO } from './sockets/io';
import { initOrderSocket } from './sockets/orderSocket';

// Windows/Node sometimes fails MongoDB Atlas SRV lookups with the system DNS.
dns.setServers(['8.8.8.8', '1.1.1.1']);

export class Server {
  public app: Application = express();
  /**
   * Public Socket.io instance. Controllers do not import this class instance —
   * they call getIO() from ./sockets/io, which is wired via setIO(this.io) below.
   */
  public io!: SocketIOServer;
  private httpServer!: HttpServer;
  private readonly env = getEnvironmentVariables();

  constructor() {
    this.setConfigs();

    /**
     * Socket.io needs the raw Node http.Server, not Express alone.
     * WebSocket clients send an HTTP Upgrade request; Express's app.listen()
     * does not expose that upgrade handshake to Socket.io. Wrapping
     * `createServer(this.app)` lets both REST and sockets share one port.
     */
    this.httpServer = createServer(this.app);
    this.io = new SocketIOServer(this.httpServer, {
      // Allow local frontends during learning; tighten CORS for production later
      cors: { origin: '*' },
    });
    setIO(this.io);

    this.setRoutes();
    initOrderSocket(this.io);
  }

  setConfigs() {
    this.app.use(express.json());
  }

  async connectMongoDB() {
    if (!this.env.db_uri) {
      throw new Error('Missing MONGODB_URI in environment variables');
    }

    await mongoose.connect(this.env.db_uri);
    console.log('Connected to MongoDB');
  }

  setRoutes() {
    this.app.get('/', (_req: Request, res: Response) => {
      res.json({
        message: 'Swiggy Clone API is running',
        mongo: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      });
    });

    this.app.use('/api/user', UserRouter);
    this.app.use('/restaurants', RestaurantRouter);
    this.app.use('/orders', OrderRouter);
    this.app.use('/delivery', DeliveryRouter);
  }

  async start() {
    try {
      await this.connectMongoDB();
      this.httpServer.listen(this.env.port, () => {
        console.log(`server is running at port ${this.env.port}`);
      });
    } catch (error) {
      console.error('Failed to start server:', error);
      process.exit(1);
    }
  }
}
