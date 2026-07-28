import dns from 'dns';
import express, { Application, Request, Response } from 'express';
import mongoose from 'mongoose';
import { getEnvironmentVariables } from './environments/environment';
import UserRouter from './routers/UserRouter';

// Windows/Node sometimes fails MongoDB Atlas SRV lookups with the system DNS.
dns.setServers(['8.8.8.8', '1.1.1.1']);

export class Server {
  public app: Application = express();
  private readonly env = getEnvironmentVariables();

  constructor() {
    this.setConfigs();
    this.setRoutes();
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
  }

  async start() {
    try {
      await this.connectMongoDB();
      this.app.listen(this.env.port, () => {
        console.log(`server is running at port ${this.env.port}`);
      });
    } catch (error) {
      console.error('Failed to start server:', error);
      process.exit(1);
    }
  }
}
