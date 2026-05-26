import { StyleSheet, Text, View } from "react-native";

import { Fonts } from "@/constants/theme";
import { getLessonKindBadges, type LessonKindSource } from "@/lib/lesson-kind";

type Props = {
  lesson: LessonKindSource;
  compact?: boolean;
};

export function LessonKindBadges({ lesson, compact = false }: Props) {
  const badges = getLessonKindBadges(lesson);
  if (badges.length === 0) return null;

  return (
    <View style={styles.row}>
      {badges.map((b) => (
        <View
          key={b.id}
          style={[
            styles.badge,
            compact && styles.badgeCompact,
            { backgroundColor: b.bg, borderColor: b.border },
          ]}
        >
          <Text
            style={[
              styles.label,
              compact && styles.labelCompact,
              { color: b.text, fontFamily: Fonts.sansSemiBold },
            ]}
          >
            {b.label}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  badge: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeCompact: {
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  label: { fontSize: 10, lineHeight: 13 },
  labelCompact: { fontSize: 9, lineHeight: 12 },
});
