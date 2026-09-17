import { apiClient } from '../lib/apiClient';
import type { CurrentUser } from '../types';

export interface RegisterPayload {
  email: string;
  username: string;
  fullName: string;
  password: string;
  universityName: string;
  graduationYear: number;
}

export const authApi = {
  register: (payload: RegisterPayload) =>
    apiClient.post<{ message: string; userId: string; email: string }>('/auth/register', payload),

  verifyOtp: (userId: string, code: string) =>
    apiClient.post<{ message: string }>('/auth/verify-otp', { userId, code }),

  resendOtp: (email: string) => apiClient.post<{ message: string }>('/auth/resend-otp', { email }),

  login: (email: string, password: string) => apiClient.post<{ user: CurrentUser }>('/auth/login', { email, password }),

  loginWithGoogle: (idToken: string) => apiClient.post<{ user: CurrentUser }>('/auth/google', { idToken }),

  me: () => apiClient.get<{ user: CurrentUser }>('/auth/me'),

  logout: () => apiClient.post<{ message: string }>('/auth/logout'),

  logoutAll: () => apiClient.post<{ message: string }>('/auth/logout-all'),

  changePassword: (currentPassword: string, newPassword: string) =>
    apiClient.post<{ message: string }>('/auth/change-password', { currentPassword, newPassword }),

  forgotPassword: (email: string) => apiClient.post<{ message: string }>('/auth/forgot-password', { email }),

  resetPassword: (token: string, newPassword: string) =>
    apiClient.post<{ message: string }>('/auth/reset-password', { token, newPassword }),
};
