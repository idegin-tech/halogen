import { Router } from 'express';
import { AuthController } from './auth.controller';
import { RequestValidation } from '../../middleware/request.middleware';
import { AuthMiddleware } from './auth.middleware';
import {
  loginSchema,
  registerSchema,
  resetPasswordRequestSchema,
  resetPasswordSchema,
  changePasswordSchema,
  refreshTokenSchema
} from './auth.dtos';

const router = Router();

// Public routes
router.post('/register', 
  RequestValidation.validateBody(registerSchema),
  AuthController.register
);

router.post('/login', 
  RequestValidation.validateBody(loginSchema),
  AuthController.login
);

router.post('/logout', 
  AuthController.logout
);

router.post('/refresh-token',
  RequestValidation.validateBody(refreshTokenSchema),
  AuthController.refreshToken
);

router.post('/forgot-password', 
  RequestValidation.validateBody(resetPasswordRequestSchema),
  AuthController.requestPasswordReset
);

router.post('/reset-password', 
  RequestValidation.validateBody(resetPasswordSchema),
  AuthController.resetPassword
);

router.get('/me', 
  AuthMiddleware.requireAuth,
  AuthController.getCurrentUser
);

router.post('/change-password', 
  AuthMiddleware.requireAuth,
  RequestValidation.validateBody(changePasswordSchema),
  AuthController.changePassword
);

export default router;