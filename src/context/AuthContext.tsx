import { createContext, useContext, useMemo, useState } from 'react';
import type { User, LoginRequest } from '../types/auth';
import { storage } from '../utils/storage';

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  login: (payload: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  getCurrentUser: () => Promise<User | null>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const AUTH_STORAGE_KEY = 'swd_auth_user';

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(() => storage.get<User>(AUTH_STORAGE_KEY));

  const login = async (_payload: LoginRequest): Promise<void> => {
    // TODO: integrate with authService.login
    // This placeholder intentionally does not create fake auth data.
  };

  const logout = async (): Promise<void> => {
    storage.remove(AUTH_STORAGE_KEY);
    setUser(null);
  };

  const refreshToken = async (): Promise<void> => {
    // TODO: integrate with authService.refreshToken
  };

  const getCurrentUser = async (): Promise<User | null> => {
    // TODO: integrate with authService.getCurrentUser
    return user;
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
