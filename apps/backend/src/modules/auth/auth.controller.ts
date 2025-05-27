import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDTO, RegisterDTO, ResetPasswordDTO, ResetPasswordRequestDTO, ChangePasswordDTO } from './auth.dtos';
import { ResponseHelper } from '../../lib/response.helper';
import Logger from '../../config/logger.config';

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
  }    static async login(req: Request, res: Response): Promise<void> {
    try {
      const loginData = req.body as LoginDTO;
      
      console.log(`\n\n\n`)
      Logger.info(`Login attempt for email: ${loginData.email}`);
      Logger.info(`Request headers: ${JSON.stringify({
        origin: req.headers.origin,
        host: req.headers.host,
        userAgent: req.headers['user-agent'],
        cookie: req.headers.cookie
      })}`);
      
      const { user, isNewSession } = await AuthService.login(loginData);
      
      Logger.info(`Login successful for user: ${user._id}`);
      Logger.info(`Session before setting userId: ${JSON.stringify({
        sessionId: req.session?.id,
        sessionExists: !!req.session,
        isNewSession
      })}`);

      if (req.session && isNewSession) {
        req.session.userId = String(user._id);
        
        Logger.info(`Session after setting userId: ${JSON.stringify({
          sessionId: req.session.id,
          userId: req.session.userId,
          cookie: req.session.cookie
        })}`);

        // Save session before sending response
        await new Promise<void>((resolve, reject) => {
          req.session.save((err) => {
            if (err) {
              Logger.error(`Session save error: ${err.message}`);
              reject(err);
            } else {
              Logger.info(`Session saved successfully for user: ${user._id}`);
              Logger.info(`Session cookie after save: ${JSON.stringify(req.session?.cookie)}`);
              Logger.info(`Response Set-Cookie header after session save: ${res.getHeader('Set-Cookie')}`);
              resolve();
            }
          });
        });
      }

      res.on('finish', () => {
        Logger.info(`Response sent for login - Status: ${res.statusCode}`);
        Logger.info(`Response headers: ${JSON.stringify(res.getHeaders())}`);
        Logger.info(`Set-Cookie header present: ${!!res.getHeader('Set-Cookie')}`);
        if (res.getHeader('Set-Cookie')) {
          Logger.info(`Set-Cookie value: ${res.getHeader('Set-Cookie')}`);
        }
        console.log(`\n\n\n`)
      });
      
      ResponseHelper.success(res, user, 'Login successful');
    } catch (error) {
      Logger.error(`Login error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      ResponseHelper.error(
        res, 
        error instanceof Error ? error.message : 'Authentication failed', 
        401
      );
    }
  }
    static async logout(req: Request, res: Response): Promise<void> {
    Logger.info(`Logout attempt - Session exists: ${!!req.session}, UserID: ${req.session?.userId}`);
    
    if (req.session) {
      const sessionId = req.session.id;
      const userId = req.session.userId;
      
      req.session.destroy((err: Error | null) => {
        if (err) {
          Logger.error(`Session destruction failed - SessionID: ${sessionId}, Error: ${err.message}`);
          ResponseHelper.error(res, 'Failed to logout', 500);
        } else {
          Logger.info(`Session destroyed successfully - SessionID: ${sessionId}, UserID: ${userId}`);
          res.clearCookie('halogen.sid');
          Logger.info(`Cookie cleared for logout - SessionID: ${sessionId}`);
          ResponseHelper.success(res, null, 'Logged out successfully');
        }
      });
    } else {
      Logger.info(`Logout called but no session exists`);
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