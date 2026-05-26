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

import { MenuGroup, MenuSectionLabel } from "@/components/menu/MenuRow";
import { ProfileInfoRow } from "@/components/menu/ProfileInfoRow";
import { ThemedView } from "@/components/themed-view";
import {
  BottomTabInset,
  BorderRadius,
  Fonts,
  MaxContentWidth,
  Spacing,
} from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { fetchWithAuth } from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";

type ProfileData = {
  lastName: string;
  firstName: string;
  middleName: string;
  fullName: string | null;
  position: string | null;
  specializations: string[];
  phone: string;
  email: string;
  city: string;
  gender: string;
  birthDate: string;
};

function formatGender(g: string): string {
  if (g === "M") return "Мужской";
  if (g === "F") return "Женский";
  return "—";
}

function formatBirthDate(d: string): string {
  if (!d) return "—";
  const parts = d.split("-");
  if (parts.length !== 3) return d;
  return `${parts[2]}.${parts[1]}.${parts[0]}`;
}

function displayName(p: ProfileData): string {
  const parts = [p.lastName, p.firstName, p.middleName].filter(Boolean);
  return parts.join(" ") || "—";
}

function initials(p: ProfileData): string {
  const a = p.firstName?.[0] ?? p.lastName?.[0] ?? "?";
  return a.toUpperCase();
}

export default function ProfileScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { authApi, isSignedIn } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!isSignedIn) {
      setLoading(false);
      return;
    }
    try {
      const res = await fetchWithAuth("/specialist/profile", {}, authApi);
      if (res.ok) {
        setProfile((await res.json()) as ProfileData);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [authApi, isSignedIn]);

  useEffect(() => {
    void load();
  }, [load]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    void load();
  }, [load]);

  if (loading && !profile) {
    return (
      <ThemedView style={[styles.screen, { backgroundColor: theme.background }]}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      </ThemedView>
    );
  }

  if (!profile) {
    return (
      <ThemedView style={[styles.screen, { backgroundColor: theme.background }]}>
        <View style={styles.center}>
          <Text style={{ color: theme.textSecondary, fontFamily: Fonts.sans }}>
            Не удалось загрузить профиль
          </Text>
        </View>
      </ThemedView>
    );
  }

  const fioRows = [
    { label: "Фамилия", value: profile.lastName },
    { label: "Имя", value: profile.firstName },
    { label: "Отчество", value: profile.middleName },
  ];

  const contactRows = [
    ...(profile.position
      ? [{ label: "Должность", value: profile.position }]
      : []),
    ...(profile.specializations.length > 0
      ? [{ label: "Специализация", value: profile.specializations.join(", ") }]
      : []),
    { label: "Email", value: profile.email },
    { label: "Телефон", value: profile.phone },
    { label: "Город", value: profile.city },
    { label: "Дата рождения", value: formatBirthDate(profile.birthDate) },
    { label: "Пол", value: formatGender(profile.gender) },
  ];

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: theme.background }]}
      contentContainerStyle={[
        styles.scrollContent,
        {
          paddingTop: Spacing.two,
          paddingBottom: insets.bottom + BottomTabInset + Spacing.four,
        },
      ]}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.inner}>
        <ThemedView type="card" style={styles.hero}>
          <View
            style={[styles.avatar, { backgroundColor: `${theme.primary}18` }]}
          >
            <Text
              style={[
                styles.avatarText,
                { color: theme.primary, fontFamily: Fonts.sansBold },
              ]}
            >
              {initials(profile)}
            </Text>
          </View>
          <Text
            style={[
              styles.heroName,
              { color: theme.text, fontFamily: Fonts.sansSemiBold },
            ]}
          >
            {displayName(profile)}
          </Text>
          {profile.email ? (
            <Text
              style={[
                styles.heroMeta,
                { color: theme.textSecondary, fontFamily: Fonts.sans },
              ]}
            >
              {profile.email}
            </Text>
          ) : null}
          {profile.phone ? (
            <Text
              style={[
                styles.heroMeta,
                { color: theme.textSecondary, fontFamily: Fonts.sans },
              ]}
            >
              {profile.phone}
            </Text>
          ) : null}
        </ThemedView>

        <View style={styles.notice}>
          <View
            style={[
              styles.noticeIcon,
              { backgroundColor: `${theme.primary}12` },
            ]}
          >
            <Ionicons
              name="information-circle-outline"
              size={20}
              color={theme.primary}
            />
          </View>
          <Text
            style={[
              styles.noticeText,
              { color: theme.textSecondary, fontFamily: Fonts.sans },
            ]}
          >
            ФИО и должность меняет администратор. Контакты можно обновить через
            настройки или администратора центра.
          </Text>
        </View>

        <View style={styles.section}>
          <MenuSectionLabel>Личные данные</MenuSectionLabel>
          <MenuGroup>
            {fioRows.map((row, index) => (
              <ProfileInfoRow
                key={row.label}
                label={row.label}
                value={row.value}
                showDivider={index < fioRows.length - 1}
              />
            ))}
          </MenuGroup>
        </View>

        <View style={styles.section}>
          <MenuSectionLabel>Контакты</MenuSectionLabel>
          <MenuGroup>
            {contactRows.map((row, index) => (
              <ProfileInfoRow
                key={row.label}
                label={row.label}
                value={row.value}
                showDivider={index < contactRows.length - 1}
              />
            ))}
          </MenuGroup>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.four,
    maxWidth: MaxContentWidth,
    width: "100%",
    alignSelf: "center",
  },
  inner: { gap: Spacing.four },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  hero: {
    alignItems: "center",
    padding: Spacing.five,
    borderRadius: BorderRadius.card,
    gap: Spacing.two,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.one,
  },
  avatarText: { fontSize: 28 },
  heroName: {
    fontSize: 20,
    lineHeight: 26,
    textAlign: "center",
  },
  heroMeta: {
    fontSize: 14,
    lineHeight: 19,
    textAlign: "center",
  },
  notice: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.three,
    paddingHorizontal: Spacing.half,
  },
  noticeIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  noticeText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  section: { gap: Spacing.two },
});
