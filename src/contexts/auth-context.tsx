import {
  getApiUrl,
  getApiHeaders,
  type AuthApi,
} from '@/lib/api';
import {
  clearStoredTokens,
  setStoredTokens,
} from '@/lib/auth-storage';
import {
  bootstrapAuthSession,
  resetAuthBootstrap,
} from '@/lib/restore-auth-session';
import React, {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  registerPushTokenSyncOnAppState,
  syncPushToken,
} from '@/lib/push-notifications';

export type AuthState = {
  isReady: boolean;
  isSignedIn: boolean;
  isBlocked: boolean;
};

export type LoginCredentials = {
  emailOrPhone: string;
  password: string;
};

export type AuthContextValue = AuthState & {
    login: (creds: LoginCredentials, device?: DeviceInfo) => Promise<LoginResult>;
    /** После успешного login() — когда клавиатура уже скрыта (см. login.tsx). */
  activateSession: () => void;
  logout: () => Promise<void>;
  authApi: AuthApi;
  clearBlocked: () => void;
};

export type DeviceInfo = {
  deviceFingerprint?: string;
  deviceName?: string;
  os?: string;
  platform?: string;
  browser?: string;
};

export type LoginResult =
  | { ok: true }
  | {
      ok: false;
      status: number;
      message?: string;
      blocked?: boolean;
      role?: 'CLIENT' | 'ADMIN';
    };

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    isReady: false,
    isSignedIn: false,
    isBlocked: false,
  });
  const tokensRef = useRef<{
    accessToken: string | null;
    refreshToken: string | null;
  }>({ accessToken: null, refreshToken: null });
  const sessionLostHandled = useRef(false);

  const storeSessionTokens = useCallback(
    async (t: {
      accessToken: string;
      refreshToken: string;
      expiresAt?: string;
    }) => {
      await setStoredTokens(t);
      tokensRef.current = {
        accessToken: t.accessToken,
        refreshToken: t.refreshToken,
      };
      sessionLostHandled.current = false;
    },
    [],
  );

  const activateSession = useCallback(() => {
    setState({ isReady: true, isSignedIn: true, isBlocked: false });
  }, []);

  const applySessionTokens = useCallback(
    async (t: {
      accessToken: string;
      refreshToken: string;
      expiresAt?: string;
    }) => {
      await storeSessionTokens(t);
      activateSession();
    },
    [storeSessionTokens, activateSession],
  );

  const clearTokens = useCallback(async () => {
    await clearStoredTokens();
    tokensRef.current = { accessToken: null, refreshToken: null };
    setState((s) => ({ ...s, isSignedIn: false }));
  }, []);

  const onSessionLost = useCallback(
    (blocked?: boolean) => {
      if (sessionLostHandled.current) return;
      sessionLostHandled.current = true;
      tokensRef.current = { accessToken: null, refreshToken: null };
      void clearStoredTokens();
      resetAuthBootstrap();
      setState({
        isReady: true,
        isSignedIn: false,
        isBlocked: blocked ?? false,
      });
    },
    [],
  );

  const authApi: AuthApi = useMemo(
    () => ({
      getAccessToken: () => tokensRef.current.accessToken,
      getRefreshToken: () => tokensRef.current.refreshToken,
      setTokens: applySessionTokens,
      clearTokens,
      onSessionLost,
    }),
    [applySessionTokens, clearTokens, onSessionLost],
  );

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const result = await bootstrapAuthSession();
        if (cancelled) return;

        if (result.status === 'signed_in') {
          await applySessionTokens(result.tokens);
          return;
        }

        if (result.status === 'blocked') {
          await clearStoredTokens();
          tokensRef.current = { accessToken: null, refreshToken: null };
          setState({ isReady: true, isSignedIn: false, isBlocked: true });
          return;
        }

        tokensRef.current = { accessToken: null, refreshToken: null };
        setState({ isReady: true, isSignedIn: false, isBlocked: false });
      } catch {
        if (cancelled) return;
        setState({ isReady: true, isSignedIn: false, isBlocked: false });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [applySessionTokens]);

  const login = useCallback(
    async (
      creds: LoginCredentials,
      device?: DeviceInfo,
    ): Promise<LoginResult> => {
      try {
        resetAuthBootstrap();
        const body = {
          emailOrPhone: creds.emailOrPhone.trim(),
          password: creds.password,
          ...(device && { device }),
        };
        const res = await fetch(getApiUrl('/auth/specialist/login'), {
          method: 'POST',
          headers: getApiHeaders(null),
          body: JSON.stringify(body),
        });
        if (res.status === 200) {
          const data = (await res.json()) as {
            accessToken: string;
            refreshToken: string;
            expiresAt?: string;
          };
          // Токены сохраняем сразу; isSignedIn — после dismiss клавиатуры в login.tsx.
          await storeSessionTokens({
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
            expiresAt: data.expiresAt,
          });
          return { ok: true };
        }
        if (res.status === 403) {
          const json = (await res.json().catch(() => ({}))) as {
            message?: string;
            role?: 'CLIENT' | 'ADMIN';
          };
          if (json.role === 'CLIENT') {
            return {
              ok: false,
              status: 403,
              message: 'Это приложение для специалистов. Установите клиентское приложение.',
              role: 'CLIENT',
            };
          }
          if (json.role === 'ADMIN') {
            return {
              ok: false,
              status: 403,
              message: 'Воспользуйтесь сайтом',
              role: 'ADMIN',
            };
          }
          await clearTokens();
          setState({ isReady: true, isSignedIn: false, isBlocked: true });
          return {
            ok: false,
            status: 403,
            blocked: true,
            message: json.message ?? 'Аккаунт заблокирован',
          };
        }
        const json = await res.json().catch(() => ({}));
        return {
          ok: false,
          status: res.status,
          message:
            (json as { message?: string }).message ??
            'Неверный email/телефон или пароль',
        };
      } catch (err) {
        const msg =
          err instanceof TypeError && err.message === 'Network request failed'
            ? 'Сервер недоступен. Проверьте подключение к интернету и что API запущен.'
            : 'Ошибка соединения. Попробуйте позже.';
        return { ok: false, status: 0, message: msg };
      }
    },
    [storeSessionTokens, clearTokens],
  );

  const logout = useCallback(async () => {
    const refreshToken = tokensRef.current.refreshToken;
    if (refreshToken) {
      try {
        await fetch(getApiUrl('/auth/logout'), {
          method: 'POST',
          headers: getApiHeaders(null),
          body: JSON.stringify({ refreshToken }),
        });
      } catch {
        /* офлайн */
      }
    }
    resetAuthBootstrap();
    await clearTokens();
    setState((s) => ({ ...s, isBlocked: false, isReady: true }));
  }, [clearTokens]);

  const clearBlocked = useCallback(() => {
    setState((s) => ({ ...s, isBlocked: false }));
  }, []);

  useEffect(() => {
    if (!state.isSignedIn || !state.isReady) return;
    // Тихий sync без iOS-диалога: токен зарегистрируется только если разрешение
    // уже granted (после онбординга или системных настроек).
    void syncPushToken(authApi, { maxAttempts: 2 });
    const t = setTimeout(() => {
      void syncPushToken(authApi, { maxAttempts: 2 });
    }, 2500);
    const stopAppState = registerPushTokenSyncOnAppState(authApi);
    return () => {
      clearTimeout(t);
      stopAppState();
    };
  }, [state.isSignedIn, state.isReady, authApi]);

  const value: AuthContextValue = {
    ...state,
    login,
    activateSession,
    logout,
    authApi,
    clearBlocked,
  };

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
