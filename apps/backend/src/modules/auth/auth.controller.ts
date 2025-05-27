import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDTO, RegisterDTO, ResetPasswordDTO, ResetPasswordRequestDTO, ChangePasswordDTO } from './auth.dtos';
import { ResponseHelper } from '../../lib/response.helper';

export class AuthController {
  static async register(req: Request, res: Response): Promise<void> {
    try {
      const userData = req.body as RegisterDTO;
      const user = await AuthService.register(userData);
      
      ResponseHelper.success(res, user, 'User registered successfully', 201);
    } catch (error) {
      ResponseHelper.error(
        res, 
        error instanceof Error ? error.message : 'Failed to register user', 
        400
      );
    }
  }
  
  static async login(req: Request, res: Response): Promise<void> {
    try {
      const loginData = req.body as LoginDTO;
      const { user, isNewSession } = await AuthService.login(loginData);
      
      console.log('LOGIN SESSION::', {
        session: req.session,
        isNewSession
      })

      if (req.session && isNewSession) {
        req.session.userId = String(user._id);
      }
      
      ResponseHelper.success(res, user, 'Login successful');
    } catch (error) {
      ResponseHelper.error(
        res, 
        error instanceof Error ? error.message : 'Authentication failed', 
        401
      );
    }
  }
  
  static async logout(req: Request, res: Response): Promise<void> {
    if (req.session) {
      req.session.destroy((err: Error | null) => {
        if (err) {
          ResponseHelper.error(res, 'Failed to logout', 500);
        } else {
          res.clearCookie('halogen.sid');
          ResponseHelper.success(res, null, 'Logged out successfully');
        }
      });
    } else {
      ResponseHelper.success(res, null, 'Already logged out');
    }
  }
  
  static async refreshToken(req: Request, res: Response): Promise<void> {
    try {
      if (!req.session || !req.session.userId) {
        ResponseHelper.unauthorized(res);
        return;
      }
      
      const user = await AuthService.getCurrentUser(req.session.userId);
      
      if (!user) {
        req.session.destroy((err: Error | null) => {
          res.clearCookie('halogen.sid');
          ResponseHelper.error(res, 'User not found', 401);
        });
        return;
      }
      
      req.session.cookie.maxAge = 1000 * 60 * 60 * 24 * 2; // Reset to 2 days
      
      ResponseHelper.success(res, { userId: user._id }, 'Token refreshed successfully');
    } catch (error) {
      ResponseHelper.error(
        res, 
        error instanceof Error ? error.message : 'Failed to refresh token', 
        500
      );
    }
  }
  
  static async getCurrentUser(req: Request, res: Response): Promise<void> {
    try {
      if (!req.session || !req.session.userId) {
        ResponseHelper.unauthorized(res);
        return;
      }
      
      const user = await AuthService.getCurrentUser(req.session.userId);
      
      if (!user) {
        ResponseHelper.notFound(res, 'User');
        return;
      }
      
      ResponseHelper.success(res, user, 'User retrieved successfully');
    } catch (error) {
      ResponseHelper.error(
        res, 
        error instanceof Error ? error.message : 'Failed to retrieve current user', 
        500
      );
    }
  }
  
  static async requestPasswordReset(req: Request, res: Response): Promise<void> {
    try {
      const resetData = req.body as ResetPasswordRequestDTO;
      await AuthService.requestPasswordReset(resetData);
      
      ResponseHelper.success(
        res, 
        { email: resetData.email }, 
        'If your email exists in our system, you will receive a password reset link'
      );
    } catch (error) {
      ResponseHelper.error(res, 'Failed to process password reset request', 500);
    }
  }
  
  static async resetPassword(req: Request, res: Response): Promise<void> {
    try {
      const resetData = req.body as ResetPasswordDTO;
      await AuthService.resetPassword(resetData);
      
      ResponseHelper.success(res, { token: resetData.token }, 'Password has been reset successfully');
    } catch (error) {
      ResponseHelper.error(
        res, 
        error instanceof Error ? error.message : 'Failed to reset password', 
        400
      );
    }
  }
  
  static async changePassword(req: Request, res: Response): Promise<void> {
    try {
      if (!req.session || !req.session.userId) {
        ResponseHelper.unauthorized(res);
        return;
      }
      
      const changeData = req.body as ChangePasswordDTO;
      await AuthService.changePassword(req.session.userId, changeData);
      
      ResponseHelper.success(res, { userId: req.session.userId }, 'Password changed successfully');
    } catch (error) {
      ResponseHelper.error(
        res, 
        error instanceof Error ? error.message : 'Failed to change password', 
        400
      );
    }
  }
}