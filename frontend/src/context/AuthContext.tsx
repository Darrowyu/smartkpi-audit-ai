import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { authApi, AuthUser } from '../api/auth.api';
import { getToken, removeToken } from '../api/client';
import { toast } from '@/components/ui/use-toast';

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const IDLE_TIMEOUT_MS = 15 * 60 * 1000;
const EXTEND_THRESHOLD_MS = 2 * 60 * 1000;
const EXTEND_THROTTLE_MS = 30 * 1000;
const ACTIVITY_KEY = 'smartkpi_last_activity';
const FORCE_LOGOUT_KEY = 'smartkpi_force_logout';

const decodeJwtPayload = (token: string): Record<string, unknown> | null => {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    const json = atob(padded);
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
};

const getTokenExpMs = (token: string): number | null => {
  const payload = decodeJwtPayload(token);
  const exp = payload?.exp;
  if (typeof exp !== 'number') return null;
  return exp * 1000;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const extendingRef = useRef(false);
  const lastExtendAttemptRef = useRef(0);

  const clearIdleTimer = useCallback(() => {
    if (!idleTimerRef.current) return;
    clearTimeout(idleTimerRef.current);
    idleTimerRef.current = null;
  }, []);

  const forceLogout = useCallback((reason: 'idle' | 'remote') => {
    authApi.logout();
    setUser(null);

    if (reason === 'idle') {
      toast({
        title: '会话超时',
        description: '您已15分钟未操作，为保障安全已退出登录，请重新登录。',
        variant: 'destructive',
      });
    } else {
      toast({
        title: '已退出登录',
        description: '您的账号已在其他页面/设备退出，请重新登录。',
        variant: 'destructive',
      });
    }
  }, []);

  const maybeExtendSession = useCallback(async () => {
    if (extendingRef.current) return;

    const now = Date.now();
    if (now - lastExtendAttemptRef.current < EXTEND_THROTTLE_MS) return;

    const token = getToken();
    if (!token) return;

    const expMs = getTokenExpMs(token);
    if (!expMs) return;

    if (expMs - now > EXTEND_THRESHOLD_MS) return;

    extendingRef.current = true;
    lastExtendAttemptRef.current = now;

    try {
      await authApi.extendSession();
    } catch {
      // ignore
    } finally {
      extendingRef.current = false;
    }
  }, []);

  const resetIdleTimer = useCallback((syncToOtherTabs: boolean) => {
    if (!getToken()) return;

    clearIdleTimer();
    idleTimerRef.current = setTimeout(() => {
      try {
        localStorage.setItem(FORCE_LOGOUT_KEY, String(Date.now()));
      } catch {}
      forceLogout('idle');
    }, IDLE_TIMEOUT_MS);

    if (syncToOtherTabs) {
      try {
        localStorage.setItem(ACTIVITY_KEY, String(Date.now()));
      } catch {}
    }

    void maybeExtendSession();
  }, [clearIdleTimer, forceLogout, maybeExtendSession]);

  const refreshUser = useCallback(async () => {
    try {
      if (getToken()) {
        const userData = await authApi.getMe();
        setUser(userData);
      }
    } catch {
      removeToken();
      setUser(null);
    }
  }, []);

  useEffect(() => {
    refreshUser().finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    if (!user) {
      clearIdleTimer();
      return;
    }

    resetIdleTimer(true);

    const onActivity = () => resetIdleTimer(true);
    const onStorage = (e: StorageEvent) => {
      if (e.key === ACTIVITY_KEY) resetIdleTimer(false);
      if (e.key === FORCE_LOGOUT_KEY) {
        clearIdleTimer();
        forceLogout('remote');
      }
    };

    const options: AddEventListenerOptions = { passive: true };
    window.addEventListener('mousemove', onActivity, options);
    window.addEventListener('mousedown', onActivity, options);
    window.addEventListener('keydown', onActivity);
    window.addEventListener('scroll', onActivity, options);
    window.addEventListener('touchstart', onActivity, options);
    window.addEventListener('storage', onStorage);

    return () => {
      clearIdleTimer();
      window.removeEventListener('mousemove', onActivity);
      window.removeEventListener('mousedown', onActivity);
      window.removeEventListener('keydown', onActivity);
      window.removeEventListener('scroll', onActivity);
      window.removeEventListener('touchstart', onActivity);
      window.removeEventListener('storage', onStorage);
    };
  }, [user, clearIdleTimer, forceLogout, resetIdleTimer]);

  const login = useCallback(async (username: string, password: string) => {
    await authApi.login({ username, password });
    await refreshUser(); // 登录后获取完整用户信息（含permissions）
    resetIdleTimer(true);
  }, [refreshUser, resetIdleTimer]);

  const logout = useCallback(() => {
    try {
      localStorage.setItem(FORCE_LOGOUT_KEY, String(Date.now()));
    } catch {}
    authApi.logout();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, isAuthenticated: !!user, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
