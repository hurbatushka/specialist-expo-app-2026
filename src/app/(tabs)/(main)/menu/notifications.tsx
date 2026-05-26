import { useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
  type ViewToken,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { PushPermissionBanner } from "@/components/settings/PushPermissionBanner";
import { ThemedView } from "@/components/themed-view";
import {
  BorderRadius,
  BottomTabInset,
  Fonts,
  Spacing,
} from "@/constants/theme";
import { useAuth } from "@/contexts/auth-context";
import { useNotificationUnread } from "@/contexts/notification-unread-context";
import { useTheme } from "@/hooks/use-theme";
import { fetchWithAuth } from "@/lib/api";
import { navigateFromPushData } from "@/lib/push-navigation";
import { parseLessonIdsFromNotificationData } from "@/lib/schedule-shared";

type NotificationItem = {
  id: string;
  title: string;
  body: string;
  context: string;
  data: Record<string, unknown> | null;
  lessonId: string | null;
  readAt: string | null;
  createdAt: string;
};

function navigateFromNotification(
  router: ReturnType<typeof useRouter>,
  item: NotificationItem,
) {
  const lessonIds = parseLessonIdsFromNotificationData(item.data);
  navigateFromPushData(router, {
    type: item.context,
    ...(lessonIds.length > 0
      ? { lessonIds: lessonIds.join(",") }
      : item.lessonId
        ? { lessonId: item.lessonId }
        : {}),
  });
}

export default function NotificationsScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { authApi } = useAuth();
  const { refreshUnread } = useNotificationUnread();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const visibleMarked = useRef(new Set<string>());

  const markRead = useCallback(
    async (id: string) => {
      await fetchWithAuth(
        `/specialist/notifications/${id}/read`,
        { method: "POST" },
        authApi,
      );
      setItems((prev) =>
        prev.map((n) =>
          n.id === id ? { ...n, readAt: new Date().toISOString() } : n,
        ),
      );
      void refreshUnread();
    },
    [authApi, refreshUnread],
  );

  const markVisibleRead = useCallback(
    async (ids: string[]) => {
      const fresh = ids.filter((id) => !visibleMarked.current.has(id));
      if (fresh.length === 0) return;
      fresh.forEach((id) => visibleMarked.current.add(id));
      await fetchWithAuth(
        "/specialist/notifications/read-visible",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids: fresh }),
        },
        authApi,
      );
      const now = new Date().toISOString();
      setItems((prev) =>
        prev.map((n) =>
          fresh.includes(n.id) && !n.readAt ? { ...n, readAt: now } : n,
        ),
      );
      void refreshUnread();
    },
    [authApi, refreshUnread],
  );

  const loadPage = useCallback(
    async (cursor?: string | null, append = false) => {
      const q = cursor ? `?cursor=${encodeURIComponent(cursor)}&limit=30` : "?limit=30";
      const res = await fetchWithAuth(`/specialist/notifications${q}`, { method: "GET" }, authApi);
      if (!res.ok) return;
      const data = (await res.json()) as {
        items: NotificationItem[];
        nextCursor: string | null;
      };
      setNextCursor(data.nextCursor ?? null);
      setItems((prev) => (append ? [...prev, ...data.items] : data.items));
    },
    [authApi],
  );

  const refresh = useCallback(async () => {
    setRefreshing(true);
    visibleMarked.current.clear();
    await loadPage(null, false);
    setRefreshing(false);
  }, [loadPage]);

  const markAllRead = useCallback(async () => {
    setMarkingAll(true);
    try {
      const res = await fetchWithAuth(
        "/specialist/notifications/read-all",
        { method: "POST" },
        authApi,
      );
      if (!res.ok) return;
      const now = new Date().toISOString();
      setItems((prev) => prev.map((n) => ({ ...n, readAt: n.readAt ?? now })));
      visibleMarked.current.clear();
      void refreshUnread();
    } finally {
      setMarkingAll(false);
    }
  }, [authApi, refreshUnread]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      await loadPage(null, false);
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
      void refreshUnread();
    };
  }, [loadPage, refreshUnread]);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      const unreadIds = viewableItems
        .map((v) => v.item as NotificationItem)
        .filter((n) => !n.readAt)
        .map((n) => n.id);
      if (unreadIds.length > 0) void markVisibleRead(unreadIds);
    },
  ).current;

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 55 }).current;

  return (
    <ThemedView style={styles.root}>
      <PushPermissionBanner />
      {items.length > 0 && (
        <Pressable
          onPress={() => void markAllRead()}
          disabled={markingAll}
          style={styles.markAllBtn}
        >
          <Text style={[styles.markAllText, { color: theme.primary }]}>
            {markingAll ? "…" : "Прочитать все"}
          </Text>
        </Pressable>
      )}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={theme.primary} />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{
            padding: Spacing.three,
            paddingBottom: BottomTabInset + Spacing.four,
          }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={refresh} />
          }
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          onEndReached={() => {
            if (!nextCursor || loadingMore) return;
            setLoadingMore(true);
            void loadPage(nextCursor, true).finally(() => setLoadingMore(false));
          }}
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons
                name="notifications-off-outline"
                size={48}
                color={theme.textSecondary}
              />
              <Text style={[styles.empty, { color: theme.textSecondary }]}>
                Пока нет уведомлений
              </Text>
            </View>
          }
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator style={{ marginVertical: 12 }} color={theme.primary} />
            ) : null
          }
          renderItem={({ item }) => {
            const unread = !item.readAt;
            return (
              <Pressable
                onPress={() => {
                  void markRead(item.id);
                  navigateFromNotification(router, item);
                }}
                style={[
                  styles.card,
                  {
                    backgroundColor: unread
                      ? `${theme.primary}12`
                      : theme.backgroundElement,
                    borderColor: theme.backgroundElement,
                  },
                ]}
              >
                <View style={styles.cardHeader}>
                  <Text
                    style={[
                      styles.cardTitle,
                      {
                        color: theme.text,
                        fontFamily: unread ? Fonts.sansSemiBold : Fonts.sansMedium,
                      },
                    ]}
                  >
                    {item.title}
                  </Text>
                  {unread && (
                    <View
                      style={[styles.dot, { backgroundColor: theme.primary }]}
                    />
                  )}
                </View>
                <Text style={[styles.cardBody, { color: theme.textSecondary }]}>
                  {item.body}
                </Text>
                <Text style={[styles.cardDate, { color: theme.textSecondary }]}>
                  {new Date(item.createdAt).toLocaleString("ru-RU", {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Text>
              </Pressable>
            );
          }}
        />
      )}
      <SafeAreaView edges={["bottom"]} />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  markAllBtn: {
    alignSelf: "flex-end",
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.one,
  },
  markAllText: {
    fontFamily: Fonts.sansMedium,
    fontSize: 14,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.four,
    gap: 12,
  },
  empty: {
    fontFamily: Fonts.sans,
    fontSize: 15,
    textAlign: "center",
  },
  card: {
    borderRadius: BorderRadius.card,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.three,
    marginBottom: Spacing.two,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  cardTitle: {
    flex: 1,
    fontSize: 16,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  cardBody: {
    fontFamily: Fonts.sans,
    fontSize: 14,
    marginTop: 6,
    lineHeight: 20,
  },
  cardDate: {
    fontFamily: Fonts.sans,
    fontSize: 12,
    marginTop: 8,
  },
});
