import { StyleSheet, Text, View } from "react-native";

import { Fonts, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

type Props = {
  label: string;
  value: string;
  showDivider?: boolean;
};

export function ProfileInfoRow({ label, value, showDivider = false }: Props) {
  const theme = useTheme();

  return (
    <>
      <View style={styles.row}>
        <Text
          style={[
            styles.label,
            { color: theme.textSecondary, fontFamily: Fonts.sans },
          ]}
        >
          {label}
        </Text>
        <Text
          style={[
            styles.value,
            { color: theme.text, fontFamily: Fonts.sansSemiBold },
          ]}
        >
          {value || "—"}
        </Text>
      </View>
      {showDivider ? (
        <View
          style={[styles.divider, { backgroundColor: theme.backgroundElement }]}
        />
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.three,
    gap: 4,
  },
  label: {
    fontSize: 12,
    lineHeight: 16,
  },
  value: {
    fontSize: 15,
    lineHeight: 21,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: Spacing.three,
    marginRight: Spacing.three,
  },
});
