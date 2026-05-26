import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
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
import { useAuth } from "@/contexts/auth-context";
import { useSpecialistRealtime } from "@/hooks/use-specialist-realtime";
import { useTheme } from "@/hooks/use-theme";
import { fetchWithAuth } from "@/lib/api";
import {
  endOfWeek,
  formatDaySectionHeading,
  formatWeekRange,
  isLessonOnOrAfterToday,
  scheduleDayKey,
  startOfWeek,
  upcomingScheduleFetchRange,
  type ScheduleLesson,
} from "@/lib/schedule-shared";
import { openLessonDetail } from "@/lib/schedule-navigation";

type ScheduleTab = "today" | "week" | "all";

function isCurrentWeek(from: Date, to: Date): boolean {
  const now = Date.now();
  return now >= from.getTime() && now <= to.getTime();
}

function todayRange(): { from: Date; to: Date } {
  const from = new Date();
  from.setHours(0, 0, 0, 0);
  const to = new Date(from);
  to.setHours(23, 59, 59, 999);
  return { from, to };
}

export default function ScheduleScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { authApi, isSignedIn } = useAuth();

  const [tab, setTab] = useState<ScheduleTab>("today");
  const [weekAnchor, setWeekAnchor] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  });
  const [lessons, setLessons] = useState<ScheduleLesson[]>([]);
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const weekFrom = useMemo(() => startOfWeek(new Date(weekAnchor)), [weekAnchor]);
  const weekTo = useMemo(() => endOfWeek(new Date(weekAnchor)), [weekAnchor]);
  const viewingCurrentWeek = isCurrentWeek(weekFrom, weekTo);

  const fetchRange = useMemo(() => {
    if (tab === "today") return todayRange();
    if (tab === "week") return { from: weekFrom, to: weekTo };
    return upcomingScheduleFetchRange();
  }, [tab, weekFrom, weekTo]);

  const loadSchedule = useCallback(
    async (opts?: { silent?: boolean }) => {
      if (!isSignedIn) {
        setLoading(false);
        return;
      }
      if (!opts?.silent) setLoading(true);
      setError(null);
      try {
        const url = `/specialist/schedule?from=${fetchRange.from.toISOString()}&to=${fetchRange.to.toISOString()}`;
        const res = await fetchWithAuth(url, {}, authApi);
        if (!res.ok) {
          setError(`Ошибка ${res.status}`);
          return;
        }
        const json = await res.json();
        const data: ScheduleLesson[] = Array.isArray(json.data) ? json.data : [];
        setLessons(
          [...data].sort(
            (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
          ),
        );
        setPendingIds(
          new Set(
            Array.isArray(json.pendingCancellationIds)
              ? json.pendingCancellationIds
              : [],
          ),
        );
      } catch (e) {
        setError(e instanceof Error ? e.message : "Ошибка загрузки");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [fetchRange, isSignedIn, authApi],
  );

  useFocusEffect(
    useCallback(() => {
      void loadSchedule();
    }, [loadSchedule]),
  );

  useSpecialistRealtime({
    enabled: isSignedIn,
    authApi,
    onRefresh: () => loadSchedule({ silent: true }),
  });

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    void loadSchedule({ silent: true });
  }, [loadSchedule]);

  const displayedLessons = useMemo(() => {
    if (tab === "all") {
      return lessons.filter((l) => isLessonOnOrAfterToday(l.startsAt));
    }
    return lessons;
  }, [lessons, tab]);

  function prevWeek() {
    setWeekAnchor((p) => {
      const d = new Date(p);
      d.setDate(d.getDate() - 7);
      return d.getTime();
    });
  }
  function nextWeek() {
    setWeekAnchor((p) => {
      const d = new Date(p);
      d.setDate(d.getDate() + 7);
      return d.getTime();
    });
  }
  function toToday() {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    setWeekAnchor(d.getTime());
  }

  function onOpenLesson(lesson: ScheduleLesson) {
    openLessonDetail(router, lesson, { pending: pendingIds.has(lesson.id) });
  }

  const byDay = useMemo(() => {
    const m = new Map<string, ScheduleLesson[]>();
    for (const l of displayedLessons) {
      const key = scheduleDayKey(l.startsAt);
      if (!m.has(key)) m.set(key, []);
      m.get(key)!.push(l);
    }
    return m;
  }, [displayedLessons]);

  const sortedDays = useMemo(() => [...byDay.keys()].sort(), [byDay]);

  return (
    <ThemedView style={{ flex: 1 }}>
      <MainTabHeader title="Расписание" />
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
          {/* Сегмент: Сегодня / Неделя / Все */}
          <View
            style={[styles.segment, { backgroundColor: theme.backgroundElement }]}
          >
            {[
              { id: "today" as const, label: "Сегодня" },
              { id: "week" as const, label: "Неделя" },
              { id: "all" as const, label: "Все" },
            ].map((opt) => {
              const active = tab === opt.id;
              return (
                <Pressable
                  key={opt.id}
                  onPress={() => setTab(opt.id)}
                  style={[
                    styles.segmentBtn,
                    active && { backgroundColor: theme.cardBackground },
                  ]}
                >
                  <Text
                    style={{
                      fontSize: 13,
                      color: active ? theme.text : theme.textSecondary,
                      fontFamily: Fonts.sansMedium,
                    }}
                  >
                    {opt.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {tab === "week" ? (
            <View
              style={[
                styles.weekNav,
                {
                  backgroundColor: theme.cardBackground,
                  borderColor: theme.backgroundElement,
                },
              ]}
            >
              <Pressable onPress={prevWeek} hitSlop={12} style={styles.navArrow}>
                <Ionicons name="chevron-back" size={22} color={theme.textSecondary} />
              </Pressable>
              <View style={styles.weekCenter}>
                <Text
                  style={{
                    fontSize: 14,
                    color: theme.text,
                    fontFamily: Fonts.sansSemiBold,
                  }}
                >
                  {formatWeekRange(weekFrom, weekTo)}
                </Text>
                {!viewingCurrentWeek ? (
                  <Pressable onPress={toToday} hitSlop={8}>
                    <Text
                      style={{
                        fontSize: 12,
                        color: theme.primary,
                        fontFamily: Fonts.sansMedium,
                        marginTop: 2,
                      }}
                    >
                      Сегодня
                    </Text>
                  </Pressable>
                ) : null}
              </View>
              <Pressable onPress={nextWeek} hitSlop={12} style={styles.navArrow}>
                <Ionicons name="chevron-forward" size={22} color={theme.textSecondary} />
              </Pressable>
            </View>
          ) : null}

          {error && (
            <ThemedView type="card" style={styles.errorCard}>
              <ThemedText type="small" themeColor="textSecondary">
                {error}
              </ThemedText>
            </ThemedView>
          )}

          {loading ? (
            <View style={styles.loadingCenter}>
              <ActivityIndicator size="large" color={theme.primary} />
            </View>
          ) : displayedLessons.length === 0 ? (
            <ThemedText
              type="small"
              themeColor="textSecondary"
              style={styles.emptyText}
            >
              {tab === "today"
                ? "На сегодня занятий нет"
                : tab === "week"
                  ? "Нет занятий на этой неделе"
                  : "Нет предстоящих занятий"}
            </ThemedText>
          ) : tab === "today" && displayedLessons.length > 0 ? (
            <View style={styles.dayBlock}>
              <Text
                style={[
                  styles.dayLabel,
                  { color: theme.textSecondary, fontFamily: Fonts.sansSemiBold },
                ]}
              >
                {formatDaySectionHeading(displayedLessons[0].startsAt)}
              </Text>
              {displayedLessons.map((lesson) => (
                <ScheduleLessonCard
                  key={lesson.id}
                  lesson={lesson}
                  isPending={pendingIds.has(lesson.id)}
                  onPress={() => onOpenLesson(lesson)}
                />
              ))}
            </View>
          ) : (
            sortedDays.map((dk) => {
              const dayLessons = byDay.get(dk)!;
              return (
                <View key={dk} style={styles.dayBlock}>
                  <Text
                    style={[
                      styles.dayLabel,
                      { color: theme.textSecondary, fontFamily: Fonts.sansSemiBold },
                    ]}
                  >
                    {formatDaySectionHeading(dayLessons[0].startsAt)}
                  </Text>
                  {dayLessons.map((lesson) => (
                    <ScheduleLessonCard
                      key={lesson.id}
                      lesson={lesson}
                      isPending={pendingIds.has(lesson.id)}
                      onPress={() => onOpenLesson(lesson)}
                    />
                  ))}
                </View>
              );
            })
          )}
        </ThemedView>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  scrollView: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  main: {
    maxWidth: MaxContentWidth,
    width: "100%",
    alignSelf: "center",
    gap: Spacing.three,
  },
  segment: {
    flexDirection: "row",
    borderRadius: BorderRadius.card,
    padding: 3,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: BorderRadius.card - 4,
  },
  weekNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: BorderRadius.card,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.two,
  },
  navArrow: { padding: 8 },
  weekCenter: { alignItems: "center" },
  errorCard: { padding: Spacing.three, borderRadius: BorderRadius.card },
  loadingCenter: { paddingVertical: 48, alignItems: "center" },
  emptyText: { textAlign: "center", paddingVertical: 48 },
  dayBlock: { gap: Spacing.two },
  dayLabel: { fontSize: 14, lineHeight: 18, paddingHorizontal: 2, marginBottom: 2 },
});
