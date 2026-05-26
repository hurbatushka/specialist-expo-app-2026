import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { BorderRadius, Fonts, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import {
  formatServicePrice,
  type ClientServiceItem,
} from "@/lib/services-shared";

type Props = {
  service: ClientServiceItem;
  showDivider?: boolean;
  onPress?: () => void;
};

export function ServiceListItem({ service, showDivider, onPress }: Props) {
  const theme = useTheme();

  const content = (
    <>
      <View style={styles.main}>
        <View style={styles.nameRow}>
          <Text
            style={[styles.name, { color: theme.text, fontFamily: Fonts.sansSemiBold }]}
            numberOfLines={2}
          >
            {service.name}
          </Text>
          {service.popular ? (
            <View style={[styles.popular, { backgroundColor: `${theme.primary}18` }]}>
              <Text
                style={[
                  styles.popularText,
                  { color: theme.primary, fontFamily: Fonts.sansSemiBold },
                ]}
              >
                Популярное
              </Text>
            </View>
          ) : null}
        </View>

        <View style={styles.metaRow}>
          <Ionicons name="time-outline" size={14} color={theme.textSecondary} />
          <Text
            style={[
              styles.meta,
              { color: theme.textSecondary, fontFamily: Fonts.sans },
            ]}
          >
            {service.durationMinutes} мин
          </Text>
        </View>

        {service.description ? (
          <Text
            style={[
              styles.description,
              { color: theme.textSecondary, fontFamily: Fonts.sans },
            ]}
            numberOfLines={2}
          >
            {service.description}
          </Text>
        ) : null}
        {onPress ? (
          <Text style={[styles.moreLink, { color: theme.primary, fontFamily: Fonts.sansMedium }]}>
            Подробнее
          </Text>
        ) : null}
      </View>

      <View style={styles.prices}>
        <Text style={[styles.price, { color: theme.text, fontFamily: Fonts.sansSemiBold }]}>
          {formatServicePrice(service.price)}
          <Text style={[styles.priceHint, { fontFamily: Fonts.sans }]}> разово</Text>
        </Text>
        {service.subscriptionPrice != null ? (
          <Text
            style={[
              styles.subPrice,
              { color: theme.primary, fontFamily: Fonts.sansSemiBold },
            ]}
          >
            {formatServicePrice(service.subscriptionPrice)} по абонементу
          </Text>
        ) : null}
      </View>
      {onPress ? (
        <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
      ) : null}
    </>
  );

  const rowStyle = [
    styles.row,
    showDivider && {
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.backgroundElement,
    },
  ];

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [rowStyle, { opacity: pressed ? 0.88 : 1 }]}
      >
        {content}
      </Pressable>
    );
  }

  return <View style={rowStyle}>{content}</View>;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.three,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.three,
  },
  main: { flex: 1, minWidth: 0, gap: 4 },
  nameRow: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 6 },
  name: { fontSize: 15, lineHeight: 20, flexShrink: 1 },
  popular: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  popularText: { fontSize: 9, letterSpacing: 0.4, textTransform: "uppercase" },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  meta: { fontSize: 13 },
  description: { fontSize: 13, lineHeight: 18, marginTop: 2 },
  moreLink: { fontSize: 12, marginTop: 4 },
  prices: { alignItems: "flex-end", gap: 4, maxWidth: 130 },
  price: { fontSize: 15, textAlign: "right" },
  priceHint: { fontSize: 11, fontWeight: "400" },
  subPrice: { fontSize: 12, textAlign: "right" },
});
