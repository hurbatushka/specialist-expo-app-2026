import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SurveyListRow } from "@/components/surveys/SurveyListRow";
import { ThemedView } from "@/components/themed-view";
import { Button } from "@/components/ui";
import {
  BorderRadius,
  BottomTabInset,
  Fonts,
  MaxContentWidth,
  Spacing,
} from "@/constants/theme";
import { useAuth } from "@/contexts/auth-context";
import { useTheme } from "@/hooks/use-theme";
import { fetchWithAuth } from "@/lib/api";
import {
  formatSurveyDate,
  type SurveyResponseRow,
} from "@/lib/surveys-shared";

export default function SurveysScreen() {
  const router = useRouter();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { authApi, isSignedIn } = useAuth();

  const [responses, setResponses] = useState<SurveyResponseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!isSignedIn) {
      setLoading(false);
      return;
    }
    setError(null);
    try {
      const res = await fetchWithAuth("/specialist/surveys", {}, authApi);
      if (!res.ok) {
        const json = (await res.json().catch(() => ({}))) as { error?: string };
        setError(
          json.error ?? "Не удалось загрузить анкеты. Попробуйте обновить экран чуть позже.",
        );
        setResponses([]);
        return;
      }
      const json = (await res.json()) as { data: SurveyResponseRow[] };
      setResponses(Array.isArray(json.data) ? json.data : []);
    } catch {
      setError("Проблемы с загрузкой. Проверьте интернет и попробуйте ещё раз.");
      setResponses([]);
    }
  }, [authApi, isSignedIn]);

  useEffect(() => {
    setLoading(true);
    void load().finally(() => setLoading(false));
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const isEmpty = !loading && responses.length === 0;

  return (
    <ThemedView style={[styles.container, { backgroundColor: theme.background }]}>
      {loading && responses.length === 0 ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingBottom: insets.bottom + BottomTabInset + Spacing.four,
              paddingHorizontal: Spacing.four,
            },
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.primary}
            />
          }
        >
          <View style={styles.content}>
            <Text
              style={[styles.hint, { color: theme.textSecondary, fontFamily: Fonts.sans }]}
            >
              Анкеты, заполненные родителями ваших клиентов. Для просмотра нажмите
              на запись.
            </Text>

            {error ? (
              <ThemedView type="card" style={styles.errorCard}>
                <Text style={[styles.errorText, { color: theme.primary, fontFamily: Fonts.sans }]}>
                  {error}
                </Text>
                <Button variant="outline" size="sm" onPress={() => void load()}>
                  Повторить
                </Button>
              </ThemedView>
            ) : null}

            {isEmpty && !error ? (
              <ThemedView type="card" style={styles.emptyCard}>
                <Text
                  style={[styles.emptyText, { color: theme.textSecondary, fontFamily: Fonts.sans }]}
                >
                  Пока нет заполненных анкет от ваших клиентов.
                </Text>
              </ThemedView>
            ) : null}

            {responses.length > 0 ? (
              <ThemedView type="card" style={styles.listCard}>
                {responses.map((r, i) => {
                  const subject = r.childName
                    ? `${r.childName} (${r.clientName})`
                    : r.clientName;
                  return (
                    <SurveyListRow
                      key={r.id}
                      title={r.surveyName}
                      subtitle={`${subject} · ${formatSurveyDate(r.updatedAt)}`}
                      badge="Готово"
                      variant="completed"
                      showDivider={i < responses.length - 1}
                      onPress={() => router.push(`/menu/surveys/${r.id}`)}
                    />
                  );
                })}
              </ThemedView>
            ) : null}
          </View>
        </ScrollView>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loader: { flex: 1, alignItems: "center", justifyContent: "center" },
  scrollContent: {
    flexGrow: 1,
    maxWidth: MaxContentWidth,
    alignSelf: "center",
    width: "100%",
  },
  content: { gap: Spacing.four, paddingTop: Spacing.two },
  hint: { fontSize: 13, lineHeight: 18, paddingHorizontal: Spacing.one },
  listCard: {
    borderRadius: BorderRadius.card,
    overflow: "hidden",
    padding: 0,
  },
  emptyCard: {
    padding: Spacing.six,
    borderRadius: BorderRadius.card,
    alignItems: "center",
  },
  emptyText: { fontSize: 14, textAlign: "center" },
  errorCard: {
    padding: Spacing.four,
    borderRadius: BorderRadius.card,
    gap: Spacing.three,
  },
  errorText: { fontSize: 14 },
});
