import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { BorderRadius, Fonts, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

type Props = {
  title: string;
  subtitle: string;
  badge: string;
  variant: "pending" | "completed";
  onPress: () => void;
  showDivider?: boolean;
};

export function SurveyListRow({
  title,
  subtitle,
  badge,
  variant,
  onPress,
  showDivider,
}: Props) {
  const theme = useTheme();
  const iconBg =
    variant === "pending" ? `${theme.primary}18` : "rgba(16, 185, 129, 0.12)";
  const iconColor = variant === "pending" ? theme.primary : "#059669";
  const badgeBg = variant === "pending" ? "rgba(245, 158, 11, 0.12)" : "rgba(16, 185, 129, 0.12)";
  const badgeColor = variant === "pending" ? "#b45309" : "#059669";

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        pressed && { opacity: 0.85 },
        showDivider && {
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: theme.backgroundElement,
        },
      ]}
    >
      <View style={[styles.iconWrap, { backgroundColor: iconBg }]}>
        <Ionicons name="clipboard-outline" size={18} color={iconColor} />
      </View>
      <View style={styles.main}>
        <Text
          style={[styles.title, { color: theme.text, fontFamily: Fonts.sansSemiBold }]}
          numberOfLines={2}
        >
          {title}
        </Text>
        <Text
          style={[styles.subtitle, { color: theme.textSecondary, fontFamily: Fonts.sans }]}
          numberOfLines={1}
        >
          {subtitle}
        </Text>
      </View>
      <View style={[styles.badge, { backgroundColor: badgeBg }]}>
        <Text style={[styles.badgeText, { color: badgeColor, fontFamily: Fonts.sansSemiBold }]}>
          {badge}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.three,
    paddingVertical: Spacing.four,
    paddingHorizontal: Spacing.four,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  main: { flex: 1, minWidth: 0, gap: 2 },
  title: { fontSize: 15 },
  subtitle: { fontSize: 12 },
  badge: {
    borderRadius: 18,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: { fontSize: 11 },
});
