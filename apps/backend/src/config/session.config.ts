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
      
      app.use(
        session({
          secret: env.SESSION_SECRET,
          cookie: {
            maxAge: 1000 * 60 * 60 * 24 * 2,
            httpOnly: true,
            secure: env.COOKIE_SECURE,
            sameSite: 'lax',
            // domain: env.COOKIE_DOMAIN || undefined
          },
          store: store,
          resave: false,
          saveUninitialized: false,
          name: 'halogen.sid',
          rolling: true
        })
      );
      
      Logger.info('Session middleware configured successfully');
    } catch (error) {
      Logger.error(`Failed to configure session middleware: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }
}

