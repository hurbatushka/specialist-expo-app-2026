import { useLocalSearchParams, useRouter } from "expo-router";
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

import { NavigationChrome } from "@/components/glass-header";
import { ThemedView } from "@/components/themed-view";
import {
  BorderRadius,
  Fonts,
  MaxContentWidth,
  Spacing,
} from "@/constants/theme";
import { useAuth } from "@/contexts/auth-context";
import { useTheme } from "@/hooks/use-theme";
import { fetchWithAuth } from "@/lib/api";

type ClientDetail = {
  id: string;
  fullName: string | null;
  phone: string | null;
  email: string | null;
  lastLessonAt: string | null;
};

export default function ClientDetailScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { authApi } = useAuth();
  const { id } = useLocalSearchParams<{ id: string }>();
  const clientId = typeof id === "string" ? id : id?.[0] ?? "";

  const [data, setData] = useState<ClientDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!clientId) return;
    setError(null);
    try {
      const res = await fetchWithAuth(`/specialist/clients/${clientId}`, {}, authApi);
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        setError(j.error ?? `Ошибка ${res.status}`);
        return;
      }
      setData((await res.json()) as ClientDetail);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка загрузки");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [authApi, clientId]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <ThemedView style={[styles.root, { backgroundColor: theme.background }]}>
      <NavigationChrome
        title={data?.fullName?.trim() || "Клиент"}
        canGoBack
        showSettings={false}
        onBack={() => router.back()}
      />
      {loading && !data ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : error || !data ? (
        <View style={styles.center}>
          <Text style={{ color: theme.textSecondary, fontFamily: Fonts.sans }}>
            {error ?? "Не найдено"}
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{
            padding: Spacing.four,
            paddingBottom: insets.bottom + Spacing.six,
          }}
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
          <View style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: theme.backgroundSelected }]}>
            <InfoRow label="ФИО" value={data.fullName?.trim() || "—"} theme={theme} />
            <InfoRow label="Телефон" value={data.phone?.trim() || "—"} theme={theme} />
            <InfoRow label="Email" value={data.email?.trim() || "—"} theme={theme} />
            <InfoRow
              label="Последнее занятие"
              value={
                data.lastLessonAt
                  ? new Date(data.lastLessonAt).toLocaleString("ru-RU")
                  : "—"
              }
              theme={theme}
            />
          </View>
        </ScrollView>
      )}
    </ThemedView>
  );
}

function InfoRow({
  label,
  value,
  theme,
}: {
  label: string;
  value: string;
  theme: ReturnType<typeof useTheme>;
}) {
  return (
    <View style={styles.infoRow}>
      <Text style={[styles.label, { color: theme.textSecondary, fontFamily: Fonts.sansMedium }]}>
        {label}
      </Text>
      <Text style={[styles.value, { color: theme.text, fontFamily: Fonts.sans }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  card: {
    maxWidth: MaxContentWidth,
    width: "100%",
    alignSelf: "center",
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  infoRow: { gap: 4 },
  label: { fontSize: 12 },
  value: { fontSize: 15 },
});
