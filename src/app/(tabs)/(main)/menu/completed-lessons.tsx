import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedView } from "@/components/themed-view";
import { BorderRadius, Fonts, MaxContentWidth, Spacing } from "@/constants/theme";
import { useAuth } from "@/contexts/auth-context";
import { useTheme } from "@/hooks/use-theme";
import { fetchWithAuth } from "@/lib/api";
import { formatLessonDateTime, type ScheduleLesson } from "@/lib/schedule-shared";

export default function CompletedLessonsScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { authApi, isSignedIn } = useAuth();

  const [lessons, setLessons] = useState<ScheduleLesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!isSignedIn) return;
    try {
      const res = await fetchWithAuth("/specialist/completed-lessons?pageSize=50", {}, authApi);
      if (res.ok) {
        const json = (await res.json()) as { data?: ScheduleLesson[] };
        setLessons(Array.isArray(json.data) ? json.data : []);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [authApi, isSignedIn]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <ThemedView style={[styles.root, { backgroundColor: theme.background }]}>
      {loading && lessons.length === 0 ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={theme.primary} />
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: Spacing.four, paddingBottom: insets.bottom + 24 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} />
          }
        >
          {lessons.length === 0 ? (
            <Text style={{ color: theme.textSecondary, fontFamily: Fonts.sans }}>Нет проведённых занятий</Text>
          ) : (
            lessons.map((l) => (
              <Pressable
                key={l.id}
                onPress={() =>
                  router.push({
                    pathname: "/schedule/[lessonId]",
                    params: {
                      lessonId: l.id,
                      startsAt: l.startsAt,
                      serviceName: l.serviceName ?? "",
                      clientName: l.clientName,
                      clientChildName: l.clientChildName ?? "",
                      roomName: l.roomName ?? "",
                      durationMinutes: String(l.durationMinutes),
                      status: l.status,
                    },
                  })
                }
                style={[styles.row, { backgroundColor: theme.cardBackground, borderColor: theme.backgroundSelected }]}
              >
                <Text style={{ fontFamily: Fonts.sansSemiBold, color: theme.text }} numberOfLines={1}>
                  {l.clientChildName ? `${l.clientChildName} (${l.clientName})` : l.clientName}
                </Text>
                <Text style={{ fontFamily: Fonts.sans, color: theme.textSecondary, fontSize: 13 }}>
                  {l.serviceName ?? "Занятие"}
                </Text>
                <Text style={{ fontFamily: Fonts.sans, color: theme.textSecondary, fontSize: 12 }}>
                  {formatLessonDateTime(l.startsAt)}
                </Text>
              </Pressable>
            ))
          )}
        </ScrollView>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  row: {
    borderWidth: 1,
    borderRadius: BorderRadius.card,
    padding: Spacing.three,
    marginBottom: Spacing.two,
    gap: 4,
    maxWidth: MaxContentWidth,
    alignSelf: "center",
    width: "100%",
  },
});
