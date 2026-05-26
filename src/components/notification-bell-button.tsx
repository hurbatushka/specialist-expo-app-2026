import { Link, usePathname } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { isMenuRootPath } from "@/constants/navigation";
import { useNotificationUnread } from "@/contexts/notification-unread-context";
import { useTheme } from "@/hooks/use-theme";

type Props = {
  color?: string;
  size?: number;
};

/** Колокольчик уведомлений — только на экране «Меню». */
export function NotificationBellButton({ color, size = 22 }: Props) {
  const pathname = usePathname();
  const theme = useTheme();
  const { unreadCount } = useNotificationUnread();
  const iconColor = color ?? theme.text;

  if (!isMenuRootPath(pathname)) return null;

  return (
    <Link href="/menu/notifications" asChild>
      <Pressable
        hitSlop={12}
        accessibilityRole="button"
        accessibilityLabel="Уведомления"
        style={styles.wrap}
      >
        <Ionicons name="notifications-outline" size={size} color={iconColor} />
        {unreadCount > 0 && (
          <View style={[styles.badge, { backgroundColor: theme.primary }]}>
            <Text style={styles.badgeText}>
              {unreadCount > 99 ? "99+" : unreadCount}
            </Text>
          </View>
        )}
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    position: "absolute",
    top: 6,
    right: 4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
  },
});
