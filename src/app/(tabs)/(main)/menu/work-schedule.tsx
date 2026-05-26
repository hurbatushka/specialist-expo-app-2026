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

const DAY_NAMES = ["", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

function formatMinutes(m: number): string {
  const h = Math.floor(m / 60);
  const min = m % 60;
  return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
}

type Slot = { id: string; dayOfWeek: number; startMinutes: number; endMinutes: number };
type Blocked = { id: string; startsAt: string; endsAt: string; note: string | null };

export default function WorkScheduleScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { authApi, isSignedIn } = useAuth();

  const [slots, setSlots] = useState<Slot[]>([]);
  const [blocked, setBlocked] = useState<Blocked[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!isSignedIn) return;
    try {
      const res = await fetchWithAuth("/specialist/work-schedule", {}, authApi);
      if (res.ok) {
        const json = (await res.json()) as { slots?: Slot[]; blocked?: Blocked[] };
        setSlots(Array.isArray(json.slots) ? json.slots : []);
        setBlocked(Array.isArray(json.blocked) ? json.blocked : []);
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
      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={theme.primary} />
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: Spacing.four, paddingBottom: insets.bottom + 24 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} />
          }
        >
          <Text style={[styles.h, { color: theme.text, fontFamily: Fonts.sansSemiBold }]}>Рабочие слоты</Text>
          {slots.length === 0 ? (
            <Text style={{ color: theme.textSecondary, fontFamily: Fonts.sans, marginBottom: Spacing.four }}>
              Слоты не заданы
            </Text>
          ) : (
            slots.map((s) => (
              <View key={s.id} style={[styles.row, { backgroundColor: theme.cardBackground }]}>
                <Text style={{ fontFamily: Fonts.sansMedium, color: theme.text }}>
                  {DAY_NAMES[s.dayOfWeek] ?? s.dayOfWeek}: {formatMinutes(s.startMinutes)}–{formatMinutes(s.endMinutes)}
                </Text>
              </View>
            ))
          )}

          <Text style={[styles.h, { color: theme.text, fontFamily: Fonts.sansSemiBold, marginTop: Spacing.four }]}>
            Блокировки
          </Text>
          {blocked.length === 0 ? (
            <Text style={{ color: theme.textSecondary, fontFamily: Fonts.sans }}>Нет блокировок</Text>
          ) : (
            blocked.map((b) => (
              <View key={b.id} style={[styles.row, { backgroundColor: theme.cardBackground }]}>
                <Text style={{ fontFamily: Fonts.sans, color: theme.text }}>
                  {new Date(b.startsAt).toLocaleString("ru-RU")} — {new Date(b.endsAt).toLocaleString("ru-RU")}
                </Text>
                {b.note ? (
                  <Text style={{ fontFamily: Fonts.sans, color: theme.textSecondary, fontSize: 12 }}>{b.note}</Text>
                ) : null}
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
  h: { fontSize: 16, marginBottom: Spacing.two },
  row: {
    borderRadius: BorderRadius.card,
    padding: Spacing.three,
    marginBottom: Spacing.two,
    maxWidth: MaxContentWidth,
    alignSelf: "center",
    width: "100%",
  },
});
