import type { UserRole } from '../constants/roles';

export interface LoginRequest {
  email: string;
  password: string;
  username?: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken?: string;
  tokenType?: string;
  expiresIn?: number;
  userId?: string;
  email?: string;
  fullName?: string;
  studentOrStaffCode?: string;
  roleName?: string;
  user?: User;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface User {
  id: number | string;
  userId?: string;
  username?: string;
  email: string;
  fullName: string;
  role: UserRole;
  status?: string;
  studentOrStaffCode?: string;
}
