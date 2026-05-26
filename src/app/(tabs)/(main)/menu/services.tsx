import { Ionicons } from "@expo/vector-icons";
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

import { ServiceDetailModal } from "@/components/services/ServiceDetailModal";
import { ServiceListItem } from "@/components/services/ServiceListItem";
import { ThemedView } from "@/components/themed-view";
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
  groupServicesByType,
  type ClientServiceItem,
} from "@/lib/services-shared";

export default function ServicesScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { authApi, isSignedIn } = useAuth();

  const [services, setServices] = useState<ClientServiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detailService, setDetailService] = useState<ClientServiceItem | null>(null);

  const load = useCallback(async () => {
    if (!isSignedIn) {
      setLoading(false);
      return;
    }
    setError(null);
    try {
      const res = await fetchWithAuth("/specialist/services", {}, authApi);
      if (!res.ok) {
        const json = (await res.json().catch(() => ({}))) as { error?: string };
        setError(
          json.error ?? "Не удалось загрузить список услуг. Попробуйте обновить экран чуть позже.",
        );
        setServices([]);
        return;
      }
      const json = (await res.json()) as { data: ClientServiceItem[] };
      setServices(
        (json.data ?? []).map((s) => ({
          ...s,
          sections: s.sections ?? [],
        })),
      );
    } catch {
      setError("Проблемы с загрузкой. Проверьте интернет и попробуйте ещё раз.");
      setServices([]);
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

  const groups = groupServicesByType(services);

  return (
    <ThemedView style={[styles.container, { backgroundColor: theme.background }]}>
      {loading && services.length === 0 ? (
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
            <View style={styles.header}>
              <View style={styles.headerRow}>
                <Ionicons name="sparkles" size={22} color={theme.primary} />
                <Text
                  style={[
                    styles.headerTitle,
                    { color: theme.text, fontFamily: Fonts.sansSemiBold },
                  ]}
                >
                  Услуги и цены
                </Text>
              </View>
              <Text
                style={[
                  styles.headerSub,
                  { color: theme.textSecondary, fontFamily: Fonts.sans },
                ]}
              >
                Каталог услуг центра — для информации
              </Text>
            </View>

            {error ? (
              <ThemedView type="card" style={styles.errorCard}>
                <Text
                  style={[
                    styles.errorText,
                    { color: theme.primary, fontFamily: Fonts.sans },
                  ]}
                >
                  {error}
                </Text>
              </ThemedView>
            ) : null}

            {!error && services.length === 0 ? (
              <ThemedView type="card" style={styles.emptyCard}>
                <Ionicons name="sparkles-outline" size={36} color={theme.textSecondary} />
                <Text
                  style={[
                    styles.emptyText,
                    { color: theme.textSecondary, fontFamily: Fonts.sans },
                  ]}
                >
                  Список услуг пока не заполнен
                </Text>
              </ThemedView>
            ) : null}

            {groups.map((group) => (
              <View key={group.type} style={styles.group}>
                <Text
                  style={[
                    styles.groupLabel,
                    { color: theme.text, fontFamily: Fonts.sansSemiBold },
                  ]}
                >
                  {group.label}
                </Text>
                <ThemedView type="card" style={styles.groupCard}>
                  {group.items.map((item, index) => (
                    <ServiceListItem
                      key={item.id}
                      service={item}
                      onPress={() => setDetailService(item)}
                      showDivider={index < group.items.length - 1}
                    />
                  ))}
                </ThemedView>
              </View>
            ))}
          </View>
        </ScrollView>
      )}

      <ServiceDetailModal
        service={detailService}
        visible={detailService != null}
        onClose={() => setDetailService(null)}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loader: { flex: 1, alignItems: "center", justifyContent: "center" },
  scrollContent: {
    flexGrow: 1,
    paddingTop: Spacing.two,
    maxWidth: MaxContentWidth,
    alignSelf: "center",
    width: "100%",
  },
  content: { gap: Spacing.three },
  header: { gap: 4 },
  headerRow: { flexDirection: "row", alignItems: "center", gap: Spacing.two },
  headerTitle: { fontSize: 20 },
  headerSub: { fontSize: 14, lineHeight: 20 },
  group: { gap: Spacing.two },
  groupLabel: { fontSize: 14, paddingHorizontal: 2 },
  groupCard: {
    borderRadius: BorderRadius.card,
    overflow: "hidden",
    paddingVertical: 0,
    paddingHorizontal: 0,
  },
  emptyCard: {
    alignItems: "center",
    padding: Spacing.five,
    gap: Spacing.three,
    borderRadius: BorderRadius.card,
  },
  emptyText: { fontSize: 14, textAlign: "center" },
  errorCard: { padding: Spacing.four, borderRadius: BorderRadius.card },
  errorText: { fontSize: 14 },
});
