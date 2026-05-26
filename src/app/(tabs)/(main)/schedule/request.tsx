import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, usePathname, useRouter } from "expo-router";
import { useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  BorderRadius,
  CardShadow,
  Fonts,
  MaxContentWidth,
  Spacing,
} from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { fetchWithAuth } from "@/lib/api";
import {
  formatLessonDateTime,
  formatTime,
  QUICK_REASONS_CANCEL,
} from "@/lib/schedule-shared";
import { useAuth } from "@/contexts/auth-context";
import { GLASS_HEADER_CONTENT_HEIGHT } from "@/components/glass-header";
import { goBackInSchedule } from "@/lib/tab-navigation";

export default function ScheduleRequestScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const pathname = usePathname();
  const { authApi } = useAuth();
  const params = useLocalSearchParams<{
    lessonId?: string;
    startsAt?: string;
    serviceName?: string;
    clientName?: string;
    clientChildName?: string;
    roomName?: string;
    durationMinutes?: string;
  }>();

  const lessonId = params.lessonId ?? "";
  const startsAt = params.startsAt ?? "";
  const serviceName = params.serviceName?.trim() || null;
  const clientName = params.clientName?.trim() || "—";
  const clientChildName = params.clientChildName?.trim() || null;
  const roomName = params.roomName?.trim() || null;
  const durationMinutes = params.durationMinutes
    ? Number(params.durationMinutes)
    : null;

  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const keyboardOffset = insets.top + GLASS_HEADER_CONTENT_HEIGHT;

  if (!lessonId || !startsAt) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.background }]}>
        <Text style={{ color: theme.textSecondary, fontFamily: Fonts.sans }}>
          Занятие не найдено
        </Text>
        <Pressable
          onPress={() => goBackInSchedule(router, pathname)}
          style={({ pressed }) => [
            styles.formBtn,
            styles.formBtnSecondary,
            {
              borderColor: theme.backgroundElement,
              backgroundColor: theme.cardBackground,
              opacity: pressed ? 0.85 : 1,
            },
          ]}
        >
          <Text
            style={[
              styles.formBtnText,
              { color: theme.textSecondary, fontFamily: Fonts.sansMedium },
            ]}
          >
            Назад
          </Text>
        </Pressable>
      </View>
    );
  }

  async function handleSubmit() {
    const text = reason.trim();
    if (!text) {
      setError(
        "Напишите причину — администратор сможет быстрее обработать запрос",
      );
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetchWithAuth(
        `/specialist/lessons/${lessonId}/cancel-request`,
        {
          method: "POST",
          body: JSON.stringify({ reason: text }),
        },
        authApi,
      );
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setSuccess(true);
        setTimeout(() => router.back(), 1400);
        return;
      }
      setError((data as { error?: string }).error || "Не удалось отправить запрос");
    } catch {
      setError("Ошибка сети. Проверьте подключение и попробуйте снова");
    }
    setSubmitting(false);
  }

  if (success) {
    return (
      <View style={[styles.successRoot, { backgroundColor: theme.background }]}>
        <View
          style={[styles.successCard, { backgroundColor: theme.cardBackground }, CardShadow]}
        >
          <Ionicons name="checkmark-circle" size={56} color="#15803d" />
          <Text
            style={[styles.successTitle, { color: theme.text, fontFamily: Fonts.sansBold }]}
          >
            Запрос отправлен
          </Text>
          <Text
            style={[styles.successSub, { color: theme.textSecondary, fontFamily: Fonts.sans }]}
          >
            Администратор рассмотрит запрос и при необходимости свяжется с вами.
          </Text>
        </View>
      </View>
    );
  }

  function scrollFormAboveKeyboard() {
    scrollRef.current?.scrollToEnd({ animated: true });
  }

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: theme.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={keyboardOffset}
    >
      <ScrollView
        ref={scrollRef}
        automaticallyAdjustKeyboardInsets
        contentContainerStyle={[
          styles.scroll,
          {
            paddingBottom: insets.bottom + Spacing.six,
            paddingHorizontal: Spacing.four,
          },
        ]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.inner}>
          <View style={[styles.hero, { backgroundColor: theme.primary }]}>
            <View style={styles.heroBadge}>
              <Ionicons name="close-circle-outline" size={18} color="#fff" />
              <Text style={styles.heroBadgeText}>Запрос на отмену</Text>
            </View>
            <Text style={[styles.heroDate, { fontFamily: Fonts.sansBold }]}>
              {formatLessonDateTime(startsAt)}
            </Text>
            {durationMinutes != null && !Number.isNaN(durationMinutes) && (
              <Text style={styles.heroMeta}>
                Длительность · {durationMinutes} мин
              </Text>
            )}
          </View>

          <View style={[styles.lessonCard, { backgroundColor: theme.cardBackground }, CardShadow]}>
            <View style={styles.infoRow}>
              <View style={[styles.infoIcon, { backgroundColor: `${theme.primary}18` }]}>
                <Ionicons name="person-outline" size={18} color={theme.primary} />
              </View>
              <View style={styles.infoTextCol}>
                <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>
                  {clientChildName ? "Ребёнок" : "Клиент"}
                </Text>
                <Text
                  style={[
                    styles.infoValue,
                    { color: theme.text, fontFamily: Fonts.sansSemiBold },
                  ]}
                >
                  {clientChildName
                    ? `${clientChildName} (${clientName})`
                    : clientName}
                </Text>
              </View>
            </View>

            {serviceName ? (
              <View style={styles.infoRow}>
                <View style={[styles.infoIcon, { backgroundColor: `${theme.primary}18` }]}>
                  <Ionicons name="sparkles-outline" size={18} color={theme.primary} />
                </View>
                <View style={styles.infoTextCol}>
                  <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>
                    Услуга
                  </Text>
                  <Text
                    style={[
                      styles.infoValue,
                      { color: theme.text, fontFamily: Fonts.sansSemiBold },
                    ]}
                  >
                    {serviceName}
                  </Text>
                </View>
              </View>
            ) : null}

            {roomName ? (
              <View style={styles.infoRow}>
                <View style={[styles.infoIcon, { backgroundColor: `${theme.primary}18` }]}>
                  <Ionicons name="location-outline" size={18} color={theme.primary} />
                </View>
                <View style={styles.infoTextCol}>
                  <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>
                    Кабинет
                  </Text>
                  <Text
                    style={[
                      styles.infoValue,
                      { color: theme.text, fontFamily: Fonts.sansSemiBold },
                    ]}
                  >
                    {roomName}
                  </Text>
                </View>
              </View>
            ) : null}

            <View style={[styles.timePill, { backgroundColor: theme.backgroundElement }]}>
              <Ionicons name="time-outline" size={16} color={theme.textSecondary} />
              <Text
                style={{
                  color: theme.textSecondary,
                  fontFamily: Fonts.sansMedium,
                  fontSize: 13,
                }}
              >
                Начало в {formatTime(startsAt)}
              </Text>
            </View>
          </View>

          <View style={styles.reasonSection}>
            <Text
              style={[styles.sectionTitle, { color: theme.text, fontFamily: Fonts.sansSemiBold }]}
            >
              Причина отмены
            </Text>
            <Text
              style={[styles.sectionHint, { color: theme.textSecondary, fontFamily: Fonts.sans }]}
            >
              Выберите вариант или напишите своими словами
            </Text>

            <View style={styles.chipsWrap}>
              {QUICK_REASONS_CANCEL.map((chip) => {
                const active = reason === chip;
                return (
                  <Pressable
                    key={chip}
                    onPress={() => {
                      setReason(chip);
                      setError(null);
                    }}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: active ? theme.primary : theme.cardBackground,
                        borderColor: active ? theme.primary : theme.backgroundElement,
                      },
                      CardShadow,
                    ]}
                  >
                    <Text
                      style={{
                        color: active ? "#fff" : theme.text,
                        fontFamily: Fonts.sansMedium,
                        fontSize: 13,
                      }}
                    >
                      {chip}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <TextInput
              style={[
                styles.textArea,
                {
                  color: theme.text,
                  borderColor: error ? "#dc2626" : theme.backgroundElement,
                  backgroundColor: theme.cardBackground,
                  fontFamily: Fonts.sans,
                },
              ]}
              placeholder="Подробности для администратора…"
              placeholderTextColor={theme.textSecondary}
              value={reason}
              onChangeText={(t) => {
                setReason(t);
                if (error) setError(null);
              }}
              onFocus={() => {
                setTimeout(
                  scrollFormAboveKeyboard,
                  Platform.OS === "ios" ? 320 : 100,
                );
              }}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
            />

            {error ? (
              <View style={styles.errorBox}>
                <Ionicons name="warning-outline" size={18} color="#dc2626" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <View style={styles.formActions}>
              <Pressable
                onPress={() => goBackInSchedule(router, pathname)}
                disabled={submitting}
                style={({ pressed }) => [
                  styles.formBtn,
                  styles.formBtnSecondary,
                  {
                    borderColor: theme.backgroundElement,
                    backgroundColor: theme.cardBackground,
                    opacity: pressed ? 0.85 : submitting ? 0.5 : 1,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.formBtnText,
                    { color: theme.textSecondary, fontFamily: Fonts.sansMedium },
                  ]}
                >
                  Назад
                </Text>
              </Pressable>

              <Pressable
                onPress={handleSubmit}
                disabled={submitting}
                style={({ pressed }) => [
                  styles.formBtn,
                  styles.formBtnPrimary,
                  {
                    borderColor: theme.backgroundElement,
                    backgroundColor: theme.cardBackground,
                    opacity: pressed ? 0.85 : submitting ? 0.6 : 1,
                  },
                ]}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color={theme.text} />
                ) : (
                  <Text
                    style={[
                      styles.formBtnText,
                      { color: theme.text, fontFamily: Fonts.sansSemiBold },
                    ]}
                  >
                    Отправить запрос
                  </Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flexGrow: 1 },
  inner: {
    maxWidth: MaxContentWidth,
    width: "100%",
    alignSelf: "center",
    gap: Spacing.three,
    paddingTop: Spacing.two,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.four,
    gap: Spacing.three,
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
  heroBadgeText: { color: "#fff", fontSize: 12, fontFamily: Fonts.sansMedium },
  heroDate: { color: "#fff", fontSize: 20, lineHeight: 26 },
  heroMeta: { color: "rgba(255,255,255,0.85)", fontSize: 13, fontFamily: Fonts.sans },
  lessonCard: {
    borderRadius: BorderRadius.card + 4,
    padding: Spacing.four,
    gap: Spacing.three,
  },
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
  reasonSection: { gap: Spacing.three },
  sectionTitle: { fontSize: 17, marginTop: Spacing.one },
  sectionHint: { fontSize: 13, marginTop: -8 },
  chipsWrap: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.two },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: BorderRadius.card,
    padding: Spacing.three,
    fontSize: 15,
    minHeight: 120,
    lineHeight: 22,
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.two,
    padding: Spacing.three,
    backgroundColor: "#fef2f2",
    borderRadius: BorderRadius.card,
  },
  errorText: { flex: 1, color: "#dc2626", fontSize: 14, fontFamily: Fonts.sans, lineHeight: 20 },
  formActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  formBtn: {
    minHeight: 36,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: BorderRadius.button,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
  },
  formBtnSecondary: { flexShrink: 0 },
  formBtnPrimary: { flex: 1, minWidth: 0 },
  formBtnText: { fontSize: 14 },
  successRoot: { flex: 1, justifyContent: "center", padding: Spacing.four },
  successCard: {
    borderRadius: BorderRadius.card + 4,
    padding: Spacing.five,
    alignItems: "center",
    gap: Spacing.three,
    maxWidth: MaxContentWidth,
    alignSelf: "center",
    width: "100%",
  },
  successTitle: { fontSize: 22, textAlign: "center" },
  successSub: { fontSize: 15, textAlign: "center", lineHeight: 22 },
});
