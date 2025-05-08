import { z } from 'zod';

const passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*]).{8,}$/;

export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters')
});

export const registerSchema = z.object({
  displayName: z.string().min(3, 'Name must be at least 3 characters'),
  email: z.string().email('Invalid email format').trim().toLowerCase(),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(
      passwordRegex,
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    ),
}).strict();

export const resetPasswordRequestSchema = z.object({
  email: z.string().email('Invalid email format').trim().toLowerCase()
});

export const resetPasswordSchema = z.object({
  token: z.string(),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(
      passwordRegex,
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    )
});

export const changePasswordSchema = z.object({
  currentPassword: z.string(),
  newPassword: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(
      passwordRegex,
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    )
});

export const refreshTokenSchema = z.object({});

export type LoginDTO = z.infer<typeof loginSchema>;
export type RegisterDTO = z.infer<typeof registerSchema>;
export type ResetPasswordRequestDTO = z.infer<typeof resetPasswordRequestSchema>;
export type ResetPasswordDTO = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordDTO = z.infer<typeof changePasswordSchema>;
export type RefreshTokenDTO = z.infer<typeof refreshTokenSchema>;