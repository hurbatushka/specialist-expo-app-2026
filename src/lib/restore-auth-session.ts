import { getApiUrl, getApiHeaders, refreshAuthTokens, type AuthTokens } from '@/lib/api';
import { getStoredTokens, setStoredTokens } from '@/lib/auth-storage';

export type RestoreAuthResult =
  | { status: 'signed_out' }
  | { status: 'blocked' }
  | { status: 'signed_in'; tokens: AuthTokens };

let bootstrapPromise: Promise<RestoreAuthResult> | null = null;

async function checkAccessToken(accessToken: string): Promise<number | 'network_error'> {
  try {
    const res = await fetch(getApiUrl('/auth/check'), {
      method: 'GET',
      headers: getApiHeaders(accessToken),
    });
    return res.status;
  } catch {
    return 'network_error';
  }
}

async function restoreAuthSessionOnce(): Promise<RestoreAuthResult> {
  const stored = await getStoredTokens();
  if (!stored.accessToken || !stored.refreshToken) {
    return { status: 'signed_out' };
  }

  let accessToken = stored.accessToken;
  let refreshToken = stored.refreshToken;
  let expiresAt = stored.expiresAt ?? undefined;

  const applyRefresh = async (rt: string): Promise<RestoreAuthResult | null> => {
    const refreshed = await refreshAuthTokens(rt);
    if (!refreshed.ok) {
      if (refreshed.reason === 'invalid') return { status: 'signed_out' };
      return null;
    }
    await setStoredTokens(refreshed.tokens);
    accessToken = refreshed.tokens.accessToken;
    refreshToken = refreshed.tokens.refreshToken;
    expiresAt = refreshed.tokens.expiresAt;
    return {
      status: 'signed_in',
      tokens: { accessToken, refreshToken, expiresAt },
    };
  };

  let checkStatus = await checkAccessToken(accessToken);

  if (checkStatus === 401) {
    const afterRefresh = await applyRefresh(refreshToken);
    return afterRefresh ?? { status: 'signed_out' };
  }

  if (checkStatus === 200) {
    return {
      status: 'signed_in',
      tokens: { accessToken, refreshToken, expiresAt },
    };
  }
  if (checkStatus === 403) {
    return { status: 'blocked' };
  }

  // Сеть / 5xx: пробуем refresh; если не вышло — оставляем локальную сессию
  if (checkStatus === 'network_error') {
    const afterRefresh = await applyRefresh(refreshToken);
    if (afterRefresh) return afterRefresh;
    return {
      status: 'signed_in',
      tokens: { accessToken, refreshToken, expiresAt },
    };
  }

  return { status: 'signed_out' };
}

/** Один bootstrap на всё приложение (защита от двойного Strict Mode / параллельного restore). */
export function bootstrapAuthSession(): Promise<RestoreAuthResult> {
  if (!bootstrapPromise) {
    bootstrapPromise = restoreAuthSessionOnce();
  }
  return bootstrapPromise;
}

/** Сброс после logout (следующий старт снова восстановит сессию). */
export function resetAuthBootstrap(): void {
  bootstrapPromise = null;
}
