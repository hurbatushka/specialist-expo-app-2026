import Constants from "expo-constants";
import { useMemo, useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { BottomSheetModal } from "@/components/ui/BottomSheetModal";
import { ThemedText } from "@/components/themed-text";
import { certificateImage, partnerLogos } from "@/constants/partner-assets";
import {
  BottomTabInset,
  BorderRadius,
  Fonts,
  MaxContentWidth,
  Spacing,
} from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

const LEGAL = {
  name: 'Общество с ограниченной ответственностью «БЛАГОДЕТИ»',
  shortName: 'ООО «БЛАГОДЕТИ»',
  unp: "193779258",
  regDate: "29 июля 2024 г.",
} as const;

const PAYMENT_GRID: { key: keyof typeof partnerLogos; label: string }[] = [
  { key: "visa", label: "Visa" },
  { key: "visaSecure", label: "Visa Secure" },
  { key: "mastercardIdCheck", label: "Mastercard ID Check" },
  { key: "mastercard", label: "Mastercard" },
  { key: "belkartInternetPassword", label: "Белкарт — интернет пароль" },
  { key: "belkart", label: "Белкарт" },
  { key: "samsungPay", label: "Samsung Pay" },
  { key: "applePay", label: "Apple Pay" },
];

const LOGO_MAX_H = 36;

/** Безопасный аспект ассета: resolveAssetSource может отсутствовать на web и быть нестабильным на module scope (см. crashlog build 70). */
function getAssetAspect(asset: number): number {
  try {
    const resolve = (
      Image as unknown as {
        resolveAssetSource?: (src: number) => { width?: number; height?: number };
      }
    ).resolveAssetSource;
    if (typeof resolve !== "function") return 1;
    const src = resolve(asset);
    if (!src || !src.width || !src.height) return 1;
    return src.height / src.width;
  } catch {
    return 1;
  }
}

export default function AboutScreen() {
  const theme = useTheme();
  const { width: windowW } = useWindowDimensions();
  const [certOpen, setCertOpen] = useState(false);
  const version = Constants.expoConfig?.version ?? "—";

  const previewW = Math.min(windowW - Spacing.four * 2, MaxContentWidth - 48);

  const certSheetSize = useMemo(() => {
    const contentW = windowW - Spacing.four * 4;
    const aspect = getAssetAspect(certificateImage);
    return { width: contentW, height: contentW * aspect };
  }, [windowW]);

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: theme.background }]}
      edges={["bottom", "left", "right"]}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: BottomTabInset + Spacing.four },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.inner}>
          <ThemedText type="subtitle">О приложении</ThemedText>
          <Text style={[styles.lead, { color: theme.textSecondary, fontFamily: Fonts.sans }]}>
            «БлагоДети» — мобильное приложение для семей: запись на занятия в центре развития, абонементы,
            онлайн-формат и личный кабинет.
          </Text>
          <Text style={[styles.version, { color: theme.textSecondary, fontFamily: Fonts.sans }]}>
            Версия {version}
          </Text>

          <View
            style={[
              styles.card,
              {
                backgroundColor: theme.cardBackground,
                borderColor: theme.backgroundElement,
              },
            ]}
          >
            <Text style={[styles.cardTitle, { color: theme.text, fontFamily: Fonts.sansSemiBold }]}>
              Юридическая информация
            </Text>
            <Text style={[styles.p, { color: theme.text, fontFamily: Fonts.sans }]}>{LEGAL.shortName}</Text>
            <Text style={[styles.p, { color: theme.textSecondary, fontFamily: Fonts.sans }]}>
              Полное наименование: {LEGAL.name}
            </Text>
            <Text style={[styles.p, { color: theme.textSecondary, fontFamily: Fonts.sans }]}>
              УНП: {LEGAL.unp}
            </Text>
            <Text style={[styles.p, { color: theme.textSecondary, fontFamily: Fonts.sans }]}>
              Дата государственной регистрации: {LEGAL.regDate}
            </Text>
          </View>

          <Text style={[styles.disclaimer, { color: theme.textSecondary, fontFamily: Fonts.sans }]}>
            Приложение носит информационно-сервисный характер и не является медицинским изделием. Не заменяет
            очную консультацию специалиста.
          </Text>

          <View
            style={[
              styles.card,
              {
                backgroundColor: theme.cardBackground,
                borderColor: theme.backgroundElement,
              },
            ]}
          >
            <Text style={[styles.cardTitle, { color: theme.text, fontFamily: Fonts.sansSemiBold }]}>
              Свидетельство о регистрации
            </Text>
            <Text style={[styles.muted, { color: theme.textSecondary, fontFamily: Fonts.sans }]}>
              Нажмите для просмотра
            </Text>
            <Pressable onPress={() => setCertOpen(true)} style={styles.certPreviewWrap}>
              <Image
                source={certificateImage}
                style={[styles.certPreview, { width: previewW }]}
                resizeMode="contain"
                accessibilityLabel="Превью свидетельства о государственной регистрации"
                alt="Превью свидетельства о государственной регистрации"
              />
            </Pressable>
          </View>

          <View
            style={[
              styles.card,
              {
                backgroundColor: theme.cardBackground,
                borderColor: theme.backgroundElement,
              },
            ]}
          >
            <Text style={[styles.cardTitle, { color: theme.text, fontFamily: Fonts.sansSemiBold }]}>
              Партнёр по эквайрингу
            </Text>
            <Text style={[styles.muted, { color: theme.textSecondary, fontFamily: Fonts.sans }]}>
              Оплата банковской картой в приложении проходит через партнёрский шлюз Альфа-Банка.
            </Text>
            <View style={[styles.alfaBox, { backgroundColor: theme.backgroundElement }]}>
              <Image
                source={partnerLogos.alfaBank}
                style={styles.alfaLogo}
                resizeMode="contain"
                accessibilityLabel="Логотип Альфа-Банка"
                alt="Логотип Альфа-Банка"
              />
            </View>
          </View>

          <View
            style={[
              styles.card,
              {
                backgroundColor: theme.cardBackground,
                borderColor: theme.backgroundElement,
              },
            ]}
          >
            <Text style={[styles.cardTitle, { color: theme.text, fontFamily: Fonts.sansSemiBold }]}>
              Поддерживаемые способы оплаты
            </Text>
            <Text style={[styles.muted, { color: theme.textSecondary, fontFamily: Fonts.sans }]}>
              Доступность Apple Pay, Samsung Pay и 3-D Secure зависит от банка-эмитента карты и условий
              эквайринга.
            </Text>
            <View style={styles.payGrid}>
              {PAYMENT_GRID.map((item) => (
                <View
                  key={item.key}
                  style={[
                    styles.payCell,
                    { backgroundColor: theme.backgroundElement },
                  ]}
                >
                  <Image
                    source={partnerLogos[item.key]}
                    style={styles.payLogo}
                    resizeMode="contain"
                    accessibilityLabel={item.label}
                    alt={item.label}
                  />
                  <Text
                    style={[styles.payLabel, { color: theme.textSecondary, fontFamily: Fonts.sans }]}
                    numberOfLines={2}
                  >
                    {item.label}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>

      <BottomSheetModal
        visible={certOpen}
        onClose={() => setCertOpen(false)}
        title="Свидетельство о регистрации"
        subtitle="ООО «БЛАГОДЕТИ» · УНП 193779258"
        snapFractions={[0.5, 0.92]}
      >
        <View style={styles.certSheetBody}>
          <Image
            source={certificateImage}
            style={[
              styles.certFull,
              {
                width: certSheetSize.width,
                height: certSheetSize.height,
              },
            ]}
            resizeMode="contain"
            accessibilityLabel="Свидетельство о государственной регистрации"
          />
        </View>
      </BottomSheetModal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
    maxWidth: MaxContentWidth,
    width: "100%",
    alignSelf: "center",
  },
  inner: { gap: Spacing.three },
  lead: { fontSize: 15, lineHeight: 22, marginTop: Spacing.two },
  version: { fontSize: 13 },
  card: {
    borderRadius: BorderRadius.section,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  cardTitle: { fontSize: 16, marginBottom: Spacing.one },
  p: { fontSize: 14, lineHeight: 20 },
  muted: { fontSize: 13, lineHeight: 18 },
  disclaimer: { fontSize: 12, lineHeight: 18, fontStyle: "italic" },
  certPreviewWrap: { alignItems: "center", marginTop: Spacing.two },
  certPreview: { height: 140, borderRadius: BorderRadius.section },
  alfaBox: {
    borderRadius: BorderRadius.section,
    padding: Spacing.three,
    alignItems: "center",
    marginTop: Spacing.two,
  },
  alfaLogo: { width: "100%", height: 48, maxWidth: 280 },
  payGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  payCell: {
    width: "47%",
    flexGrow: 1,
    minWidth: 130,
    borderRadius: BorderRadius.section,
    padding: Spacing.two,
    alignItems: "center",
    gap: Spacing.two,
  },
  payLogo: {
    width: "100%",
    height: LOGO_MAX_H,
  },
  payLabel: { fontSize: 10, textAlign: "center", lineHeight: 13 },
  certSheetBody: {
    alignItems: "center",
    paddingBottom: Spacing.two,
  },
  certFull: {
    borderRadius: BorderRadius.section,
  },
});
