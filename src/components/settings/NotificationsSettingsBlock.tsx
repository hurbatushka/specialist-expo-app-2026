import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, AppState, Platform, Pressable, StyleSheet, Switch, Text, View } from "react-native";

import { BorderRadius, Fonts, Spacing } from "@/constants/theme";
import { useAuth } from "@/contexts/auth-context";
import { useTheme } from "@/hooks/use-theme";
import {
  disablePushTokenOnServer,
  getPushPermissionStatus,
  getPushRuntimeInfo,
  openSystemNotificationSettings,
  requestPushPermission,
  sendTestPushFromServer,
  syncPushToken,
} from "@/lib/push-notifications";

type PermissionStatus = "granted" | "denied" | "undetermined";

export function NotificationsSettingsBlock() {
  const theme = useTheme();
  const { authApi } = useAuth();
  const [permission, setPermission] = useState<PermissionStatus>("undetermined");
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);
  const [testing, setTesting] = useState(false);

  const runtime = getPushRuntimeInfo();

  const refreshStatus = useCallback(async () => {
    const status = (await getPushPermissionStatus()) as PermissionStatus;
    setPermission(status);
    setEnabled((prev) => (status === "granted" ? prev : false));
  }, []);

  useEffect(() => {
    void refreshStatus();
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") void refreshStatus();
    });
    return () => sub.remove();
  }, [refreshStatus]);

  // Когда разрешение granted и тогл включён — синхронизируем токен с сервером
  useEffect(() => {
    if (permission === "granted") setEnabled(true);
  }, [permission]);

  const handleEnable = useCallback(async () => {
    setBusy(true);
    try {
      let status = await getPushPermissionStatus();
      if (status === "undetermined") {
        status = await requestPushPermission();
      }
      setPermission(status as PermissionStatus);
      if (status === "granted") {
        const res = await syncPushToken(authApi, { maxAttempts: 2 });
        if (res.ok) {
          setEnabled(true);
          Alert.alert("Готово", "Уведомления включены.");
        } else {
          Alert.alert(
            "Не удалось включить",
            "Попробуйте позже. Возможно, нет соединения с интернетом.",
          );
        }
      } else if (status === "denied") {
        Alert.alert(
          "Разрешение отключено",
          "Откройте настройки iOS и разрешите уведомления для приложения.",
          [
            { text: "Отмена", style: "cancel" },
            { text: "Открыть настройки", onPress: () => void openSystemNotificationSettings() },
          ],
        );
      }
    } finally {
      setBusy(false);
    }
  }, [authApi]);

  const handleDisable = useCallback(async () => {
    setBusy(true);
    try {
      const ok = await disablePushTokenOnServer(authApi);
      if (ok) {
        setEnabled(false);
        Alert.alert(
          "Уведомления отключены",
          "Push-уведомления больше не будут приходить на это устройство. Чтобы полностью отключить — выключите доступ в Настройках iOS.",
        );
      } else {
        Alert.alert(
          "Не удалось отключить",
          "Попробуйте ещё раз или проверьте соединение с интернетом.",
        );
      }
    } finally {
      setBusy(false);
    }
  }, [authApi]);

  const handleToggle = useCallback(
    (next: boolean) => {
      if (busy) return;
      if (next) void handleEnable();
      else void handleDisable();
    },
    [busy, handleEnable, handleDisable],
  );

  const handleTest = useCallback(async () => {
    setTesting(true);
    try {
      let status = await getPushPermissionStatus();
      if (status === "undetermined") {
        status = await requestPushPermission();
        setPermission(status as PermissionStatus);
      }
      if (status !== "granted") {
        Alert.alert("Сначала включите уведомления", "Разрешите push в настройках iOS.");
        return;
      }

      const sync = await syncPushToken(authApi, { maxAttempts: 2 });
      if (!sync.ok) {
        Alert.alert(
          "Токен не зарегистрирован",
          "Не удалось сохранить push-токен на сервере. Проверьте интернет и попробуйте снова.",
        );
        return;
      }

      const test = await sendTestPushFromServer(authApi);
      if (test.ok) {
        Alert.alert(
          "Отправлено",
          "Тестовый push ушёл с сервера. Если не видите — проверьте, что открыта сборка TestFlight/App Store, не Expo Go.",
        );
        return;
      }
      if (test.reason === "no_token") {
        Alert.alert(
          "Нет токена на сервере",
          "Сборка должна быть TestFlight или App Store. В Expo Go push на прод не доставляются.",
        );
        return;
      }
      Alert.alert("Ошибка", "Не удалось отправить тест. Попробуйте позже.");
    } finally {
      setTesting(false);
    }
  }, [authApi]);

  const subtitle = (() => {
    if (Platform.OS === "web") return "Недоступно в веб-версии";
    if (permission === "denied")
      return "Заблокировано в iOS. Откройте системные настройки.";
    if (permission === "undetermined") return "Нажмите, чтобы разрешить";
    if (!runtime.isStandalone)
      return "Сборка для разработки — на TestFlight/App Store пуши идут отдельно";
    return enabled ? "Разрешены и активны" : "Доступ есть, но push выключены";
  })();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.cardBackground,
          borderColor: theme.backgroundElement,
        },
      ]}
    >
      <View style={styles.row}>
        <View style={styles.iconWrap}>
          <Ionicons
            name="notifications-outline"
            size={22}
            color={theme.text}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.label, { color: theme.text, fontFamily: Fonts.sansMedium }]}>
            Push-уведомления
          </Text>
          <Text style={[styles.sub, { color: theme.textSecondary, fontFamily: Fonts.sans }]}>
            {subtitle}
          </Text>
        </View>
        {busy ? (
          <ActivityIndicator />
        ) : permission === "denied" ? (
          <Pressable onPress={() => void openSystemNotificationSettings()} hitSlop={8}>
            <Text style={[styles.action, { color: theme.primary, fontFamily: Fonts.sansSemiBold }]}>
              Настройки
            </Text>
          </Pressable>
        ) : (
          <Switch
            value={enabled && permission === "granted"}
            onValueChange={handleToggle}
            disabled={Platform.OS === "web"}
          />
        )}
      </View>

      {permission === "granted" && enabled ? (
        <Pressable
          onPress={() => void handleTest()}
          disabled={testing}
          style={({ pressed }) => [
            styles.testBtn,
            { borderColor: theme.backgroundElement, opacity: pressed || testing ? 0.7 : 1 },
          ]}
        >
          {testing ? (
            <ActivityIndicator />
          ) : (
            <Text style={[styles.testText, { color: theme.text, fontFamily: Fonts.sansMedium }]}>
              Отправить тестовое уведомление
            </Text>
          )}
        </Pressable>
      ) : null}

      {runtime.isExpoGo ? (
        <Text style={[styles.hint, { color: theme.textSecondary, fontFamily: Fonts.sans }]}>
          Сейчас открыта сборка Expo Go — push приходят только в установленное приложение из
          App Store / TestFlight.
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: Spacing.three,
    borderRadius: BorderRadius.section,
    borderWidth: StyleSheet.hairlineWidth,
    gap: Spacing.three,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
  },
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
  action: { fontSize: 14 },
  testBtn: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: BorderRadius.section,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
  },
  testText: { fontSize: 14 },
  hint: { fontSize: 11, lineHeight: 16, fontStyle: "italic" },
});
