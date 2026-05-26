import { API_BASE_URL } from '@/constants/api';

export function getApiUrl(path: string): string {
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL.replace(/\/$/, '')}${p}`;
}

const USER_AGENT = 'BlagodetiApp/1.0 (Expo)';

export function getApiHeaders(accessToken?: string | null): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'User-Agent': USER_AGENT,
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
  };
}

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
  expiresAt?: string;
};

export type RefreshResult =
  | { ok: true; tokens: AuthTokens }
  | { ok: false; reason: 'invalid' | 'network' };

let refreshInFlight: Promise<RefreshResult> | null = null;

/** Один refresh на все параллельные 401 (ротация refresh-токена на сервере). */
export async function refreshAuthTokens(
  refreshToken: string,
): Promise<RefreshResult> {
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async (): Promise<RefreshResult> => {
    try {
      const refreshRes = await fetch(getApiUrl('/auth/refresh'), {
        method: 'POST',
        headers: getApiHeaders(null),
        body: JSON.stringify({ refreshToken }),
      });
      if (refreshRes.status === 401 || refreshRes.status === 403) {
        return { ok: false, reason: 'invalid' };
      }
      if (!refreshRes.ok) {
        return { ok: false, reason: 'network' };
      }
      const tokens = (await refreshRes.json()) as AuthTokens;
      if (!tokens.accessToken || !tokens.refreshToken) {
        return { ok: false, reason: 'invalid' };
      }
      return { ok: true, tokens };
    } catch {
      return { ok: false, reason: 'network' };
    }
  })().finally(() => {
    refreshInFlight = null;
  });

  return refreshInFlight;
}

async function isBlockedAccountResponse(res: Response): Promise<boolean> {
  try {
    const json = (await res.clone().json()) as { error?: string; message?: string };
    return (
      json.error === 'Blocked' ||
      (typeof json.message === 'string' &&
        json.message.toLowerCase().includes('заблокирован'))
    );
  } catch {
    return false;
  }
}

export type AuthApi = {
  getAccessToken: () => string | null;
  getRefreshToken: () => string | null;
  setTokens: (t: {
    accessToken: string;
    refreshToken: string;
    expiresAt?: string;
  }) => Promise<void>;
  clearTokens: () => Promise<void>;
  onSessionLost: (blocked?: boolean) => void;
};

/**
 * fetch с Bearer, при 401 — refresh и повтор.
 * Выход только если refresh-токен недействителен (не при сетевой ошибке).
 */
export async function fetchWithAuth(
  path: string,
  options: RequestInit & { skipAuth?: boolean } = {},
  auth: AuthApi,
): Promise<Response> {
  const { skipAuth, ...fetchOptions } = options;
  const url = getApiUrl(path);
  const token = auth.getAccessToken();
  const headers = new Headers(fetchOptions.headers as HeadersInit);
  Object.entries(getApiHeaders(token)).forEach(([k, v]) => headers.set(k, v));

  let res = await fetch(url, { ...fetchOptions, headers });

  if (res.status === 401 && !skipAuth) {
    const refresh = auth.getRefreshToken();
    if (refresh) {
      const refreshed = await refreshAuthTokens(refresh);
      if (refreshed.ok) {
        await auth.setTokens({
          accessToken: refreshed.tokens.accessToken,
          refreshToken: refreshed.tokens.refreshToken,
          expiresAt: refreshed.tokens.expiresAt,
        });
        headers.set('Authorization', `Bearer ${refreshed.tokens.accessToken}`);
        res = await fetch(url, { ...fetchOptions, headers });
      } else if (refreshed.reason === 'invalid') {
        await auth.clearTokens();
        auth.onSessionLost(false);
        return res;
      }
      // network: не разлогиниваем — пусть экран обработает !res.ok
    } else {
      await auth.clearTokens();
      auth.onSessionLost(false);
    }
    return res;
  }

  if (res.status === 403 && (await isBlockedAccountResponse(res))) {
    await auth.clearTokens();
    auth.onSessionLost(true);
  }
  return res;
}
