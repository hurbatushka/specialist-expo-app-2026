import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { AppState, Platform, Pressable, StyleSheet, Text, View } from "react-native";

import { BorderRadius, Fonts, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { getPushPermissionStatus, getPushRuntimeInfo } from "@/lib/push-notifications";

type Status = "granted" | "denied" | "undetermined";

/** Показывает плашку «Уведомления выключены — включить», ведёт в /menu/settings. */
export function PushPermissionBanner() {
  const theme = useTheme();
  const router = useRouter();
  const [status, setStatus] = useState<Status>("granted");

  const refresh = useCallback(async () => {
    const next = (await getPushPermissionStatus()) as Status;
    setStatus(next);
  }, []);

  useEffect(() => {
    void refresh();
    const sub = AppState.addEventListener("change", (s) => {
      if (s === "active") void refresh();
    });
    return () => sub.remove();
  }, [refresh]);

  if (Platform.OS === "web") return null;
  if (status === "granted") return null;

  const runtime = getPushRuntimeInfo();
  if (runtime.isExpoGo) return null; // в Expo Go никогда не предлагаем

  const title =
    status === "denied"
      ? "Уведомления отключены"
      : "Включите уведомления";
  const subtitle =
    status === "denied"
      ? "Чтобы не пропускать занятия — разрешите push в настройках"
      : "Нажмите, чтобы разрешить пуши о занятиях";

  return (
    <Pressable
      onPress={() => router.push("/menu/settings")}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: theme.cardBackground,
          borderColor: theme.primary,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      <View style={[styles.iconWrap, { backgroundColor: `${theme.primary}1A` }]}>
        <Ionicons name="notifications-off-outline" size={20} color={theme.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.title, { color: theme.text, fontFamily: Fonts.sansSemiBold }]}>
          {title}
        </Text>
        <Text style={[styles.sub, { color: theme.textSecondary, fontFamily: Fonts.sans }]}>
          {subtitle}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
    padding: Spacing.three,
    marginHorizontal: Spacing.three,
    marginBottom: Spacing.two,
    borderRadius: BorderRadius.section,
    borderWidth: 1,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontSize: 14 },
  sub: { fontSize: 12, marginTop: 2, lineHeight: 16 },
});
