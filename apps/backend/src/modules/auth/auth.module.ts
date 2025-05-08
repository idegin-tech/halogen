import { Router } from 'express';
import authRoutes from './auth.routes';

export class AuthModule {
  static getRoutes(): Router {
    return authRoutes;
  }
}