import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import { BottomSheetModal } from "@/components/ui/BottomSheetModal";
import { Fonts, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import {
  formatServicePrice,
  type ClientServiceItem,
  type ClientServiceSection,
} from "@/lib/services-shared";

type Props = {
  service: ClientServiceItem | null;
  visible: boolean;
  onClose: () => void;
};

function SectionBlock({ section }: { section: ClientServiceSection }) {
  const theme = useTheme();

  if (section.title && !section.content) {
    return (
      <Text
        style={[styles.sectionHeading, { color: theme.text, fontFamily: Fonts.sansSemiBold }]}
      >
        {section.title}
      </Text>
    );
  }

  if (Array.isArray(section.content)) {
    return (
      <View style={styles.listBlock}>
        {section.title ? (
          <Text
            style={[
              styles.sectionHeading,
              { color: theme.text, fontFamily: Fonts.sansSemiBold },
            ]}
          >
            {section.title}
          </Text>
        ) : null}
        {section.content.map((item, i) => (
          <View key={i} style={styles.listRow}>
            <Text style={{ color: theme.primary, fontFamily: Fonts.sans }}>•</Text>
            <Text
              style={[styles.listItem, { color: theme.textSecondary, fontFamily: Fonts.sans }]}
            >
              {item}
            </Text>
          </View>
        ))}
      </View>
    );
  }

  const text = typeof section.content === "string" ? section.content.trim() : "";
  if (!text) return null;

  return (
    <View style={styles.paragraphBlock}>
      {section.title ? (
        <Text
          style={[styles.sectionHeading, { color: theme.text, fontFamily: Fonts.sansSemiBold }]}
        >
          {section.title}
        </Text>
      ) : null}
      <Text style={[styles.paragraph, { color: theme.textSecondary, fontFamily: Fonts.sans }]}>
        {text}
      </Text>
    </View>
  );
}

export function ServiceDetailModal({
  service,
  visible,
  onClose,
}: Props) {
  const theme = useTheme();

  if (!service) return null;

  const hasSections = service.sections.length > 0;

  return (
    <BottomSheetModal
      visible={visible}
      onClose={onClose}
      title={service.name}
      subtitle={`${service.durationMinutes} мин · разово ${formatServicePrice(service.price)}`}
      snapFractions={[0.55, 0.92]}
    >
      <View style={styles.body}>
        {service.description?.trim() ? (
          <Text style={[styles.lead, { color: theme.text, fontFamily: Fonts.sans }]}>
            {service.description.trim()}
          </Text>
        ) : null}

        {hasSections ? (
          <View style={styles.sections}>
            {service.sections.map((section, i) => (
              <SectionBlock key={i} section={section} />
            ))}
          </View>
        ) : !service.description?.trim() ? (
          <Text style={[styles.empty, { color: theme.textSecondary, fontFamily: Fonts.sans }]}>
            Подробное описание пока не добавлено. Уточните у администратора.
          </Text>
        ) : null}

        {service.subscriptionPrice != null && service.subscriptionPrice > 0 ? (
          <View style={[styles.priceBox, { backgroundColor: theme.backgroundElement }]}>
            <Ionicons name="card-outline" size={18} color={theme.primary} />
            <View style={{ flex: 1, gap: 2 }}>
              <Text
                style={[styles.priceLabel, { color: theme.text, fontFamily: Fonts.sansSemiBold }]}
              >
                Абонемент: {formatServicePrice(service.subscriptionPrice)} за занятие
              </Text>
            </View>
          </View>
        ) : null}
      </View>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  body: { gap: Spacing.three, paddingBottom: Spacing.two },
  lead: { fontSize: 15, lineHeight: 22 },
  sections: { gap: Spacing.three },
  sectionHeading: { fontSize: 15, lineHeight: 20 },
  paragraphBlock: { gap: 6 },
  paragraph: { fontSize: 14, lineHeight: 20 },
  listBlock: { gap: 6 },
  listRow: { flexDirection: "row", gap: 8, alignItems: "flex-start" },
  listItem: { flex: 1, fontSize: 14, lineHeight: 20 },
  empty: { fontSize: 14, lineHeight: 20 },
  priceBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: 12,
  },
  priceLabel: { fontSize: 14 },
  priceHint: { fontSize: 12, lineHeight: 16 },
});
