import { cleanEnv, str, port, bool, num } from 'envalid';
import dotenv from 'dotenv';
import path from 'path';
import Logger from './logger.config';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

export function validateEnv() {
  try {
    const env = cleanEnv(process.env, {
      NODE_ENV: str({ choices: ['development', 'production', 'test'], default: 'development' }),
      PORT: port({ default: 3001 }),
      
      MONGODB_URI: str({ example: 'mongodb://localhost:27017/halogen' }),
      MONGODB_AUTH_SOURCE: str({ default: 'admin' }),
      
      SESSION_SECRET: str({ example: 'complex-secret-key-at-least-32-chars' }),
      CORS_ORIGIN: str({ example: 'http://localhost:3000,https://app.example.com' }),
      COOKIE_SECURE: bool({ default: process.env.NODE_ENV === 'production' }),
      COOKIE_DOMAIN: str({ default: undefined }),
      RATE_LIMIT_MAX: num({ default: 100 }),
      RATE_LIMIT_WINDOW_MS: num({ default: 60 * 1000 }),
      
      EMAIL_HOST: str({ default: undefined }),
      EMAIL_PORT: port({ default: 587 }),
      EMAIL_USER: str({ default: undefined }),
      EMAIL_PASS: str({ default: undefined }),
      EMAIL_FROM: str({ default: 'no-reply@halogen.com' }),
      
      JWT_SECRET: str({ default: undefined }),
      JWT_EXPIRES_IN: str({ default: '1d' }),
    });
    
    Logger.info('Environment variables validated successfully');
    return env;
  } catch (error) {
    Logger.error(`Environment validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    throw error;
  }
}

export default validateEnv;