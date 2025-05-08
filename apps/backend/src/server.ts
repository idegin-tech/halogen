import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import Logger from './config/logger.config';
import Database from './config/db.config';
import { SessionConfig } from './config/session.config';
import { ErrorHandlerMiddleware } from './middleware/error.middleware';
import authRoutes from './modules/auth/auth.routes';

dotenv.config();

class App {
  public app: Application;

  constructor() {
    this.app = express();
    this.configureMiddleware();
    this.configureRoutes();
    this.configureErrorHandlers();
  }

  private configureMiddleware(): void {
    // Enable CORS with credentials support
    this.app.use(cors({
      origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
      credentials: true
    }));
    
    // Parse JSON request bodies
    this.app.use(express.json());
    
    // Parse URL-encoded request bodies
    this.app.use(express.urlencoded({ extended: true }));
    
    // Parse cookies
    this.app.use(cookieParser());
    
    // Configure session management with MongoDB storage
    SessionConfig.configure(this.app);
    
    // Log HTTP requests
    this.app.use((req: Request, res: Response, next) => {
      Logger.http(`${req.method} ${req.url}`);
      next();
    });
  }

  private configureRoutes(): void {
    // API health check
    this.app.get('/health', (req: Request, res: Response) => {
      const dbStatus = Database.getInstance().getStatus();
      
      res.status(200).json({
        status: 'UP',
        timestamp: new Date().toISOString(),
        database: dbStatus
      });
    });
    
    // API root
    this.app.get('/', (req: Request, res: Response) => {
      res.json({ message: 'Welcome to the Halogen API' });
    });
    
    // Auth routes
    this.app.use('/api/auth', authRoutes);
  }

  private configureErrorHandlers(): void {
    // Handle 404 errors
    this.app.use((req: Request, res: Response) => {
      ErrorHandlerMiddleware.handleNotFound(req, res);
    });
    
    // Handle all other errors
    this.app.use((err: any, req: Request, res: Response, next: any) => {
      ErrorHandlerMiddleware.handleError(err, req, res, next);
    });
  }
}

export default new App().app;