import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { AppState } from "react-native";
import { usePathname } from "expo-router";

import { useAuth } from "@/contexts/auth-context";
import { fetchWithAuth } from "@/lib/api";

type NotificationUnreadState = {
  unreadCount: number;
  refreshUnread: () => Promise<void>;
};

const NotificationUnreadContext = createContext<NotificationUnreadState | null>(
  null,
);

export function NotificationUnreadProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { authApi, isSignedIn, isReady } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  const refreshUnread = useCallback(async () => {
    if (!isReady || !isSignedIn) {
      setUnreadCount(0);
      return;
    }
    try {
      const res = await fetchWithAuth(
        "/specialist/notifications/unread-count",
        { method: "GET" },
        authApi,
      );
      if (!res.ok) return;
      const data = (await res.json()) as { unreadCount?: number };
      setUnreadCount(Math.max(0, data.unreadCount ?? 0));
    } catch {
      /* ignore */
    }
  }, [authApi, isSignedIn, isReady]);

  useEffect(() => {
    if (!isReady || !isSignedIn) return;
    void refreshUnread();
  }, [refreshUnread, pathname, isReady, isSignedIn]);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") void refreshUnread();
    });
    return () => sub.remove();
  }, [refreshUnread]);

  useEffect(() => {
    if (!isReady || !isSignedIn) return;
    const id = setInterval(() => {
      if (AppState.currentState === "active") void refreshUnread();
    }, 20_000);
    return () => clearInterval(id);
  }, [isReady, isSignedIn, refreshUnread]);

  const value = useMemo(
    () => ({ unreadCount, refreshUnread }),
    [unreadCount, refreshUnread],
  );

  return (
    <NotificationUnreadContext.Provider value={value}>
      {children}
    </NotificationUnreadContext.Provider>
  );
}

export function useNotificationUnread(): NotificationUnreadState {
  const ctx = useContext(NotificationUnreadContext);
  if (!ctx) {
    throw new Error(
      "useNotificationUnread must be used within NotificationUnreadProvider",
    );
  }
  return ctx;
}
