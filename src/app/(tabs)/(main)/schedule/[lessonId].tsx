import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, usePathname, useRouter } from "expo-router";
import { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedView } from "@/components/themed-view";
import { Button } from "@/components/ui";
import {
  BorderRadius,
  CardShadow,
  Fonts,
  MaxContentWidth,
  Spacing,
} from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import {
  formatLessonDateTime,
  formatTime,
  isLessonCancelled,
  isLessonScheduled,
  LESSON_STATUS_LABELS,
  type LessonRouteParams,
} from "@/lib/schedule-shared";
import { goBackInSchedule } from "@/lib/tab-navigation";

export default function LessonDetailScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const pathname = usePathname();
  const params = useLocalSearchParams<LessonRouteParams & { pending?: string }>();

  const lessonId = params.lessonId ?? "";
  const startsAt = params.startsAt ?? "";
  const serviceName = params.serviceName?.trim() || null;
  const clientName = params.clientName?.trim() || "—";
  const clientChildName = params.clientChildName?.trim() || null;
  const roomName = params.roomName?.trim() || null;
  const alfaClientId = params.alfaClientId?.trim() || null;
  const durationMinutes = params.durationMinutes
    ? Number(params.durationMinutes)
    : null;
  const status = params.status?.trim() || "scheduled";
  const isPending = params.pending === "1";
  const cancelled = isLessonCancelled(status);
  const scheduled = isLessonScheduled(status);
  const statusLabel = LESSON_STATUS_LABELS[status] ?? status;

  const canRequestCancel = scheduled && !cancelled && !isPending;

  const routeParams = useMemo(
    () => ({
      lessonId,
      startsAt,
      serviceName: serviceName ?? "",
      clientName,
      clientChildName: clientChildName ?? "",
      roomName: roomName ?? "",
      durationMinutes: durationMinutes != null ? String(durationMinutes) : "",
    }),
    [lessonId, startsAt, serviceName, clientName, clientChildName, roomName, durationMinutes],
  );

  if (!lessonId || !startsAt) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.background }]}>
        <Text style={{ color: theme.textSecondary, fontFamily: Fonts.sans }}>
          Занятие не найдено
        </Text>
        <Button
          variant="outline"
          size="md"
          onPress={() => goBackInSchedule(router, pathname)}
          style={{ marginTop: 16 }}
        >
          Назад
        </Button>
      </View>
    );
  }

  function openRequest(kind: "CANCELLATION" | "TRANSFER") {
    if (!canRequestCancel) return;
    router.push({
      pathname: "/schedule/request",
      params: { ...routeParams, kind },
    });
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.background }}
      contentContainerStyle={[
        styles.scroll,
        { paddingBottom: insets.bottom + Spacing.five },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.inner}>
        <View
          style={[
            styles.hero,
            { backgroundColor: cancelled ? "#b91c1c" : theme.primary },
          ]}
        >
          <View style={styles.heroBadge}>
            <Ionicons
              name={cancelled ? "close-circle-outline" : "calendar-outline"}
              size={18}
              color="#fff"
            />
            <Text style={styles.heroBadgeText}>
              {cancelled ? "ОТМЕНЕНО" : "ЗАНЯТИЕ"}
            </Text>
          </View>
          <Text
            style={[
              styles.heroDate,
              { fontFamily: Fonts.sansBold },
              cancelled && styles.struck,
            ]}
          >
            {formatLessonDateTime(startsAt)}
          </Text>
          {durationMinutes != null && !Number.isNaN(durationMinutes) && (
            <Text style={[styles.heroMeta, cancelled && styles.struck]}>
              Длительность · {durationMinutes} мин
            </Text>
          )}
        </View>

        {cancelled ? (
          <View style={styles.cancelledBanner}>
            <Ionicons name="close-circle" size={22} color="#b91c1c" />
            <View style={styles.cancelledBannerTextCol}>
              <Text style={[styles.cancelledTitle, { fontFamily: Fonts.sansSemiBold }]}>
                Занятие отменено
              </Text>
              <Text style={[styles.cancelledSub, { fontFamily: Fonts.sans }]}>
                Свяжитесь с администратором, если нужны подробности.
              </Text>
            </View>
          </View>
        ) : !scheduled ? (
          <View style={[styles.statusPill, { backgroundColor: "#f3f4f6" }]}>
            <Text
              style={[
                styles.statusText,
                { color: theme.textSecondary, fontFamily: Fonts.sansMedium },
              ]}
            >
              {statusLabel}
            </Text>
          </View>
        ) : null}

        <ThemedView
          type="card"
          style={[
            styles.detailCard,
            {
              borderColor: cancelled ? "#fecaca" : theme.backgroundElement,
              backgroundColor: cancelled ? "#fef2f2" : undefined,
            },
            CardShadow,
            cancelled && styles.detailCardCancelled,
          ]}
        >
          <DetailRow
            icon="person-outline"
            label={clientChildName ? "Ребёнок" : "Клиент"}
            value={
              clientChildName ? `${clientChildName} (${clientName})` : clientName
            }
            theme={theme}
            struck={cancelled}
            onPress={alfaClientId ? () => router.push(`/clients/${alfaClientId}`) : undefined}
          />
          {serviceName ? (
            <DetailRow
              icon="sparkles-outline"
              label="Услуга"
              value={serviceName}
              theme={theme}
              struck={cancelled}
            />
          ) : null}
          {roomName ? (
            <DetailRow
              icon="location-outline"
              label="Кабинет"
              value={roomName}
              theme={theme}
              struck={cancelled}
            />
          ) : null}
          <View style={[styles.timePill, { backgroundColor: theme.backgroundElement }]}>
            <Ionicons name="time-outline" size={16} color={theme.textSecondary} />
            <Text
              style={[
                {
                  color: theme.textSecondary,
                  fontFamily: Fonts.sansMedium,
                  fontSize: 13,
                },
                cancelled && styles.struck,
              ]}
            >
              Начало в {formatTime(startsAt)}
            </Text>
          </View>
        </ThemedView>

        {canRequestCancel && isPending ? (
          <View style={[styles.statusPill, { backgroundColor: "#fffbeb" }]}>
            <Ionicons name="hourglass-outline" size={18} color="#b45309" />
            <Text style={[styles.statusText, { color: "#92400e", fontFamily: Fonts.sansMedium }]}>
              Запрос на отмену отправлен администратору
            </Text>
          </View>
        ) : canRequestCancel ? (
          <View style={styles.actionsBlock}>
            <Text
              style={[
                styles.actionsLabel,
                { color: theme.textSecondary, fontFamily: Fonts.sansSemiBold },
              ]}
            >
              ЗАПРОС АДМИНИСТРАТОРУ
            </Text>
            <Pressable
              onPress={() => openRequest("CANCELLATION")}
              style={({ pressed }) => [
                styles.actionBtn,
                {
                  backgroundColor: theme.cardBackground,
                  borderColor: theme.backgroundElement,
                },
                pressed && { opacity: 0.9 },
              ]}
            >
              <View style={[styles.actionIcon, { backgroundColor: "#fef2f2" }]}>
                <Ionicons name="close-circle-outline" size={22} color="#dc2626" />
              </View>
              <View style={styles.actionTextCol}>
                <Text
                  style={[
                    styles.actionTitle,
                    { color: theme.text, fontFamily: Fonts.sansSemiBold },
                  ]}
                >
                  Отменить занятие
                </Text>
                <Text
                  style={[
                    styles.actionSub,
                    { color: theme.textSecondary, fontFamily: Fonts.sans },
                  ]}
                >
                  Запрос на отмену с пояснением
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
            </Pressable>
          </View>
        ) : null}
      </View>
    </ScrollView>
  );
}

