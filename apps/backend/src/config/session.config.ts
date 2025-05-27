import session from 'express-session';
import connectMongoDBSession from 'connect-mongodb-session';
import { Application } from 'express';
import Logger from './logger.config';
import validateEnv from './env.config';

export class SessionConfig {
  static configure(app: Application): void {
    try {
      const env = validateEnv();
      const MongoDBStore = connectMongoDBSession(session);
        const store = new MongoDBStore({
        uri: env.MONGODB_URI,
        collection: 'sessions',
        expires: 1000 * 60 * 60 * 24 * 2
      });
      
      store.on('error', (error) => {
        Logger.error(`MongoDB session store error: ${error}`);
      });
      
      store.on('connected', () => {
        Logger.info('MongoDB session store connected successfully');
      });
      
      store.on('disconnected', () => {
        Logger.warn('MongoDB session store disconnected');
      });
        const sessionConfig = {
        secret: env.SESSION_SECRET,
        cookie: {
          maxAge: 1000 * 60 * 60 * 24 * 2,
          httpOnly: true,
          secure: env.COOKIE_SECURE,
          sameSite: 'lax' as const,
          domain: env.COOKIE_DOMAIN || undefined
        },
        store: store,
        resave: false,
        saveUninitialized: false,
        name: 'halogen.sid',
        rolling: true
      };

      Logger.info(`Session config: ${JSON.stringify({
        cookieDomain: sessionConfig.cookie.domain,
        cookieSecure: sessionConfig.cookie.secure,
        cookieSameSite: sessionConfig.cookie.sameSite,
        cookieHttpOnly: sessionConfig.cookie.httpOnly,
        cookieMaxAge: sessionConfig.cookie.maxAge,
        sessionName: sessionConfig.name
      })}`);      app.use(session(sessionConfig));
      
      app.use((req, res, next) => {
        const originalSend = res.send;
        res.send = function(...args) {
          //@ts-ignore
          if (req.session && req.session.userId) {
            //@ts-ignore
            Logger.info(`Session data before response: SessionID: ${req.session.id}, UserID: ${req.session.userId}`);
            Logger.info(`Set-Cookie will be set by express-session: ${!!res.getHeader('Set-Cookie')}`);
          }
          return originalSend.apply(this, args);
        };
        next();
      });
      
      app.use((req, res, next) => {
        //@ts-ignore
        Logger.debug(`Session middleware: SessionID: ${req.session?.id}, UserID: ${req.session?.userId}`);
        Logger.debug(`Session cookie settings: ${JSON.stringify(req.session?.cookie)}`);
        next();
      });
      
      Logger.info('Session middleware configured successfully');
    } catch (error) {
      Logger.error(`Failed to configure session middleware: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }
}

