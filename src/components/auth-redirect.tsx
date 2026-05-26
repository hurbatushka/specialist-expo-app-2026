import { usePathname, useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { InteractionManager } from 'react-native';

import {
  HOME_ROUTE,
  isAuthOnlyRoute,
  isProtectedRoute,
} from '@/lib/auth-routes';
import { dismissKeyboardAndWait } from '@/lib/keyboard-navigation';

type Props = {
  isReady: boolean;
  isSignedIn: boolean;
};

/**
 * Навигация по сессии после bootstrap.
 * Работает вместе с AuthGate (Slot не монтируется до isReady).
 */
export function AuthRedirect({ isReady, isSignedIn }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const didInitialNav = useRef(false);
  const navGenRef = useRef(0);

  useEffect(() => {
    if (!isReady) {
      didInitialNav.current = false;
      return;
    }

    const path = pathname ?? '/';
    const gen = ++navGenRef.current;

    const goReplace = (href: string) => {
      void dismissKeyboardAndWait()
        .then(() => {
          if (navGenRef.current !== gen) return;
          try {
            router.replace(href as Parameters<typeof router.replace>[0]);
          } catch (err) {
            console.warn('[auth-redirect] replace failed:', href, err);
          }
        })
        .catch((err) => {
          console.warn('[auth-redirect] dismissKeyboard failed:', err);
        });
    };

    if (!didInitialNav.current) {
      didInitialNav.current = true;
      if (isSignedIn) {
        if (isAuthOnlyRoute(path) || path === '/') {
          goReplace(HOME_ROUTE);
        }
        return;
      }
      if (isProtectedRoute(path)) {
        goReplace('/login');
      }
      return;
    }

    if (isSignedIn && isAuthOnlyRoute(path)) {
      goReplace(HOME_ROUTE);
      return;
    }
    if (!isSignedIn && isProtectedRoute(path)) {
      goReplace('/login');
    }
  }, [isReady, isSignedIn, pathname, router]);

  return null;
}
