import apiClient from '../api/apiClient';
import type { AuthResponse, LoginRequest, RefreshTokenRequest, User } from '../../types/auth';

export const login = async (payload: LoginRequest): Promise<AuthResponse> => {
  // TODO: connect to backend /auth/login
  return Promise.resolve({} as AuthResponse);
};

export const logout = async (): Promise<void> => {
  // TODO: connect to backend /auth/logout
};

export const refreshToken = async (payload: RefreshTokenRequest): Promise<string> => {
  // TODO: connect to backend /auth/refresh-token
  return Promise.resolve(payload.refreshToken);
};

export const getCurrentUser = async (): Promise<User | null> => {
  // TODO: connect to backend /auth/me
  return Promise.resolve(null);
};
