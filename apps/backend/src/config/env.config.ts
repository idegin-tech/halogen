import { cleanEnv, str, port, bool, num } from 'envalid';
import dotenv from 'dotenv';
import path from 'path';
import Logger from './logger.config';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

export function validateEnv() {
  try {
    const env = cleanEnv(process.env, {
      NODE_ENV: str({ choices: ['development', 'production', 'test'], default: 'development' }),
      PORT: port({ default: 8081 }),
      API_ENDPOINT: str(),
      REDIS_URL: str(),

      ADMIN_EMAIL: str(),

      MONGODB_URI: str(),
      MONGODB_AUTH_SOURCE: str({ default: 'admin' }),

      SESSION_SECRET: str(),
      CORS_ORIGIN: str(),
      COOKIE_SECURE: bool({ default: process.env.NODE_ENV === 'production' }),
      COOKIE_DOMAIN: str(),
      RATE_LIMIT_MAX: num({ default: 100 }),
      RATE_LIMIT_WINDOW_MS: num({ default: 60 * 1000 }),

      EMAIL_HOST: str(),
      EMAIL_PORT: port({ default: 587 }),
      EMAIL_USER: str(),
      EMAIL_PASS: str(),
      EMAIL_FROM: str(),
      JWT_SECRET: str(),
      JWT_EXPIRES_IN: str({ default: '1d' }),

      CLOUDINARY_CLOUD_NAME: str(),
      CLOUDINARY_API_KEY: str(),
      CLOUDINARY_API_SECRET: str(),

      PREVIEW_URL: str(),
    }, {
      reporter: ({ errors }) => {
        if (Object.keys(errors).length > 0) {
          console.error('\n⚠️ Environment validation failed! Missing required environment variables:');
          Object.entries(errors).forEach(([key, error]) => {
            console.error(`- ${key}: ${error.message}`);
          });
          console.error('\nPlease add these variables to your .env file and restart the application.\n');
          process.exit(1);
        }
      }
    });

    Logger.info('Environment variables validated successfully');
    return env;
  } catch (error) {
    Logger.error(`Environment validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    throw error;
  }
}

export default validateEnv;

