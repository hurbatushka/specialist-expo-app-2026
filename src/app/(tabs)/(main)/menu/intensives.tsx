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

type Intensive = {
  id: string;
  status: string;
  startDate: string;
  endDate: string | null;
  clientName: string | null;
  lessonsCount: number;
};

export default function IntensivesScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { authApi, isSignedIn } = useAuth();

  const [items, setItems] = useState<Intensive[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!isSignedIn) return;
    try {
      const res = await fetchWithAuth("/specialist/intensives", {}, authApi);
      if (res.ok) {
        const json = (await res.json()) as { data?: Intensive[] };
        setItems(Array.isArray(json.data) ? json.data : []);
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
      {loading && items.length === 0 ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={theme.primary} />
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: Spacing.four, paddingBottom: insets.bottom + 24 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} />
          }
        >
          {items.length === 0 ? (
            <Text style={{ color: theme.textSecondary, fontFamily: Fonts.sans }}>Нет интенсивов</Text>
          ) : (
            items.map((it) => (
              <View key={it.id} style={[styles.row, { backgroundColor: theme.cardBackground, borderColor: theme.backgroundSelected }]}>
                <Text style={{ fontFamily: Fonts.sansSemiBold, color: theme.text }}>
                  {it.clientName?.trim() || "Клиент"}
                </Text>
                <Text style={{ fontFamily: Fonts.sans, color: theme.textSecondary, fontSize: 13 }}>
                  {it.status} · занятий: {it.lessonsCount}
                </Text>
                <Text style={{ fontFamily: Fonts.sans, color: theme.textSecondary, fontSize: 12 }}>
                  с {new Date(it.startDate).toLocaleDateString("ru-RU")}
                  {it.endDate ? ` по ${new Date(it.endDate).toLocaleDateString("ru-RU")}` : ""}
                </Text>
              </View>
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