function DetailRow({
  icon,
  label,
  value,
  theme,
  struck = false,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  theme: ReturnType<typeof useTheme>;
  struck?: boolean;
  onPress?: () => void;
}) {
  const valueColor = struck ? theme.textSecondary : theme.text;
  const content = (
    <View style={styles.infoRow}>
      <View style={[styles.infoIcon, { backgroundColor: `${theme.primary}18` }]}>
        <Ionicons
          name={icon}
          size={18}
          color={struck ? theme.textSecondary : theme.primary}
        />
      </View>
      <View style={styles.infoTextCol}>
        <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>{label}</Text>
        <Text
          style={[
            styles.infoValue,
            { color: valueColor, fontFamily: Fonts.sansSemiBold },
            struck && styles.struck,
          ]}
        >
          {value}
        </Text>
      </View>
      {onPress ? (
        <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
      ) : null}
    </View>
  );
  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}>
        {content}
      </Pressable>
    );
  }
  return content;
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 1, paddingHorizontal: Spacing.four, paddingTop: Spacing.two },
  inner: {
    maxWidth: MaxContentWidth,
    width: "100%",
    alignSelf: "center",
    gap: Spacing.three,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.four,
  },
  hero: {
    borderRadius: BorderRadius.card + 4,
    padding: Spacing.four,
    gap: Spacing.two,
  },
  heroBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  heroBadgeText: {
    color: "#fff",
    fontSize: 10,
    letterSpacing: 0.6,
    fontFamily: Fonts.sansSemiBold,
  },
  heroDate: { color: "#fff", fontSize: 20, lineHeight: 26 },
  heroMeta: { color: "rgba(255,255,255,0.85)", fontSize: 13, fontFamily: Fonts.sans },
  struck: { textDecorationLine: "line-through" },
  cancelledBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.three,
    backgroundColor: "#fef2f2",
    borderWidth: 1,
    borderColor: "#fecaca",
    borderRadius: BorderRadius.card,
    padding: Spacing.three,
  },
  cancelledBannerTextCol: { flex: 1, gap: 4 },
  cancelledTitle: { fontSize: 16, color: "#991b1b" },
  cancelledSub: { fontSize: 13, color: "#b91c1c", lineHeight: 18 },
  detailCard: {
    padding: Spacing.four,
    borderRadius: BorderRadius.card,
    borderWidth: StyleSheet.hairlineWidth,
    gap: Spacing.three,
  },
  detailCardCancelled: { opacity: 0.95 },
  infoRow: { flexDirection: "row", alignItems: "flex-start", gap: Spacing.three },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  infoTextCol: { flex: 1, gap: 2 },
  infoLabel: { fontSize: 12, fontFamily: Fonts.sans },
  infoValue: { fontSize: 16 },
  timePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: BorderRadius.button,
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: Spacing.three,
    borderRadius: BorderRadius.card,
  },
  statusText: { fontSize: 14 },
  actionsBlock: { gap: Spacing.two },
  actionsLabel: { fontSize: 10, letterSpacing: 0.6, marginBottom: 2 },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: BorderRadius.card,
    borderWidth: StyleSheet.hairlineWidth,
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  actionTextCol: { flex: 1, gap: 2 },
  actionTitle: { fontSize: 16 },
  actionSub: { fontSize: 13 },
});
