import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { BorderRadius, Fonts, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { LessonKindBadges } from "@/components/schedule/LessonKindBadges";
import {
  formatTime,
  isLessonCancelled,
  isLessonLiveNow,
  isLessonScheduled,
  LESSON_STATUS_LABELS,
  type ScheduleLesson,
} from "@/lib/schedule-shared";

type Props = {
  lesson: ScheduleLesson;
  isPending?: boolean;
  isFirstUpcoming?: boolean;
  onPress: () => void;
};

export function ScheduleLessonCard({
  lesson,
  isPending = false,
  isFirstUpcoming,
  onPress,
}: Props) {
  const theme = useTheme();
  const cancelled = isLessonCancelled(lesson.status);
  const live = isLessonLiveNow(lesson);
  const statusLabel = LESSON_STATUS_LABELS[lesson.status] ?? lesson.status;
  const struck = cancelled ? styles.struck : null;
  const mutedColor = cancelled ? theme.textSecondary : theme.text;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: cancelled ? "#fef2f2" : theme.cardBackground,
          borderColor: cancelled
            ? "#fecaca"
            : isFirstUpcoming
              ? "#86efac"
              : theme.backgroundElement,
          opacity: pressed ? 0.92 : 1,
        },
        isPending && { borderColor: "#fbbf24", backgroundColor: "#fffbeb" },
      ]}
    >
      <View style={styles.topRow}>
        <View style={styles.timeCol}>
          {live ? <View style={styles.liveDot} /> : null}
          <Text
            style={[
              styles.timeMain,
              struck,
              { color: mutedColor, fontFamily: Fonts.sansBold },
            ]}
          >
            {formatTime(lesson.startsAt)}
          </Text>
          <Text
            style={[
              styles.timeSub,
              struck,
              { color: theme.textSecondary, fontFamily: Fonts.sans },
            ]}
          >
            {lesson.durationMinutes} мин
          </Text>
        </View>

        <View style={styles.mainCol}>
          <Text
            style={[
              styles.client,
              struck,
              { color: mutedColor, fontFamily: Fonts.sansSemiBold },
            ]}
            numberOfLines={1}
          >
            {lesson.clientChildName
              ? `${lesson.clientChildName} (${lesson.clientName})`
              : lesson.clientName}
          </Text>
          {lesson.serviceName ? (
            <Text
              style={[
                styles.service,
                struck,
                { color: theme.textSecondary, fontFamily: Fonts.sans },
              ]}
              numberOfLines={2}
            >
              {lesson.serviceName}
            </Text>
          ) : null}
          <LessonKindBadges lesson={lesson} />
          <View style={styles.metaRow}>
            {lesson.isOnline ? (
              <View style={[styles.chip, { backgroundColor: "rgba(196,45,38,0.08)" }]}>
                <Ionicons name="videocam" size={12} color={theme.primary} />
                <Text style={[styles.chipText, { color: theme.primary, fontFamily: Fonts.sansMedium }]}>
                  Онлайн
                </Text>
              </View>
            ) : lesson.roomName ? (
              <View style={styles.chip}>
                <Ionicons name="business-outline" size={12} color={theme.textSecondary} />
                <Text style={[styles.chipText, { color: theme.textSecondary, fontFamily: Fonts.sansMedium }]}>
                  {lesson.roomName}
                </Text>
              </View>
            ) : null}
            {isPending ? (
              <View style={[styles.chip, { backgroundColor: "#fef3c7" }]}>
                <Ionicons name="time-outline" size={12} color="#92400e" />
                <Text style={[styles.chipText, { color: "#92400e", fontFamily: Fonts.sansMedium }]}>
                  Запрос отмены
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        <View style={styles.rightCol}>
          <View
            style={[
              styles.statusPill,
              cancelled && styles.statusPillCancelled,
              lesson.status === "completed" && styles.statusPillDone,
              isLessonScheduled(lesson.status) && !cancelled && styles.statusPillScheduled,
              lesson.status === "no_show" && styles.statusPillWarn,
            ]}
          >
            <Text
              style={[
                styles.statusText,
                {
                  fontFamily: Fonts.sansMedium,
                  color: cancelled
                    ? "#b91c1c"
                    : isLessonScheduled(lesson.status)
                      ? "#1d4ed8"
                      : theme.textSecondary,
                },
              ]}
            >
              {statusLabel}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={theme.textSecondary} />
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.card,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  struck: { textDecorationLine: "line-through" },
  topRow: { flexDirection: "row", alignItems: "flex-start", gap: Spacing.two },
  timeCol: { minWidth: 52, alignItems: "flex-start", gap: 2 },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#22c55e",
    marginBottom: 2,
  },
  timeMain: { fontSize: 17, lineHeight: 20 },
  timeSub: { fontSize: 11 },
  mainCol: { flex: 1, minWidth: 0, gap: 3 },
  client: { fontSize: 14, lineHeight: 18 },
  service: { fontSize: 12 },
  metaRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 4 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: "rgba(0,0,0,0.04)",
  },
  chipText: { fontSize: 11 },
  rightCol: { alignItems: "flex-end", gap: 6 },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: "#f3f4f6",
  },
  statusPillCancelled: { backgroundColor: "#fee2e2" },
  statusPillScheduled: { backgroundColor: "#eff6ff" },
  statusPillDone: { backgroundColor: "#f0fdf4" },
  statusPillWarn: { backgroundColor: "#fffbeb" },
  statusText: { fontSize: 10 },
});
