import { createContext, useContext, useCallback, useEffect, useState, type ReactNode } from 'react';
import { authApi } from '../api/auth.api';
import { ApiClientError } from '../lib/apiClient';
import type { CurrentUser } from '../types';

interface AuthContextValue {
  user: CurrentUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: (idToken: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  setUser: (user: CurrentUser | null) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * There is no local/mock user list and no "dev login" shortcut here: the
 * only source of truth for who is signed in is the `/auth/me` endpoint,
 * which reads the httpOnly session cookie set by the real backend.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const { user: me } = await authApi.me();
      setUser(me);
    } catch (err) {
      if (!(err instanceof ApiClientError && err.status === 401)) {
        console.error('Failed to load session', err);
      }
      setUser(null);
    }
  }, []);

  useEffect(() => {
    refreshUser().finally(() => setIsLoading(false));
  }, [refreshUser]);

  const login = useCallback(async (email: string, password: string) => {
    const { user: me } = await authApi.login(email, password);
    setUser(me);
  }, []);

  const loginWithGoogle = useCallback(async (idToken: string) => {
    const { user: me } = await authApi.loginWithGoogle(idToken);
    setUser(me);
  }, []);

  const logout = useCallback(async () => {
    await authApi.logout().catch(() => undefined);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, loginWithGoogle, logout, refreshUser, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
