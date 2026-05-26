import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedView } from "@/components/themed-view";
import { Button } from "@/components/ui";
import {
  BorderRadius,
  Fonts,
  MaxContentWidth,
  Spacing,
} from "@/constants/theme";
import { useAuth } from "@/contexts/auth-context";
import { useTheme } from "@/hooks/use-theme";
import { fetchWithAuth } from "@/lib/api";
import {
  formatAnswerValue,
  formatSurveyDate,
  type SurveyResponseDetail,
} from "@/lib/surveys-shared";

export default function SurveyResponseScreen() {
  const router = useRouter();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { authApi } = useAuth();
  const { responseId } = useLocalSearchParams<{ responseId: string }>();
  const id = typeof responseId === "string" ? responseId : responseId?.[0] ?? "";

  const [data, setData] = useState<SurveyResponseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetchWithAuth(`/specialist/surveys/${id}`, {}, authApi);
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        setError(j.error ?? `Ошибка ${res.status}`);
        return;
      }
      const json = (await res.json()) as { data: SurveyResponseDetail };
      setData(json.data ?? null);
    } catch {
      setError("Проблемы с загрузкой. Проверьте интернет и попробуйте ещё раз.");
    } finally {
      setLoading(false);
    }
  }, [authApi, id]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  if (error || !data) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <Text style={{ color: theme.textSecondary, fontFamily: Fonts.sans }}>
          {error ?? "Анкета не найдена"}
        </Text>
        <Button variant="outline" size="md" onPress={() => router.back()} style={{ marginTop: 16 }}>
          Назад
        </Button>
      </View>
    );
  }

  const subject = data.childName ? `${data.childName} (${data.clientName})` : data.clientName;

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
        <View style={[styles.hero, { backgroundColor: theme.primary }]}>
          <Text style={[styles.heroTitle, { fontFamily: Fonts.sansBold }]}>
            {data.surveyName}
          </Text>
          <Text style={[styles.heroSub, { fontFamily: Fonts.sans }]}>
            {subject} · {formatSurveyDate(data.updatedAt)}
          </Text>
        </View>

        {data.answers.length === 0 ? (
          <ThemedView type="card" style={styles.empty}>
            <Text style={{ color: theme.textSecondary, fontFamily: Fonts.sans }}>
              Ответы не найдены
            </Text>
          </ThemedView>
        ) : (
          <ThemedView type="card" style={styles.answers}>
            {data.answers.map((a, idx) => {
              if (a.questionKind === "section_header") {
                return (
                  <Text
                    key={a.questionId + idx}
                    style={[styles.sectionHeader, { color: theme.text, fontFamily: Fonts.sansSemiBold }]}
                  >
                    {a.questionTitle}
                  </Text>
                );
              }
              return (
                <View key={a.questionId + idx} style={styles.answerRow}>
                  <Text
                    style={[styles.qTitle, { color: theme.textSecondary, fontFamily: Fonts.sans }]}
                  >
                    {a.questionTitle}
                  </Text>
                  <Text
                    style={[styles.qValue, { color: theme.text, fontFamily: Fonts.sansMedium }]}
                  >
                    {formatAnswerValue(a.value)}
                  </Text>
                </View>
              );
            })}
          </ThemedView>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.four,
  },
  scroll: { flexGrow: 1, paddingHorizontal: Spacing.four, paddingTop: Spacing.two },
  inner: {
    maxWidth: MaxContentWidth,
    width: "100%",
    alignSelf: "center",
    gap: Spacing.three,
  },
  hero: {
    padding: Spacing.four,
    borderRadius: BorderRadius.card + 4,
    gap: 6,
  },
  heroTitle: { color: "#fff", fontSize: 20, lineHeight: 26 },
  heroSub: { color: "rgba(255,255,255,0.85)", fontSize: 13 },
  empty: { padding: Spacing.five, alignItems: "center", borderRadius: BorderRadius.card },
  answers: {
    padding: Spacing.four,
    borderRadius: BorderRadius.card,
    gap: Spacing.three,
  },
  sectionHeader: {
    fontSize: 14,
    letterSpacing: 0.3,
    marginTop: Spacing.two,
    textTransform: "uppercase",
  },
  answerRow: { gap: 4 },
  qTitle: { fontSize: 12, lineHeight: 16 },
  qValue: { fontSize: 15, lineHeight: 22 },
});
