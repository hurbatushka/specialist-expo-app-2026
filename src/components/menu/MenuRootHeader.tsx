import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { NotificationBellButton } from "@/components/notification-bell-button";
import { CardShadow, Fonts, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

/** Шапка корня «Меню»: заголовок + колокольчик в круглой кнопке. */
export function MenuRootHeader() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();

  return (
    <View
      style={[
        styles.wrap,
        {
          paddingTop: insets.top + Spacing.two,
          paddingLeft: insets.left + Spacing.four,
          paddingRight: insets.right + Spacing.four,
        },
      ]}
    >
      <View style={styles.titleRow}>
        <View style={styles.textCol}>
          <Text
            style={[styles.title, { color: theme.text, fontFamily: Fonts.sansSemiBold }]}
          >
            Меню
          </Text>
          <Text
            style={[
              styles.subtitle,
              { color: theme.textSecondary, fontFamily: Fonts.sans },
            ]}
          >
            Разделы личного кабинета
          </Text>
        </View>
        <View
          style={[
            styles.bellWrap,
            { backgroundColor: theme.cardBackground },
            CardShadow,
          ]}
        >
          <NotificationBellButton />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingBottom: Spacing.three,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: Spacing.two,
  },
  textCol: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  title: {
    fontSize: 22,
    lineHeight: 28,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 19,
  },
  bellWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
});
