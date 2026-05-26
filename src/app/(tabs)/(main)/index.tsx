import { useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { MainTabHeader } from "@/components/main-tab-header";
import { ScheduleLessonCard } from "@/components/schedule/ScheduleLessonCard";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import {
  BottomTabInset,
  BorderRadius,
  Fonts,
  MaxContentWidth,
  Spacing,
} from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { useSpecialistSchedule } from "@/contexts/specialist-schedule-context";
import { openLessonDetail } from "@/lib/schedule-navigation";
import {
  formatDaySectionHeading,
  scheduleDayKey,
  startOfToday,
  type ScheduleLesson,
} from "@/lib/schedule-shared";

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 6) return "Доброй ночи";
  if (h < 12) return "Доброе утро";
  if (h < 18) return "Добрый день";
  return "Добрый вечер";
}

export default function HomeScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { data, loading, error, refresh } = useSpecialistSchedule();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refresh({ silent: true });
    } finally {
      setRefreshing(false);
    }
  }, [refresh]);

  const todayHeading = useMemo(
    () => formatDaySectionHeading(startOfToday().toISOString()),
    [],
  );

  const upcomingByDay = useMemo(() => {
    const upcoming = data?.upcoming ?? [];
    const m = new Map<string, ScheduleLesson[]>();
    for (const l of upcoming) {
      const key = scheduleDayKey(l.startsAt);
      if (!m.has(key)) m.set(key, []);
      m.get(key)!.push(l);
    }
    return [...m.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, lessons]) => ({
        key,
        heading: formatDaySectionHeading(lessons[0]!.startsAt),
        lessons,
      }));
  }, [data?.upcoming]);

  if (loading && !data) {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView edges={["top"]} style={styles.center}>
          <ActivityIndicator size="large" color={theme.primary} />
        </SafeAreaView>
      </ThemedView>
    );
  }

  const greeting = getGreeting();
  const today = data?.today;
  const pendingSet = new Set(data?.pendingCancellationIds ?? []);

  return (
    <ThemedView style={styles.container}>
      <MainTabHeader
        title={`${greeting}${data?.firstName ? `, ${data.firstName}` : ""}!`}
        subtitle="Ваш рабочий день"
      />
      <ScrollView
        style={[styles.scrollView, { backgroundColor: theme.background }]}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: Spacing.two,
            paddingBottom: insets.bottom + BottomTabInset + Spacing.three,
            paddingHorizontal: Spacing.four,
          },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <ThemedView style={styles.main}>
          {error && (
            <ThemedView type="card" style={styles.errorCard}>
              <ThemedText type="small" themeColor="textSecondary">
                {error}
              </ThemedText>
            </ThemedView>
          )}

          <View
            style={[
              styles.statsRow,
              { backgroundColor: theme.cardBackground, borderColor: theme.backgroundSelected },
            ]}
          >
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.primary, fontFamily: Fonts.sansBold }]}>
                {today?.lessons.length ?? 0}
              </Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary, fontFamily: Fonts.sansMedium }]}>
                занятий{"\n"}сегодня
              </Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: theme.backgroundSelected }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.text, fontFamily: Fonts.sansBold }]}>
                {today?.completed ?? 0}
              </Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary, fontFamily: Fonts.sansMedium }]}>
                проведено
              </Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: theme.backgroundSelected }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.text, fontFamily: Fonts.sansBold }]}>
                {today?.remaining ?? 0}
              </Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary, fontFamily: Fonts.sansMedium }]}>
                осталось
              </Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text, fontFamily: Fonts.sansSemiBold }]}>
              {todayHeading}
            </Text>
            {(!today?.lessons || today.lessons.length === 0) ? (
              <ThemedView type="card" style={styles.emptyCard}>
                <ThemedText type="small" themeColor="textSecondary" style={styles.emptyText}>
                  На сегодня занятий нет
                </ThemedText>
              </ThemedView>
            ) : (
              today.lessons.map((lesson) => (
                <ScheduleLessonCard
                  key={lesson.id}
                  lesson={lesson}
                  isPending={pendingSet.has(lesson.id)}
                  onPress={() =>
                    openLessonDetail(router, lesson, {
                      pending: pendingSet.has(lesson.id),
                    })
                  }
                />
              ))
            )}
          </View>

          {upcomingByDay.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: theme.text, fontFamily: Fonts.sansSemiBold }]}>
                  Ближайшие
                </Text>
                <Text
                  style={[styles.sectionLink, { color: theme.primary, fontFamily: Fonts.sansMedium }]}
                  onPress={() => router.push("/schedule")}
                >
                  Все
                </Text>
              </View>
              {upcomingByDay.map((day) => (
                <View key={day.key} style={styles.dayBlock}>
                  <Text
                    style={[
                      styles.dayLabel,
                      { color: theme.textSecondary, fontFamily: Fonts.sansSemiBold },
                    ]}
                  >
                    {day.heading}
                  </Text>
                  {day.lessons.slice(0, 5).map((lesson, idx) => (
                    <ScheduleLessonCard
                      key={lesson.id}
                      lesson={lesson}
                      isPending={pendingSet.has(lesson.id)}
                      isFirstUpcoming={idx === 0}
                      onPress={() =>
                        openLessonDetail(router, lesson, {
                          pending: pendingSet.has(lesson.id),
                        })
                      }
                    />
                  ))}
                </View>
              ))}
            </View>
          )}
        </ThemedView>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  main: {
    maxWidth: MaxContentWidth,
    width: "100%",
    alignSelf: "center",
    gap: Spacing.four,
  },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  errorCard: { padding: Spacing.four, borderRadius: BorderRadius.card },
  statsRow: {
    flexDirection: "row",
    alignItems: "stretch",
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    paddingVertical: Spacing.three,
  },
  statItem: { flex: 1, alignItems: "center", justifyContent: "center" },
  statValue: { fontSize: 22, marginBottom: 2 },
  statLabel: { fontSize: 11, textAlign: "center", lineHeight: 14 },
  statDivider: { width: 1, alignSelf: "stretch", opacity: 0.5 },
  section: { gap: Spacing.two },
  dayBlock: { gap: Spacing.two },
  dayLabel: { fontSize: 14, marginBottom: 2 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: { fontSize: 16 },
  sectionLink: { fontSize: 14 },
  emptyCard: {
    padding: Spacing.four,
    borderRadius: BorderRadius.card,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: { textAlign: "center" },
});
