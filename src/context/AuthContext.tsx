import { createContext, useContext, useMemo, useState } from 'react';
import type { User, LoginRequest } from '../types/auth';
import { storage } from '../utils/storage';
import * as authService from '../services/auth/authService';

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  login: (payload: LoginRequest) => Promise<User>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  getCurrentUser: () => Promise<User | null>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const AUTH_STORAGE_KEY = 'swd_auth_user';
const FALLBACK_STORAGE_KEY = 'user';

function getInitialUser(): User | null {
  try {
    const fromSwd = storage.get<User>(AUTH_STORAGE_KEY);
    if (fromSwd) return fromSwd;
    const fromUser = storage.get<User>(FALLBACK_STORAGE_KEY);
    if (fromUser) return fromUser;
  } catch {
    // ignore
  }
  return null;
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(getInitialUser);

  const login = async (payload: LoginRequest): Promise<User> => {
    const authResponse = await authService.login(payload);
    const loggedInUser: User = authResponse.user || {
      id: authResponse.userId || 1,
      email: authResponse.email || payload.email,
      fullName: authResponse.fullName || '',
      role: (authResponse.roleName || 'STUDENT') as any,
      studentOrStaffCode: authResponse.studentOrStaffCode,
    };

    storage.set(AUTH_STORAGE_KEY, loggedInUser);
    storage.set(FALLBACK_STORAGE_KEY, loggedInUser);
    setUser(loggedInUser);
    return loggedInUser;
  };

  const logout = async (): Promise<void> => {
    try {
      await authService.logout();
    } finally {
      storage.remove(AUTH_STORAGE_KEY);
      storage.remove(FALLBACK_STORAGE_KEY);
      localStorage.removeItem('accessToken');
      setUser(null);
    }
  };

  const refreshToken = async (): Promise<void> => {
    // Refresh token placeholder
  };

  const getCurrentUser = async (): Promise<User | null> => {
    try {
      const currentUser = await authService.getCurrentUser();
      if (currentUser) {
        storage.set(AUTH_STORAGE_KEY, currentUser);
        storage.set(FALLBACK_STORAGE_KEY, currentUser);
        setUser(currentUser);
      }
      return currentUser;
    } catch {
      return user;
    }
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      login,
      logout,
      refreshToken,
      getCurrentUser,
    }),
    [user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuthContext must be used within AuthProvider');
  }

  return context;
};

export default AuthContext;
