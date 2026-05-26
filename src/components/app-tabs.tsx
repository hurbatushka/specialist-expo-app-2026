import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { Image, Platform } from "react-native";

import homeIcon from "@/assets/images/tabIcons/home/home.png";
import menuIcon from "@/assets/images/tabIcons/menu/menu.png";
import scheduleIcon from "@/assets/images/tabIcons/schedule/schedule.png";
import { Fonts } from "@/constants/theme";
import { useNotificationUnread } from "@/contexts/notification-unread-context";
import { useTheme } from "@/hooks/use-theme";

function formatBadge(count: number): string {
  if (count > 99) return "99+";
  return String(count);
}

function TabPngIcon({ source, focused }: { source: number; focused: boolean }) {
  return (
    <Image
      source={source}
      style={{ width: 24, height: 24, opacity: focused ? 1 : 0.72 }}
      resizeMode="contain"
    />
  );
}

function TabIonIcon({
  name,
  color,
  focused,
}: {
  name: keyof typeof Ionicons.glyphMap;
  color: string;
  focused: boolean;
}) {
  return (
    <Ionicons name={name} size={24} color={color} style={{ opacity: focused ? 1 : 0.78 }} />
  );
}

/**
 * Табы специалиста: Главная / Расписание / Клиенты / Меню.
 * Статистика и онлайн доступны через раздел «Ещё».
 */
export default function AppTabs() {
  const theme = useTheme();
  const { unreadCount } = useNotificationUnread();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textSecondary,
        tabBarStyle: {
          backgroundColor: theme.cardBackground,
          borderTopColor: theme.backgroundSelected,
        },
        tabBarLabelStyle: {
          fontFamily: Fonts.sansMedium,
          fontSize: 11,
        },
        ...(Platform.OS === "android"
          ? { tabBarRippleColor: "rgba(196, 45, 38, 0.14)" }
          : {}),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Главная",
          tabBarIcon: ({ focused }) => (
            <TabPngIcon source={homeIcon} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="schedule"
        options={{
          title: "Расписание",
          tabBarIcon: ({ focused }) => (
            <TabPngIcon source={scheduleIcon} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="clients"
        options={{
          title: "Клиенты",
          tabBarIcon: ({ color, focused }) => (
            <TabIonIcon name="people-outline" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="menu"
        options={{
          title: "Меню",
          tabBarBadge: unreadCount > 0 ? formatBadge(unreadCount) : undefined,
          tabBarIcon: ({ focused }) => (
            <TabPngIcon source={menuIcon} focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}
