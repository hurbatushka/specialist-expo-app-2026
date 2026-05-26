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

import { ThemedView } from "@/components/themed-view";
import { BorderRadius, Fonts, MaxContentWidth, Spacing } from "@/constants/theme";
import { useAuth } from "@/contexts/auth-context";
import { useTheme } from "@/hooks/use-theme";
import { fetchWithAuth } from "@/lib/api";

type StatsRow = { label: string; subscription: number; single: number; total: number };
type StatsData = {
  monthYm: string;
  totals: { subscription: number; single: number; diagnostics: number; all: number };
  rows: StatsRow[];
};

export default function MyStatsScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { authApi, isSignedIn } = useAuth();
  const monthYm = new Date().toISOString().slice(0, 7);

  const [data, setData] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!isSignedIn) return;
    try {
      const res = await fetchWithAuth(
        `/specialist/my-stats?month=${monthYm}`,
        {},
        authApi,
      );
      if (res.ok) {
        const json = (await res.json()) as { data?: StatsData };
        setData(json.data ?? null);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [authApi, isSignedIn, monthYm]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <ThemedView style={[styles.root, { backgroundColor: theme.background }]}>
      {loading && !data ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={theme.primary} />
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: Spacing.four, paddingBottom: insets.bottom + 24 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                void load();
              }}
            />
          }
        >
          <Text style={[styles.title, { color: theme.text, fontFamily: Fonts.sansSemiBold }]}>
            Статистика за {monthYm}
          </Text>
          {data ? (
            <>
              <View style={[styles.totals, { backgroundColor: theme.cardBackground }]}>
                <Stat label="Всего" value={data.totals.all} theme={theme} />
                <Stat label="Абонемент" value={data.totals.subscription} theme={theme} />
                <Stat label="Разовые" value={data.totals.single} theme={theme} />
                <Stat label="Диагностики" value={data.totals.diagnostics} theme={theme} />
              </View>
              {data.rows.map((r) => (
                <View
                  key={r.label}
                  style={[styles.row, { backgroundColor: theme.cardBackground, borderColor: theme.backgroundSelected }]}
                >
                  <Text style={{ fontFamily: Fonts.sansSemiBold, color: theme.text }}>{r.label}</Text>
                  <Text style={{ fontFamily: Fonts.sans, color: theme.textSecondary, fontSize: 13 }}>
                    абон. {r.subscription} · разов. {r.single} · всего {r.total}
                  </Text>
                </View>
              ))}
            </>
          ) : (
            <Text style={{ color: theme.textSecondary, fontFamily: Fonts.sans }}>Нет данных</Text>
          )}
        </ScrollView>
      )}
    </ThemedView>
  );
}

function Stat({ label, value, theme }: { label: string; value: number; theme: ReturnType<typeof useTheme> }) {
  return (
    <View style={{ alignItems: "center", flex: 1 }}>
      <Text style={{ fontFamily: Fonts.sansBold, fontSize: 18, color: theme.primary }}>{value}</Text>
      <Text style={{ fontFamily: Fonts.sans, fontSize: 11, color: theme.textSecondary }}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  title: { fontSize: 18, marginBottom: Spacing.three },
  totals: {
    flexDirection: "row",
    borderRadius: BorderRadius.card,
    padding: Spacing.three,
    marginBottom: Spacing.three,
    maxWidth: MaxContentWidth,
    alignSelf: "center",
    width: "100%",
  },
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
