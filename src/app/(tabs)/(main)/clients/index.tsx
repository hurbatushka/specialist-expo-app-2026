import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

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

type ClientRow = {
  id: string;
  fullName: string | null;
  lastLessonAt: string | null;
};

function formatLastLesson(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function ClientsScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { authApi, isSignedIn } = useAuth();

  const [clients, setClients] = useState<ClientRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!isSignedIn) {
      setLoading(false);
      return;
    }
    setError(null);
    try {
      const res = await fetchWithAuth("/specialist/clients", {}, authApi);
      if (!res.ok) {
        setError(`Ошибка ${res.status}`);
        setClients([]);
        return;
      }
      const json = (await res.json()) as { data?: ClientRow[] };
      setClients(Array.isArray(json.data) ? json.data : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка загрузки");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [authApi, isSignedIn]);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter((c) => (c.fullName ?? "").toLowerCase().includes(q));
  }, [clients, search]);

  return (
    <ThemedView style={[styles.root, { backgroundColor: theme.background }]}>
      <View style={[styles.searchWrap, { paddingHorizontal: Spacing.four }]}>
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Поиск по имени"
          placeholderTextColor={theme.textSecondary}
          style={[
            styles.search,
            {
              color: theme.text,
              backgroundColor: theme.cardBackground,
              borderColor: theme.backgroundSelected,
              fontFamily: Fonts.sans,
            },
          ]}
        />
      </View>

      {loading && clients.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{
            paddingBottom: insets.bottom + BottomTabInset + Spacing.four,
            paddingHorizontal: Spacing.four,
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
          <View style={styles.list}>
            {error ? (
              <Text style={{ color: theme.textSecondary, fontFamily: Fonts.sans }}>
                {error}
              </Text>
            ) : filtered.length === 0 ? (
              <Text style={{ color: theme.textSecondary, fontFamily: Fonts.sans }}>
                {search.trim() ? "Никого не найдено" : "Пока нет клиентов"}
              </Text>
            ) : (
              filtered.map((c) => (
                <Pressable
                  key={c.id}
                  onPress={() => router.push(`/clients/${c.id}`)}
                  style={({ pressed }) => [
                    styles.row,
                    {
                      backgroundColor: theme.cardBackground,
                      borderColor: theme.backgroundSelected,
                      opacity: pressed ? 0.9 : 1,
                    },
                  ]}
                >
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[styles.name, { color: theme.text, fontFamily: Fonts.sansSemiBold }]}
                      numberOfLines={1}
                    >
                      {c.fullName?.trim() || "Без имени"}
                    </Text>
                    <Text
                      style={[styles.sub, { color: theme.textSecondary, fontFamily: Fonts.sans }]}
                    >
                      Последнее занятие: {formatLastLesson(c.lastLessonAt)}
                    </Text>
                  </View>
                  <Text style={{ color: theme.textSecondary }}>›</Text>
                </Pressable>
              ))
            )}
          </View>
        </ScrollView>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  searchWrap: { paddingTop: Spacing.two, paddingBottom: Spacing.two },
  search: {
    borderWidth: 1,
    borderRadius: BorderRadius.card,
    paddingHorizontal: Spacing.three,
    paddingVertical: 10,
    fontSize: 15,
  },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  list: { maxWidth: MaxContentWidth, width: "100%", alignSelf: "center", gap: Spacing.two },
  row: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.three,
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    gap: Spacing.two,
  },
  name: { fontSize: 15 },
  sub: { fontSize: 12, marginTop: 2 },
});
