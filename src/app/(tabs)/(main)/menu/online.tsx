import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Button } from "@/components/ui";
import {
  BorderRadius,
  Fonts,
  MaxContentWidth,
  Spacing,
} from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { fetchWithAuth } from "@/lib/api";
import { getWebAppOrigin } from "@/lib/web-app-origin";
import { useAuth } from "@/contexts/auth-context";

type OnlineLesson = {
  lessonId: string;
  startsAt: string;
  durationMinutes: number;
  serviceName: string | null;
  clientName: string;
  clientChildName: string | null;
  slugFormatted: string;
  clientJoined: boolean;
  ended: boolean;
};

function formatWhen(iso: string): string {
  return new Date(iso).toLocaleString("ru-RU", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function OnlineScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { authApi, isSignedIn } = useAuth();
  const web = getWebAppOrigin();

  const [lessons, setLessons] = useState<OnlineLesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!isSignedIn) {
      setLessons([]);
      setLoading(false);
      return;
    }
    try {
      const res = await fetchWithAuth("/specialist/online/upcoming", {}, authApi);
      if (!res.ok) {
        setLessons([]);
        return;
      }
      const json = (await res.json()) as { lessons?: OnlineLesson[] };
      setLessons(Array.isArray(json.lessons) ? json.lessons : []);
    } catch {
      setLessons([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [authApi, isSignedIn]);

  useEffect(() => {
    setLoading(true);
    void load();
  }, [load]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    void load();
  }, [load]);

  const openWebOnline = () => {
    Linking.openURL(`${web}/online`).catch(() => {});
  };

  const openWebCheck = () => {
    Linking.openURL(`${web}/online/check`).catch(() => {});
  };

  const joinNative = (slugFormatted: string) => {
    router.push(`/room/${slugFormatted}`);
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: Spacing.four, paddingBottom: insets.bottom + Spacing.four },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <ThemedView style={styles.content}>
          <ThemedText type="subtitle" style={{ fontSize: 22 }}>
            Онлайн-занятия
          </ThemedText>

          <Text
            style={{
              fontSize: 14,
              color: theme.textSecondary,
              fontFamily: Fonts.sans,
              lineHeight: 20,
              marginBottom: Spacing.three,
            }}
          >
            Войдите в комнату до начала занятия. Клиент присоединится сам — вы увидите статус
            «Клиент в комнате».
          </Text>

          <Button
            variant="outline"
            size="md"
            fullWidth
            onPress={openWebCheck}
            style={{ marginBottom: Spacing.three }}
          >
            Проверка связи (браузер)
          </Button>

          {loading ? (
            <ActivityIndicator color={theme.primary} style={{ marginVertical: 24 }} />
          ) : lessons.length === 0 ? (
            <ThemedView type="card" style={styles.card}>
              <Text
                style={{
                  fontSize: 15,
                  color: theme.textSecondary,
                  fontFamily: Fonts.sans,
                  textAlign: "center",
                }}
              >
                Нет предстоящих онлайн-занятий. Полная история — в кабинете на сайте.
              </Text>
              <Button
                variant="primary"
                size="md"
                fullWidth
                onPress={openWebOnline}
                style={{ marginTop: Spacing.four }}
              >
                Открыть в браузере
              </Button>
            </ThemedView>
          ) : (
            <ThemedView type="card" style={{ padding: 0, overflow: "hidden" }}>
              {lessons.map((l, idx) => (
                <View
                  key={l.lessonId}
                  style={
                    idx < lessons.length - 1
                      ? {
                          borderBottomWidth: StyleSheet.hairlineWidth,
                          borderBottomColor: theme.backgroundElement,
                        }
                      : undefined
                  }
                >
                  <View style={{ padding: Spacing.four, gap: 6 }}>
                    <Text
                      style={{
                        fontFamily: Fonts.sansSemiBold,
                        fontSize: 16,
                        color: theme.text,
                      }}
                    >
                      {l.clientChildName
                        ? `${l.clientChildName} (${l.clientName})`
                        : l.clientName}
                    </Text>
                    <Text
                      style={{
                        fontFamily: Fonts.sansMedium,
                        fontSize: 14,
                        color: theme.text,
                      }}
                    >
                      {l.serviceName ?? "Онлайн занятие"}
                    </Text>
                    <Text
                      style={{
                        fontSize: 13,
                        color: theme.textSecondary,
                        fontFamily: Fonts.sans,
                      }}
                    >
                      {formatWhen(l.startsAt)} · {l.durationMinutes} мин
                    </Text>
                    {!l.ended ? (
                      <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
                        {l.clientJoined ? (
                          <View style={styles.clientJoinedChip}>
                            <Text style={styles.clientJoinedText}>Клиент в комнате</Text>
                          </View>
                        ) : null}
                        <Button
                          variant="primary"
                          size="sm"
                          onPress={() => joinNative(l.slugFormatted)}
                        >
                          Войти в занятие
                        </Button>
                      </View>
                    ) : (
                      <Text
                        style={{
                          fontSize: 13,
                          color: theme.textSecondary,
                          fontFamily: Fonts.sans,
                        }}
                      >
                        Завершено
                      </Text>
                    )}
                  </View>
                </View>
              ))}
            </ThemedView>
          )}

          <Pressable onPress={openWebOnline} style={{ marginTop: Spacing.three, alignSelf: "center" }}>
            <Text
              style={{
                fontSize: 14,
                color: theme.primary,
                fontFamily: Fonts.sansMedium,
                textDecorationLine: "underline",
              }}
            >
              Полный кабинет в браузере
            </Text>
          </Pressable>
        </ThemedView>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.four,
    maxWidth: MaxContentWidth,
    alignSelf: "center",
    width: "100%",
  },
  content: { gap: Spacing.three },
  card: {
    padding: Spacing.five,
    borderRadius: BorderRadius.card,
    alignItems: "center",
  },
  clientJoinedChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: "#dcfce7",
  },
  clientJoinedText: {
    fontSize: 11,
    color: "#15803d",
    fontFamily: Fonts.sansMedium,
  },
});
