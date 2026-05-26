import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { ThemedView } from "@/components/themed-view";
import { BorderRadius, Fonts, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

type Props = {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  loading?: boolean;
  onPress: () => void;
};

function initials(firstName?: string, lastName?: string): string {
  const a = firstName?.[0] ?? lastName?.[0] ?? "?";
  return a.toUpperCase();
}

function displayName(firstName?: string, lastName?: string, loading?: boolean): string {
  if (loading) return "Загрузка…";
  const full = [lastName, firstName].filter(Boolean).join(" ");
  return full || "Профиль";
}

export function MenuProfileCard({
  firstName,
  lastName,
  email,
  phone,
  loading,
  onPress,
}: Props) {
  const theme = useTheme();
  const secondary = email || phone;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Профиль"
      style={({ pressed }) => [{ opacity: pressed ? 0.92 : 1 }]}
    >
      <ThemedView type="card" style={styles.card}>
        <View
          style={[
            styles.avatar,
            { backgroundColor: `${theme.primary}18` },
          ]}
        >
          <Text
            style={[
              styles.avatarText,
              { color: theme.primary, fontFamily: Fonts.sansBold },
            ]}
          >
            {initials(firstName, lastName)}
          </Text>
        </View>
        <View style={styles.textCol}>
          <Text
            style={[
              styles.name,
              { color: theme.text, fontFamily: Fonts.sansSemiBold },
            ]}
            numberOfLines={1}
          >
            {displayName(firstName, lastName, loading)}
          </Text>
          {secondary ? (
            <Text
              style={[
                styles.meta,
                { color: theme.textSecondary, fontFamily: Fonts.sans },
              ]}
              numberOfLines={1}
            >
              {secondary}
            </Text>
          ) : null}
        </View>
        <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
      </ThemedView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.four,
    borderRadius: BorderRadius.card,
    gap: Spacing.three,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 22,
  },
  textCol: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  name: {
    fontSize: 17,
    lineHeight: 22,
  },
  meta: {
    fontSize: 13,
    lineHeight: 18,
  },
});
