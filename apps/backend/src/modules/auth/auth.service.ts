import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { appConfig, User } from '@halogen/common';
import UserModel from '../users/users.model';
import UserSecretModel from '../users/user-secret.model';
import { LoginDTO, RegisterDTO, ResetPasswordDTO, ResetPasswordRequestDTO, ChangePasswordDTO } from './auth.dtos';
import { Types } from 'mongoose';
import Logger from '../../config/logger.config';

export class AuthService {
  private static readonly SALT_ROUNDS = 10;
  
  private static generateDisplayName(email: string): string {
    const username = email.split('@')[0];
    
    const cleanName = username.replace(/[^a-zA-Z0-9]/g, ' ');
    
    const displayName = cleanName
      .split(' ')
      .filter(word => word.length > 0)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    
    return displayName || `${appConfig.name} User`;
  }
  
  static async register(userData: RegisterDTO): Promise<User> {
    try {
      const email = userData.email.trim().toLowerCase();
      
      const existingUser = await UserModel.findOne({ email });
      if (existingUser) {
        throw new Error('User with this email already exists');
      }

      const displayName = this.generateDisplayName(email);

      const newUser = new UserModel({
        displayName,
        email,
        isActive: true
      });
      
      const savedUser = await newUser.save();
      
      const passwordHash = await bcrypt.hash(userData.password, this.SALT_ROUNDS);
      
      const userSecret = new UserSecretModel({
        user: savedUser._id,
        passwordHash
      });
      
      await userSecret.save();
      
      const userObj = savedUser.toObject();
      const userToReturn: User = {
        ...userObj,
        _id: userObj._id as any
      };
      
      return userToReturn;
    } catch (error) {
      console.log(error)
      Logger.error(`Registration error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }
    static async login(loginData: LoginDTO): Promise<{user: User, isNewSession: boolean}> {
    try {
      const email = loginData.email.trim().toLowerCase();
      
      Logger.info(`AuthService: Attempting login for email: ${email}`);
      
      const user = await UserModel.findOne({ email });
      if (!user) {
        Logger.warn(`AuthService: User not found for email: ${email}`);
        throw new Error('Invalid email or password');
      }
      
      Logger.info(`AuthService: User found - ID: ${user._id}, Active: ${user.isActive}`);
      
      if (!user.isActive) {
        Logger.warn(`AuthService: Inactive user attempted login: ${user._id}`);
        throw new Error('Account is disabled. Please contact support');
      }
      
      const userSecret = await UserSecretModel.findOne({ user: user._id });
      if (!userSecret) {
        Logger.error(`AuthService: User secret not found for user: ${user._id}`);
        throw new Error('User authentication data not found');
      }
      
      const isPasswordValid = await bcrypt.compare(loginData.password, userSecret.passwordHash);
      if (!isPasswordValid) {
        Logger.warn(`AuthService: Invalid password for user: ${user._id}`);
        throw new Error('Invalid email or password');
      }
      
      Logger.info(`AuthService: Password validation successful for user: ${user._id}`);
        user.lastLogin = new Date();
      await user.save();
      
      Logger.info(`AuthService: User lastLogin updated for: ${user._id}`);
      
      const userObj = user.toObject();
      const userToReturn: User = {
        ...userObj,
        _id: userObj._id as any
      };
      
      Logger.info(`AuthService: Login process completed for user: ${user._id}`);
      
      return {
        user: userToReturn,
        isNewSession: true
      };
    } catch (error) {
      console.log(error)
      Logger.error(`Login error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }
  
  static async logout(userId: string): Promise<void> {
    return;
  }
  
  static async getCurrentUser(userId: string): Promise<User | null> {
    try {
      const user = await UserModel.findById(userId);
      if (!user) return null;
      
      const userObj = user.toObject();
      const userToReturn: User = {
        ...userObj,
        _id: userObj._id as any
      };
      
      return userToReturn;
    } catch (error) {
      console.log(error)
      Logger.error(`Get current user error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }
  
  static async requestPasswordReset(data: ResetPasswordRequestDTO): Promise<void> {
    try {
      const email = data.email.trim().toLowerCase();
      
      const user = await UserModel.findOne({ email });
      if (!user) {
        return;
      }

      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetTokenExpiry = new Date();
      resetTokenExpiry.setHours(resetTokenExpiry.getHours() + 1);
      
      await UserSecretModel.findOneAndUpdate(
        { user: user._id },
        {
          passwordResetToken: resetToken,
          passwordResetExpires: resetTokenExpiry
        }
      );
      
      Logger.info(`Password reset token for ${email}: ${resetToken}`);
    } catch (error) {
      console.log(error)
      Logger.error(`Reset password request error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }
  
  static async resetPassword(data: ResetPasswordDTO): Promise<void> {
    try {
      const userSecret = await UserSecretModel.findOne({
        passwordResetToken: data.token,
        passwordResetExpires: { $gt: new Date() }
      });
      
      if (!userSecret) {
        throw new Error('Invalid or expired password reset token');
      }
      
      const passwordHash = await bcrypt.hash(data.password, this.SALT_ROUNDS);
      
      userSecret.passwordHash = passwordHash;
      userSecret.passwordResetToken = undefined;
      userSecret.passwordResetExpires = undefined;
      
      await userSecret.save();
    } catch (error) {
      console.log(error)
      Logger.error(`Reset password error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }
  
  static async changePassword(userId: string, data: ChangePasswordDTO): Promise<void> {
    try {
      const userSecret = await UserSecretModel.findOne({ user: new Types.ObjectId(userId) });
      if (!userSecret) {
        throw new Error('User authentication data not found');
      }
      
      const isPasswordValid = await bcrypt.compare(data.currentPassword, userSecret.passwordHash);
      if (!isPasswordValid) {
        throw new Error('Current password is incorrect');
      }
      
      const passwordHash = await bcrypt.hash(data.newPassword, this.SALT_ROUNDS);
      
      userSecret.passwordHash = passwordHash;
      await userSecret.save();
    } catch (error) {
      console.log(error)
      Logger.error(`Change password error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }
}