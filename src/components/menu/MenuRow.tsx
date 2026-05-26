import { Ionicons } from "@expo/vector-icons";
import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { ThemedView } from "@/components/themed-view";
import { BorderRadius, Fonts, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

export type MenuIconName = keyof typeof Ionicons.glyphMap;

type MenuRowProps = {
  icon: MenuIconName;
  label: string;
  subtitle?: string;
  onPress: () => void;
  showDivider?: boolean;
  accent?: boolean;
};

export function MenuSectionLabel({ children }: { children: string }) {
  const theme = useTheme();
  return (
    <Text
      style={[
        styles.sectionLabel,
        { color: theme.textSecondary, fontFamily: Fonts.sansSemiBold },
      ]}
    >
      {children}
    </Text>
  );
}

export function MenuRow({
  icon,
  label,
  subtitle,
  onPress,
  showDivider = false,
  accent = false,
}: MenuRowProps) {
  const theme = useTheme();
  const iconColor = accent ? theme.primary : theme.text;

  return (
    <>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        style={({ pressed }) => [{ opacity: pressed ? 0.65 : 1 }]}
      >
        <View style={styles.row}>
          <View
            style={[
              styles.iconWrap,
              { backgroundColor: accent ? `${theme.primary}14` : theme.backgroundElement },
            ]}
          >
            <Ionicons name={icon} size={20} color={iconColor} />
          </View>
          <View style={styles.textCol}>
            <Text
              style={[
                styles.label,
                { color: theme.text, fontFamily: Fonts.sansSemiBold },
              ]}
              numberOfLines={1}
            >
              {label}
            </Text>
            {subtitle ? (
              <Text
                style={[
                  styles.subtitle,
                  { color: theme.textSecondary, fontFamily: Fonts.sans },
                ]}
                numberOfLines={1}
              >
                {subtitle}
              </Text>
            ) : null}
          </View>
          <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
        </View>
      </Pressable>
      {showDivider ? (
        <View
          style={[styles.divider, { backgroundColor: theme.backgroundElement }]}
        />
      ) : null}
    </>
  );
}

type MenuGroupProps = {
  children: ReactNode;
  style?: object;
};

/** Белая «плавающая» карточка со списком пунктов. */
export function MenuGroup({ children, style }: MenuGroupProps) {
  return (
    <ThemedView type="card" style={[styles.group, style]}>
      {children}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  sectionLabel: {
    fontSize: 11,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    marginBottom: Spacing.one,
    marginLeft: Spacing.half,
  },
  group: {
    borderRadius: BorderRadius.card,
    paddingVertical: Spacing.one,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.three,
    gap: Spacing.three,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  textCol: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  label: {
    fontSize: 15,
    lineHeight: 20,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 17,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 40 + Spacing.three + Spacing.three,
    marginRight: Spacing.three,
  },
});
