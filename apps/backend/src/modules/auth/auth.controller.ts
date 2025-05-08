import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDTO, RegisterDTO, ResetPasswordDTO, ResetPasswordRequestDTO, ChangePasswordDTO } from './auth.dtos';
import { createSuccessResponse, createErrorResponse } from '../../types/api.types';

export class AuthController {
  static async register(req: Request, res: Response): Promise<void> {
    try {
      const userData = req.body as RegisterDTO;
      const user = await AuthService.register(userData);
      
      res.status(201).json(createSuccessResponse(user));
    } catch (error) {
      res.status(400).json(createErrorResponse(error instanceof Error ? error.message : 'Failed to register user'));
    }
  }
  
  static async login(req: Request, res: Response): Promise<void> {
    try {
      const loginData = req.body as LoginDTO;
      const { user, isNewSession } = await AuthService.login(loginData);
      
      if (req.session && isNewSession) {
        req.session.userId = String(user._id);
        req.session.userRole = user.role;
      }
      
      res.status(200).json(createSuccessResponse(user));
    } catch (error) {
      res.status(401).json(createErrorResponse(error instanceof Error ? error.message : 'Authentication failed'));
    }
  }
  
  static async logout(req: Request, res: Response): Promise<void> {
    if (req.session) {
      req.session.destroy((err: Error | null) => {
        if (err) {
          res.status(500).json(createErrorResponse('Failed to logout'));
        } else {
          res.clearCookie('halogen.sid');
          res.status(200).json(createSuccessResponse({ message: 'Logged out successfully' }));
        }
      });
    } else {
      res.status(200).json(createSuccessResponse({ message: 'Already logged out' }));
    }
  }
  
  static async refreshToken(req: Request, res: Response): Promise<void> {
    try {
      if (!req.session || !req.session.userId) {
        res.status(401).json(createErrorResponse('Not authenticated'));
        return;
      }
      
      const user = await AuthService.getCurrentUser(req.session.userId);
      
      if (!user) {
        req.session.destroy((err: Error | null) => {
          res.clearCookie('halogen.sid');
          res.status(401).json(createErrorResponse('User not found'));
        });
        return;
      }
      
      req.session.cookie.maxAge = 1000 * 60 * 60 * 24 * 2; // Reset to 2 days
      
      res.status(200).json(createSuccessResponse({ message: 'Token refreshed successfully' }));
    } catch (error) {
      res.status(500).json(createErrorResponse(error instanceof Error ? error.message : 'Failed to refresh token'));
    }
  }
  
  static async getCurrentUser(req: Request, res: Response): Promise<void> {
    try {
      if (!req.session || !req.session.userId) {
        res.status(401).json(createErrorResponse('Not authenticated'));
        return;
      }
      
      const user = await AuthService.getCurrentUser(req.session.userId);
      
      if (!user) {
        res.status(404).json(createErrorResponse('User not found'));
        return;
      }
      
      res.status(200).json(createSuccessResponse(user));
    } catch (error) {
      res.status(500).json(createErrorResponse(error instanceof Error ? error.message : 'Failed to retrieve current user'));
    }
  }
  
  static async requestPasswordReset(req: Request, res: Response): Promise<void> {
    try {
      const resetData = req.body as ResetPasswordRequestDTO;
      await AuthService.requestPasswordReset(resetData);
      
      res.status(200).json(createSuccessResponse({ message: 'If your email exists in our system, you will receive a password reset link' }));
    } catch (error) {
      res.status(500).json(createErrorResponse('Failed to process password reset request'));
    }
  }
  
  static async resetPassword(req: Request, res: Response): Promise<void> {
    try {
      const resetData = req.body as ResetPasswordDTO;
      await AuthService.resetPassword(resetData);
      
      res.status(200).json(createSuccessResponse({ message: 'Password has been reset successfully' }));
    } catch (error) {
      res.status(400).json(createErrorResponse(error instanceof Error ? error.message : 'Failed to reset password'));
    }
  }
  
  static async changePassword(req: Request, res: Response): Promise<void> {
    try {
      if (!req.session || !req.session.userId) {
        res.status(401).json(createErrorResponse('Not authenticated'));
        return;
      }
      
      const changeData = req.body as ChangePasswordDTO;
      await AuthService.changePassword(req.session.userId, changeData);
      
      res.status(200).json(createSuccessResponse({ message: 'Password changed successfully' }));
    } catch (error) {
      res.status(400).json(createErrorResponse(error instanceof Error ? error.message : 'Failed to change password'));
    }
  }
}