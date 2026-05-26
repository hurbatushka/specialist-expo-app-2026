import "@/lib/install-error-handler";

import {
  Nunito_400Regular,
  Nunito_500Medium,
  Nunito_600SemiBold,
  Nunito_700Bold,
  useFonts,
} from "@expo-google-fonts/nunito";
import { type Href, Slot, usePathname, useRouter } from "expo-router";
import * as QuickActions from "expo-quick-actions";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useRef } from "react";
import { InteractionManager } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { AuthGate } from "@/components/auth-gate";
import { AppErrorBoundary } from "@/components/app-error-boundary";
import { AuthProvider, useAuth } from "@/contexts/auth-context";
import { SpecialistScheduleProvider } from "@/contexts/specialist-schedule-context";
import {
  NotificationUnreadProvider,
  useNotificationUnread,
} from "@/contexts/notification-unread-context";
import { ThemeProvider } from "@/contexts/theme-context";
import { HOME_ROUTE } from "@/lib/auth-routes";
import { dismissKeyboardAndWait } from "@/lib/keyboard-navigation";
import { hasSeenOnboarding } from "@/lib/onboarding";
import { MobilePresenceReporter } from "@/components/mobile-presence-reporter";
import { openExternalUrl } from "@/lib/open-external-url";
import {
  configureHomeScreenQuickActions,
  isExternalQuickActionHref,
} from "@/lib/quick-actions-setup";
import {
  registerNotificationNavigation,
  setupExpoPushNotifications,
} from "@/lib/push-notifications";

try {
  SplashScreen.preventAutoHideAsync();
} catch {
  /* ignore — splash может быть уже скрыт */
}

/** ErrorBoundary для expo-router, чтобы навигационные ошибки не валили приложение. */
export { ErrorBoundary } from "expo-router";

function AuthenticatedProviders({ children }: { children: React.ReactNode }) {
  return (
    <NotificationUnreadProvider>
      <SpecialistScheduleProvider>{children}</SpecialistScheduleProvider>
    </NotificationUnreadProvider>
  );
}

function RootLayoutContent() {
  const pathname = usePathname();
  const router = useRouter();
  const { isReady, isSignedIn, authApi } = useAuth();
  const { refreshUnread } = useNotificationUnread();

  const onboardingGenRef = useRef(0);

  useEffect(() => {
    try {
      setupExpoPushNotifications();
    } catch (err) {
      console.warn("[push] setup failed:", err);
    }
    void configureHomeScreenQuickActions();
  }, []);

  useEffect(() => {
    const handleQuickAction = (action: QuickActions.Action) => {
      const href = action.params?.href;
      if (isExternalQuickActionHref(href)) {
        void openExternalUrl(href);
        return;
      }
      if (typeof href !== "string" || !href.startsWith("/")) return;
      if (!isReady) return;
      try {
        router.push(href as Href);
      } catch (err) {
        console.warn("[quick-actions] navigate failed:", err);
      }
    };

    if (QuickActions.initial) {
      handleQuickAction(QuickActions.initial);
    }
    const sub = QuickActions.addListener(handleQuickAction);
    return () => sub.remove();
  }, [isReady, router]);

  useEffect(() => {
    const onHome =
      pathname === "/" ||
      pathname === HOME_ROUTE ||
      pathname?.startsWith(`${HOME_ROUTE}/`);
    if (!isReady || !isSignedIn || !onHome) return;

    const gen = ++onboardingGenRef.current;
    let cancelled = false;

    void dismissKeyboardAndWait()
      .then(() => {
        if (cancelled || onboardingGenRef.current !== gen) return;
        return new Promise<void>((resolve) => {
          InteractionManager.runAfterInteractions(() => resolve());
        });
      })
      .then(() => {
        if (cancelled || onboardingGenRef.current !== gen) return;
        return hasSeenOnboarding();
      })
      .then((seen) => {
        if (cancelled || onboardingGenRef.current !== gen) return;
        if (seen === false) {
          try {
            router.replace("/first-steps");
          } catch (err) {
            console.warn("[onboarding] navigate failed:", err);
          }
        }
      })
      .catch((err) => {
        console.warn("[onboarding] effect failed:", err);
      });

    return () => {
      cancelled = true;
    };
  }, [pathname, router, isReady, isSignedIn]);

  useEffect(() => {
    if (!isSignedIn) return;
    try {
      return registerNotificationNavigation(router, authApi, {
        onNotificationReceived: () => {
          void refreshUnread();
        },
      });
    } catch (err) {
      console.warn("[push] registerNotificationNavigation failed:", err);
      return undefined;
    }
  }, [isSignedIn, router, authApi, refreshUnread]);

  return (
    <>
      {isSignedIn ? <MobilePresenceReporter auth={authApi} /> : null}
      <Slot />
    </>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Nunito_400Regular,
    Nunito_500Medium,
    Nunito_600SemiBold,
    Nunito_700Bold,
  });

  return (
    <AppErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <ThemeProvider>
          <AuthProvider>
            <AuthenticatedProviders>
              <AuthBootstrap fontsLoaded={fontsLoaded} />
            </AuthenticatedProviders>
          </AuthProvider>
        </ThemeProvider>
      </GestureHandlerRootView>
    </AppErrorBoundary>
  );
}

/** Splash до шрифтов + восстановления сессии; затем AuthGate и маршруты. */
function AuthBootstrap({ fontsLoaded }: { fontsLoaded: boolean }) {
  const { isReady } = useAuth();

  useEffect(() => {
    if (fontsLoaded && isReady) {
      void SplashScreen.hideAsync().catch(() => {
        /* ignore */
      });
    }
  }, [fontsLoaded, isReady]);

  if (!fontsLoaded || !isReady) {
    return null;
  }

  return (
    <AuthGate>
      <RootLayoutContent />
    </AuthGate>
  );
}
