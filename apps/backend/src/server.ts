import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
//@ts-ignore
import xss from 'xss-clean';
import hpp from 'hpp';
import Logger from './config/logger.config';
import Database from './config/db.config';
import { validateEnv } from './config/env.config';
import { SessionConfig } from './config/session.config';
import { ErrorHandlerMiddleware } from './middleware/error.middleware';
import { projectUsersRoutes } from './modules/project-users';
import { projectMetadataRoutes } from './modules/project-metadata';
import { pagesRoutes, variablesRoutes, blockInstancesRoutes } from './modules/artifacts';
import { previewRoutes } from './modules/www';
import authRoutes from './modules/auth/auth.routes';
import { projectsRoutes } from './modules/projects';
import { projectSettingsRoutes } from './modules/project-settings';
import { filesRoutes } from './modules/files';
import { collectionsRoutes, schemaRoutes } from './modules/cms';
import { uploadsRoutes } from './modules/uploads/uploadds.routes';
import { systemRoutes } from './modules/system';
import { domainsRoutes } from './modules/domains';
import { DomainsService } from './modules/domains/domains.service';

declare module 'express' {
    interface Request {
        requestTime?: string;
    }
}

const env = validateEnv();

class App {
    public app: Application;

    constructor() {
        this.app = express();
        this.app.set('trust proxy', '127.0.0.1');
        this.configureSecurityMiddleware();
        this.configureStandardMiddleware();
        this.configureRoutes();
        this.configureErrorHandlers();
    }    private configureSecurityMiddleware(): void {
        this.app.use(helmet());
        
        // Allow any origin for maximum compatibility
        this.app.use(cors({
            origin: (origin, callback) => {
                // Allow any origin in development
                if (env.NODE_ENV === 'development') {
                    Logger.debug(`CORS: Development mode - allowing origin: ${origin || 'no origin'}`);
                    return callback(null, true);
                }

                // In production, allow any origin for maximum flexibility
                // You can restrict this later based on your security requirements
                Logger.debug(`CORS: Production mode - allowing any origin: ${origin || 'no origin'}`);
                callback(null, true);
            },
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
            maxAge: 86400
        }));

        const limiter = rateLimit({
            max: env.RATE_LIMIT_MAX,
            windowMs: env.RATE_LIMIT_WINDOW_MS,
            message: 'Too many requests from this IP, please try again later',
            standardHeaders: true,
            legacyHeaders: false,
        });

        this.app.use(limiter);
        this.app.use(mongoSanitize());
        this.app.use(xss());
        this.app.use(hpp({
            whitelist: ['orderBy', 'fields', 'page', 'limit']
        }));
    }

    private configureStandardMiddleware(): void {
        this.app.use(express.json({ limit: '20mb' }));
        this.app.use(express.urlencoded({ extended: true, limit: '20mb' }));
        this.app.use(cookieParser());
        this.app.use(compression());
        SessionConfig.configure(this.app);        
        this.app.use((req: Request, res: Response, next: NextFunction) => {
            req.requestTime = new Date().toISOString();

            if (!req.url.includes('/health')) {
                Logger.http(`${req.method} ${req.url}`);
                Logger.debug(`Session debug - URL: ${req.url}, SessionID: ${req.session?.id}, UserID: ${req.session?.userId}`);
                Logger.debug(`Cookies received: ${JSON.stringify(req.cookies)}`);
                Logger.debug(`Request origin: ${req.headers.origin}`);
            }
            next();
        });
        
        this.app.use((req: Request, res: Response, next: NextFunction) => {
            res.on('finish', () => {
                if (!req.url.includes('/health')) {
                    Logger.debug(`Response finished - Status: ${res.statusCode}, Set-Cookie: ${res.getHeaders()['set-cookie']}`);
                }
            });
            next();
        });
    } 
    
    private configureRoutes(): void {
        this.app.get('/health', (req: Request, res: Response) => {
            const dbStatus = Database.getInstance().getStatus();

            res.status(200).json({
                status: 'UP',
                timestamp: new Date().toISOString(),
                database: dbStatus
            });
        });

        const apiPrefix = '/api/v1';

        this.app.locals.domainService = DomainsService;
        this.app.locals.projectService = require('./modules/projects/projects.service').ProjectsService;

        this.app.get(apiPrefix, (req: Request, res: Response) => {
            res.json({
                message: 'Welcome to the Halogen API',
                version: '1.0.0',
                environment: env.NODE_ENV
            });
        });
        this.app.use(`${apiPrefix}/auth`, authRoutes);
        this.app.use(`${apiPrefix}/projects`, projectsRoutes);
        this.app.use(`${apiPrefix}/project-users`, projectUsersRoutes);
        this.app.use(`${apiPrefix}/project-metadata`, projectMetadataRoutes);
        this.app.use(`${apiPrefix}/project-settings`, projectSettingsRoutes);
        this.app.use(`${apiPrefix}/pages`, pagesRoutes);
        this.app.use(`${apiPrefix}/variables`, variablesRoutes);
        this.app.use(`${apiPrefix}/block-instances`, blockInstancesRoutes);
        this.app.use(`${apiPrefix}/preview`, previewRoutes); 
        this.app.use(`${apiPrefix}/uploads`, uploadsRoutes);
        this.app.use(`${apiPrefix}/files`, filesRoutes); 
        this.app.use(`${apiPrefix}/collections`, collectionsRoutes);
        this.app.use(`${apiPrefix}/schemas`, schemaRoutes);
        this.app.use(`${apiPrefix}/domains`, domainsRoutes);
        this.app.use(`${apiPrefix}/system`, systemRoutes);
    }

    private configureErrorHandlers(): void {
        this.app.use((req: Request, res: Response) => {
            ErrorHandlerMiddleware.handleNotFound(req, res);
        });

        this.app.use((err: any, req: Request, res: Response, next: NextFunction) => {
            ErrorHandlerMiddleware.handleError(err, req, res, next);
        });
    }
}

export default new App().app;

