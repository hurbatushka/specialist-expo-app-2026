import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTheme } from "@/hooks/use-theme";
import { Fonts, Spacing } from "@/constants/theme";

type Props = {
  title: string;
  subtitle?: string;
};

export function MainTabHeader({ title, subtitle }: Props) {
  const insets = useSafeAreaInsets();
  const theme = useTheme();

  return (
    <View style={[styles.row, { paddingTop: insets.top + Spacing.two }]}>
      <View style={styles.textCol}>
        <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text
            style={[styles.subtitle, { color: theme.textSecondary }]}
            numberOfLines={2}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.two,
    gap: 8,
  },
  textCol: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 22,
  },
  subtitle: {
    fontFamily: Fonts.sans,
    fontSize: 14,
    marginTop: 4,
  },
});
