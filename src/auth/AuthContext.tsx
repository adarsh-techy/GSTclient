import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { setAuthToken } from '../api';
import { login as apiLogin } from '../api';
import type { AuthUser, LoginRequest } from '../types/api';

const USER_STORAGE_KEY = 'gstautopilot.user';

function readStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AuthUser;
    if (!parsed?.emplCode) return null;
    if (parsed.expiresAt && new Date(parsed.expiresAt).getTime() <= Date.now()) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function persistUser(user: AuthUser | null) {
  if (user) {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(USER_STORAGE_KEY);
  }
}

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (credentials: LoginRequest) => Promise<AuthUser>;
  commitAuth: (response: import('../types/api').LoginResponse) => AuthUser;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const stored = readStoredUser();
    if (!stored) {
      setAuthToken(null);
    }
    return stored;
  });

  useEffect(() => {
    const handler = () => {
      setAuthToken(null);
      persistUser(null);
      setUser(null);
    };
    window.addEventListener('gstautopilot:unauthorized', handler);
    return () => window.removeEventListener('gstautopilot:unauthorized', handler);
  }, []);

  const commitAuth = useCallback((response: import('../types/api').LoginResponse): AuthUser => {
    setAuthToken(response.accessToken);
    const nextUser: AuthUser = {
      emplCode: response.emplCode,
      displayName: response.displayName,
      role: response.role,
      tenantId: response.tenantId,
      expiresAt: response.expiresAt,
    };
    persistUser(nextUser);
    setUser(nextUser);
    return nextUser;
  }, []);

  const login = useCallback(async (credentials: LoginRequest): Promise<AuthUser> => {
    const response = await apiLogin(credentials);
    return commitAuth(response);
  }, [commitAuth]);

  const logout = useCallback(() => {
    setAuthToken(null);
    persistUser(null);
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    isAuthenticated: !!user,
    login,
    commitAuth,
    logout,
  }), [user, login, commitAuth, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside an AuthProvider');
  return ctx;
}
