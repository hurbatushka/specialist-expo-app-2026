import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, Switch, Text, View } from "react-native";

import { BorderRadius, Fonts, Spacing } from "@/constants/theme";
import { useAuth } from "@/contexts/auth-context";
import { useTheme } from "@/hooks/use-theme";
import { fetchWithAuth } from "@/lib/api";
import { openExternalUrl } from "@/lib/open-external-url";

type State = {
  enabled: boolean;
  hasTelegram: boolean;
  username: string | null;
  botUrl: string | null;
};

export function TelegramNotificationsBlock() {
  const theme = useTheme();
  const { authApi, isSignedIn } = useAuth();
  const [state, setState] = useState<State | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!isSignedIn) {
      setLoading(false);
      return;
    }
    try {
      const res = await fetchWithAuth("/specialist/settings/notifications", {}, authApi);
      if (res.ok) {
        const json = (await res.json()) as State;
        setState({
          enabled: Boolean(json.enabled),
          hasTelegram: Boolean(json.hasTelegram),
          username: json.username ?? null,
          botUrl: json.botUrl ?? null,
        });
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [authApi, isSignedIn]);

  useEffect(() => {
    void load();
  }, [load]);

  async function toggle(next: boolean) {
    if (!state || saving) return;
    if (next && !state.hasTelegram) {
      Alert.alert(
        "Подключите Telegram",
        "Откройте бот @BlagodetiBot, нажмите Start и привяжите аккаунт. После — обновите этот экран.",
        [
          { text: "Закрыть", style: "cancel" },
          ...(state.botUrl
            ? [{ text: "Открыть бот", onPress: () => void openExternalUrl(state.botUrl!) }]
            : []),
        ],
      );
      return;
    }
    setSaving(true);
    try {
      const res = await fetchWithAuth(
        "/specialist/settings/notifications",
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ enabled: next }),
        },
        authApi,
      );
      if (res.ok) {
        setState((s) => (s ? { ...s, enabled: next } : s));
      } else {
        Alert.alert("Не удалось обновить", "Попробуйте ещё раз позже.");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.cardBackground, borderColor: theme.backgroundElement },
      ]}
    >
      <View style={styles.row}>
        <View style={styles.iconWrap}>
          <Ionicons name="paper-plane-outline" size={22} color={theme.text} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.label, { color: theme.text, fontFamily: Fonts.sansMedium }]}>
            Telegram-уведомления
          </Text>
          <Text style={[styles.sub, { color: theme.textSecondary, fontFamily: Fonts.sans }]}>
            {loading
              ? "Загрузка…"
              : state?.hasTelegram
                ? state.username
                  ? `Подключено: @${state.username}`
                  : "Подключено"
                : "Бот @BlagodetiBot не привязан"}
          </Text>
        </View>
        {loading || saving ? (
          <ActivityIndicator />
        ) : (
          <Switch
            value={Boolean(state?.enabled && state?.hasTelegram)}
            onValueChange={toggle}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: Spacing.three,
    borderRadius: BorderRadius.section,
    borderWidth: StyleSheet.hairlineWidth,
  },
  row: { flexDirection: "row", alignItems: "center", gap: Spacing.two },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.04)",
  },
  label: { fontSize: 15 },
  sub: { fontSize: 12, marginTop: 4 },
});
