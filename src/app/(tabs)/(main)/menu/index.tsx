import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { MenuProfileCard } from "@/components/menu/MenuProfileCard";
import {
  MenuGroup,
  MenuRow,
  MenuSectionLabel,
  type MenuIconName,
} from "@/components/menu/MenuRow";
import { ThemedView } from "@/components/themed-view";
import {
  BottomTabInset,
  MaxContentWidth,
  Spacing,
} from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { fetchWithAuth } from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";
import { useNotificationUnread } from "@/contexts/notification-unread-context";

type ProfileSummary = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
};

type MenuItem = {
  icon: MenuIconName;
  label: string;
  subtitle?: string;
  onPress: () => void;
};

export default function MenuScreen() {
  const router = useRouter();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { authApi, isSignedIn } = useAuth();
  const { refreshUnread } = useNotificationUnread();
  const [profile, setProfile] = useState<ProfileSummary | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);

  const loadProfile = useCallback(async () => {
    if (!isSignedIn) return;
    try {
      const res = await fetchWithAuth("/specialist/profile", {}, authApi);
      if (res.ok) {
        const data = await res.json();
        setProfile({
          firstName: data.firstName || "",
          lastName: data.lastName || "",
          email: data.email || "",
          phone: data.phone || "",
        });
      }
    } catch {
      // silent
    } finally {
      setProfileLoading(false);
    }
  }, [authApi, isSignedIn]);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setProfileLoading(true);
    await Promise.all([loadProfile(), refreshUnread()]);
    setRefreshing(false);
  }, [loadProfile, refreshUnread]);

  const workItems: MenuItem[] = [
    {
      icon: "calendar-outline",
      label: "Расписание",
      subtitle: "Сегодня, неделя и все занятия",
      onPress: () => router.navigate("/schedule"),
    },
    {
      icon: "people-outline",
      label: "Клиенты",
      subtitle: "Ваши клиенты",
      onPress: () => router.navigate("/clients"),
    },
    {
      icon: "videocam-outline",
      label: "Онлайн",
      subtitle: "Ближайшие онлайн-занятия",
      onPress: () => router.push("/menu/online"),
    },
    {
      icon: "time-outline",
      label: "Прошедшие занятия",
      subtitle: "История и комментарии",
      onPress: () => router.push("/menu/completed-lessons"),
    },
    {
      icon: "stats-chart-outline",
      label: "Моя статистика",
      subtitle: "Проведённые занятия по месяцам",
      onPress: () => router.push("/menu/my-stats"),
    },
    {
      icon: "calendar-number-outline",
      label: "Рабочий график",
      subtitle: "Слоты и блокировки",
      onPress: () => router.push("/menu/work-schedule"),
    },
    {
      icon: "flash-outline",
      label: "Интенсивы",
      subtitle: "Активные программы",
      onPress: () => router.push("/menu/intensives"),
    },
  ];

  const infoItems: MenuItem[] = [
    {
      icon: "sparkles-outline",
      label: "Услуги",
      subtitle: "Ваш каталог услуг",
      onPress: () => router.push("/menu/services"),
    },
    {
      icon: "document-text-outline",
      label: "Анкеты",
      subtitle: "Ответы клиентов",
      onPress: () => router.push("/menu/surveys"),
    },
  ];

  const renderGroup = (items: MenuItem[]) =>
    items.map((item, index) => (
      <MenuRow
        key={item.label}
        icon={item.icon}
        label={item.label}
        subtitle={item.subtitle}
        onPress={item.onPress}
        showDivider={index < items.length - 1}
      />
    ));

  return (
    <ScrollView
      style={[styles.scrollView, { backgroundColor: theme.background }]}
      contentContainerStyle={[
        styles.scrollContent,
        {
          paddingBottom: insets.bottom + BottomTabInset + Spacing.four,
          paddingHorizontal: insets.left + Spacing.four,
          paddingRight: insets.right + Spacing.four,
        },
      ]}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <ThemedView style={styles.container}>
        <MenuProfileCard
          firstName={profile?.firstName}
          lastName={profile?.lastName}
          email={profile?.email}
          phone={profile?.phone}
          loading={profileLoading && !profile}
          onPress={() => router.push("/menu/profile")}
        />

        <View style={styles.section}>
          <MenuSectionLabel>Работа</MenuSectionLabel>
          <MenuGroup>{renderGroup(workItems)}</MenuGroup>
        </View>

        <View style={styles.section}>
          <MenuSectionLabel>Справочник</MenuSectionLabel>
          <MenuGroup>{renderGroup(infoItems)}</MenuGroup>
        </View>

        <View style={styles.section}>
          <MenuSectionLabel>Ещё</MenuSectionLabel>
          <MenuGroup>
            <MenuRow
              icon="notifications-outline"
              label="Уведомления"
              subtitle="Сообщения и напоминания"
              onPress={() => router.push("/menu/notifications")}
              showDivider
            />
            <MenuRow
              icon="information-circle-outline"
              label="О приложении"
              subtitle="Документы и реквизиты"
              onPress={() => router.push("/menu/about")}
              showDivider
            />
            <MenuRow
              icon="settings-outline"
              label="Настройки"
              subtitle="Telegram и аккаунт"
              onPress={() => router.push("/menu/settings")}
              showDivider={false}
            />
          </MenuGroup>
        </View>
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingTop: Spacing.one },
  container: {
    maxWidth: MaxContentWidth,
    width: "100%",
    alignSelf: "center",
    gap: Spacing.four,
  },
  section: {
    gap: Spacing.two,
  },
});
