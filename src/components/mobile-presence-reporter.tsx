import { useEffect, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { usePathname } from 'expo-router';

import type { AuthApi } from '@/lib/api';
import { fetchWithAuth } from '@/lib/api';

const HEARTBEAT_MS = 12_000;

/** Нормализация expo-route → pathname для монитора (/app/…). */
function toPresencePathname(expoPath: string): string {
  let p = (expoPath || '/').replace(/\/\([^)]+\)/g, '') || '/';
  p = p.replace(/\/+/g, '/');
  if (p === '/') return '/app/';
  return p.startsWith('/app') ? p : `/app${p}`;
}

function sendPresence(
  auth: AuthApi,
  pathname: string,
  visible: boolean,
): void {
  void fetchWithAuth(
    '/realtime/presence',
    {
      method: 'POST',
      body: JSON.stringify({ pathname, visible }),
    },
    auth,
  ).catch(() => {
    /* ignore */
  });
}

function sendLeave(auth: AuthApi): void {
  void fetchWithAuth('/realtime/presence?leave=1', { method: 'POST' }, auth).catch(() => {
    /* ignore */
  });
}

/** Heartbeat «Кто онлайн» для приложения специалиста. */
export function MobilePresenceReporter({ auth }: { auth: AuthApi }) {
  const expoPath = usePathname() ?? '/';
  const pathname = toPresencePathname(expoPath);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      appStateRef.current = next;
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    const tick = () => {
      const visible = appStateRef.current === 'active';
      sendPresence(auth, pathname, visible);
    };

    tick();
    const id = setInterval(tick, HEARTBEAT_MS);
    return () => {
      clearInterval(id);
      sendLeave(auth);
    };
  }, [auth, pathname]);

  return null;
}
