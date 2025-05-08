"use client";

import { useMutation } from './useApi';
import { toast } from 'sonner';
import { User, LoginFormValues, RegisterFormValues } from '@/lib/validators/auth';
import { useRouter } from 'next/navigation';

export function useAuth() {
  const router = useRouter();
  
  const login = useMutation<User, LoginFormValues>('/auth/login');
  const register = useMutation<User, RegisterFormValues>('/auth/register');
  const logout = useMutation<null>('/auth/logout');
  
  const handleLoginSuccess = async (user: User) => {
    toast.success(`Welcome back, ${user.displayName}!`);
    // Refresh the page to trigger middleware cookie check
    window.location.href = '/client';
  };
  
  const handleRegisterSuccess = async (user: User) => {
    toast.success(`Welcome to Halogen, ${user.displayName}!`);
    // Refresh the page to trigger middleware cookie check
    window.location.href = '/client';
  };

  const handleLogin = async (data: LoginFormValues) => {
    const user = await login.mutate(data);
    if (user) {
      await handleLoginSuccess(user);
      return user;
    }
    return null;
  };
  
  const handleRegister = async (data: RegisterFormValues) => {
    const user = await register.mutate(data);
    if (user) {
      await handleRegisterSuccess(user);
      return user;
    }
    return null;
  };

  const handleLogout = async () => {
    const result = await logout.mutate();
    if (result !== null) {
      toast.success('Logged out successfully');
      window.location.href = '/';
      return true;
    }
    return false;
  };

  return {
    isLoading: login.isLoading || register.isLoading || logout.isLoading,
    error: login.error || register.error || logout.error,
    login: {
      execute: handleLogin,
      ...login
    },
    register: {
      execute: handleRegister,
      ...register
    },
    logout: {
      execute: handleLogout,
      ...logout
    },
  };
}