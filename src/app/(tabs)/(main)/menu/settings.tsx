import { useRouter } from "expo-router";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { NotificationsSettingsBlock } from "@/components/settings/NotificationsSettingsBlock";
import { TelegramNotificationsBlock } from "@/components/settings/TelegramNotificationsBlock";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import {
  BottomTabInset,
  BorderRadius,
  Fonts,
  MaxContentWidth,
  Spacing,
} from "@/constants/theme";
import { useAuth } from "@/contexts/auth-context";
import { useTheme } from "@/hooks/use-theme";
import { clearOnboardingDone } from "@/lib/onboarding";
import { openExternalUrl } from "@/lib/open-external-url";

const PRIVACY_URL = "https://app.blagodeti.by/privacy-policy";
const TERMS_URL = "https://app.blagodeti.by/terms";

type RowProps = {
  label: string;
  subtitle?: string;
  onPress: () => void;
  danger?: boolean;
};

function SettingsRow({ label, subtitle, onPress, danger }: RowProps) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor: theme.cardBackground,
          borderColor: theme.backgroundElement,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      <View style={{ flex: 1 }}>
        <Text
          style={[
            styles.rowLabel,
            {
              color: danger ? "#dc2626" : theme.text,
              fontFamily: Fonts.sansMedium,
            },
          ]}
        >
          {label}
        </Text>
        {subtitle ? (
          <Text style={[styles.rowSub, { color: theme.textSecondary, fontFamily: Fonts.sans }]}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      <Text style={{ color: theme.textSecondary, fontSize: 18 }}>›</Text>
    </Pressable>
  );
}

export default function SettingsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { isSignedIn, logout } = useAuth();

  function openUrl(url: string) {
    void openExternalUrl(url);
  }

  async function handleLogout() {
    Alert.alert("Выход", "Выйти из аккаунта?", [
      { text: "Отмена", style: "cancel" },
      {
        text: "Выйти",
        style: "destructive",
        onPress: () => void logout(),
      },
    ]);
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]} edges={["bottom", "left", "right"]}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: BottomTabInset + Spacing.four },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <ThemedView style={styles.container}>
          <ThemedText type="subtitle">Настройки</ThemedText>
          <Text style={[styles.intro, { color: theme.textSecondary, fontFamily: Fonts.sans }]}>
            Уведомления, документы и приложение
          </Text>

          <NotificationsSettingsBlock />
          <TelegramNotificationsBlock />

          <View style={styles.list}>
            <SettingsRow
              label="О приложении"
              subtitle="Реквизиты, партнёры, свидетельство о регистрации"
              onPress={() => router.push("/menu/about" as never)}
            />
            <SettingsRow
              label="Политика конфиденциальности"
              subtitle="Откроется в браузере"
              onPress={() => void openUrl(PRIVACY_URL)}
            />
            <SettingsRow
              label="Публичная оферта и условия"
              subtitle="Откроется в браузере"
              onPress={() => void openUrl(TERMS_URL)}
            />
            <SettingsRow
              label="Познакомиться с приложением"
              subtitle="Краткий тур по разделам"
              onPress={() => {
                void clearOnboardingDone().then(() => {
                  router.push("/first-steps");
                });
              }}
            />
          </View>

          {isSignedIn ? (
            <View style={[styles.list, { marginTop: Spacing.three }]}>
              <SettingsRow label="Выйти из аккаунта" onPress={handleLogout} danger />
            </View>
          ) : null}
        </ThemedView>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
    maxWidth: MaxContentWidth,
    width: "100%",
    alignSelf: "center",
  },
  container: { gap: Spacing.three },
  intro: { fontSize: 14, marginTop: -Spacing.two },
  list: { gap: Spacing.two },
  row: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.three,
    borderRadius: BorderRadius.section,
    borderWidth: StyleSheet.hairlineWidth,
    gap: Spacing.two,
  },
  rowLabel: { fontSize: 15 },
  rowSub: { fontSize: 12, marginTop: 4 },
});
