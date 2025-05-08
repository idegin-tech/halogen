import session from 'express-session';
import connectMongoDBSession from 'connect-mongodb-session';
import { Application } from 'express';
import Logger from './logger.config';

export class SessionConfig {
  private static readonly COOKIE_MAX_AGE = 1000 * 60 * 60 * 24 * 2;
  private static readonly SESSION_SECRET = process.env.SESSION_SECRET || 'halogen-secret-key-change-in-production';
  private static readonly MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/halogen';

  static configure(app: Application): void {
    try {
      const MongoDBStore = connectMongoDBSession(session);
      
      const store = new MongoDBStore({
        uri: this.MONGO_URI,
        collection: 'sessions',
        expires: this.COOKIE_MAX_AGE,
        connectionOptions: {
          useNewUrlParser: true,
          useUnifiedTopology: true,
        }
      });
      
      store.on('error', (error) => {
        Logger.error(`MongoDB session store error: ${error}`);
      });
      
      app.use(
        session({
          secret: this.SESSION_SECRET,
          cookie: {
            maxAge: this.COOKIE_MAX_AGE,
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax'
          },
          store: store,
          resave: false,
          saveUninitialized: false,
          name: 'halogen.sid'
        })
      );
      
      Logger.info('Session middleware configured successfully');
    } catch (error) {
      Logger.error(`Failed to configure session middleware: ${error}`);
      throw error;
    }
  }
}