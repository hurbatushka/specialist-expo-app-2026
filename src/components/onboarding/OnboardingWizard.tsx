import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { StatusBar } from "expo-status-bar";
import { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewToken,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  ONBOARDING_LOGO,
} from "@/constants/onboarding-images";
import {
  ONBOARDING_STEPS,
  isOnboardingDarkText,
  type OnboardingStep,
} from "@/constants/onboarding-steps";
import { Fonts, Spacing } from "@/constants/theme";
import { type AuthApi } from "@/lib/api";
import {
  requestPushPermission,
  syncPushToken,
} from "@/lib/push-notifications";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

type Props = {
  firstName?: string | null;
  authApi: AuthApi;
  onComplete: () => void | Promise<void>;
  onSkip?: () => void | Promise<void>;
};

function personalizeTitle(step: OnboardingStep, firstName?: string | null): string {
  if (step.id === "welcome" && firstName?.trim()) {
    return `${firstName.trim()}, добро пожаловать!`;
  }
  return step.title;
}

function descriptionParagraphs(text: string): string[] {
  return text.split(/\n\n+/).filter(Boolean);
}

function OnboardingSlide({
  step,
  firstName,
  topInset,
}: {
  step: OnboardingStep;
  firstName?: string | null;
  topInset: number;
}) {
  const layout = step.textLayout;
  const isFinish = layout === "finish-centered";
  const isCentered = layout === "center-lower" || isFinish;
  const isDark = isOnboardingDarkText(step);
  const paragraphs = descriptionParagraphs(step.description);

  const textBlock = (
    <View
      style={[
        styles.textBlock,
        isCentered && styles.textBlockCenter,
        isFinish && styles.textBlockFinish,
      ]}
    >
      <Text
        style={[
          styles.title,
          isDark ? styles.titleDark : styles.titleLight,
          isCentered && styles.textCenter,
          isFinish && styles.titleFinish,
        ]}
      >
        {personalizeTitle(step, firstName)}
      </Text>
      {paragraphs.map((para, i) => (
        <Text
          key={`${step.id}-p-${i}`}
          style={[
            styles.description,
            isDark ? styles.descriptionDark : styles.descriptionLight,
            isCentered && styles.textCenter,
            isFinish && styles.descriptionFinish,
            isFinish && i > 0 && styles.descriptionEmphasis,
          ]}
        >
          {para}
        </Text>
      ))}
    </View>
  );

  return (
    <View style={[styles.slide, { width: SCREEN_WIDTH, height: SCREEN_HEIGHT }]}>
      <Image
        source={step.background}
        style={StyleSheet.absoluteFillObject}
        contentFit="cover"
        transition={200}
      />

      {isFinish ? (
        <View
          style={[
            styles.slideContent,
            styles.slideContentFinish,
            { paddingTop: topInset + Spacing.four },
          ]}
        >
          <Image
            source={ONBOARDING_LOGO}
            style={styles.logo}
            contentFit="contain"
            accessibilityLabel="БлагоДети"
          />
          <View style={styles.finishTextArea}>{textBlock}</View>
        </View>
      ) : (
        <View
          style={[
            styles.slideContent,
            layout === "center-lower"
              ? styles.slideContentCenterLower
              : styles.slideContentTop,
            { paddingTop: topInset + Spacing.four },
            layout === "center-lower" && {
              paddingTop: topInset + Math.round(SCREEN_HEIGHT * 0.38),
            },
          ]}
        >
          <Image
            source={ONBOARDING_LOGO}
            style={[styles.logo, layout === "center-lower" && styles.logoCenter]}
            contentFit="contain"
            accessibilityLabel="БлагоДети"
          />
          {textBlock}
        </View>
      )}
    </View>
  );
}

export function OnboardingWizard({
  firstName,
  authApi,
  onComplete,
  onSkip,
}: Props) {
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList<OnboardingStep>>(null);
  const [index, setIndex] = useState(0);
  const [finishing, setFinishing] = useState(false);
  const [requestingPush, setRequestingPush] = useState(false);

  const steps = ONBOARDING_STEPS;
  const step = steps[index]!;
  const isLast = index >= steps.length - 1;
  const isFinish = step.kind === "finish";
  const isPermissions = step.kind === "permissions";
  const showSkip = !isLast && !isFinish;
  const darkChrome = isOnboardingDarkText(step);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      const i = viewableItems[0]?.index;
      if (typeof i === "number") setIndex(i);
    },
  ).current;

  const viewabilityConfig = useRef({
    viewAreaCoveragePercentThreshold: 55,
  }).current;

  const goTo = useCallback(
    (nextIndex: number) => {
      const clamped = Math.max(0, Math.min(nextIndex, steps.length - 1));
      listRef.current?.scrollToIndex({ index: clamped, animated: true });
      setIndex(clamped);
    },
    [steps.length],
  );

  const finishFlow = useCallback(async () => {
    setFinishing(true);
    try {
      await onComplete();
    } finally {
      setFinishing(false);
    }
  }, [onComplete]);

  const handleSkip = useCallback(async () => {
    if (onSkip) await onSkip();
    else await finishFlow();
  }, [finishFlow, onSkip]);

  const handleNext = useCallback(async () => {
    if (isFinish) {
      await finishFlow();
      return;
    }
    goTo(index + 1);
  }, [finishFlow, goTo, index, isFinish]);

  const handleEnableNotifications = useCallback(async () => {
    setRequestingPush(true);
    try {
      const status = await requestPushPermission();
      if (status === "granted") {
        await syncPushToken(authApi, { maxAttempts: 2 });
      }
      goTo(index + 1);
    } finally {
      setRequestingPush(false);
    }
  }, [authApi, goTo, index]);

  const bottomPad = Math.max(insets.bottom, Spacing.three);

  return (
    <View style={styles.root}>
      <StatusBar style={darkChrome ? "dark" : "light"} />
      <FlatList
        ref={listRef}
        data={steps}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        style={styles.list}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        onScrollToIndexFailed={(info) => {
          setTimeout(() => {
            listRef.current?.scrollToIndex({
              index: info.index,
              animated: false,
            });
          }, 80);
        }}
        getItemLayout={(_, i) => ({
          length: SCREEN_WIDTH,
          offset: SCREEN_WIDTH * i,
          index: i,
        })}
        renderItem={({ item }) => (
          <OnboardingSlide
            step={item}
            firstName={firstName}
            topInset={insets.top}
          />
        )}
      />

      {/* Верх: пропустить */}
      {showSkip ? (
        <Pressable
          onPress={() => void handleSkip()}
          hitSlop={16}
          style={[styles.skipBtn, { top: insets.top + Spacing.two }]}
          accessibilityRole="button"
          accessibilityLabel="Пропустить"
        >
          <Text
            style={[
              styles.skipText,
              darkChrome ? styles.skipTextDark : styles.skipTextLight,
            ]}
          >
            Пропустить
          </Text>
        </Pressable>
      ) : null}

      {/* Низ: прогресс + действия */}
      <View
        style={[
          styles.footer,
          { paddingBottom: bottomPad, paddingLeft: Spacing.four + insets.left, paddingRight: Spacing.four + insets.right },
        ]}
      >
        {isPermissions ? (
          <View style={styles.permissionsActions}>
            <Pressable
              onPress={() => void handleEnableNotifications()}
              disabled={requestingPush}
              style={({ pressed }) => [
                styles.primaryWide,
                pressed && styles.pressed,
              ]}
            >
              {requestingPush ? (
                <ActivityIndicator color="#1a1a1a" />
              ) : (
                <>
                  <Ionicons name="notifications-outline" size={22} color="#1a1a1a" />
                  <Text style={styles.primaryWideText}>Включить уведомления</Text>
                </>
              )}
            </Pressable>
            <Pressable
              onPress={() => goTo(index + 1)}
              hitSlop={8}
              style={styles.laterBtn}
            >
              <Text
                style={[
                  styles.laterText,
                  darkChrome ? styles.laterTextDark : styles.laterTextLight,
                ]}
              >
                Позже
              </Text>
            </Pressable>
          </View>
        ) : isFinish ? (
          <Pressable
            onPress={() => void handleNext()}
            disabled={finishing}
            style={({ pressed }) => [
              styles.primaryWide,
              pressed && styles.pressed,
            ]}
          >
            {finishing ? (
              <ActivityIndicator color="#1a1a1a" />
            ) : (
              <Text style={styles.primaryWideText}>Начать</Text>
            )}
          </Pressable>
        ) : (
          <View style={styles.footerRow}>
            <View style={styles.progressBars}>
              {steps.map((s, i) => (
                <View
                  key={s.id}
                  style={[
                    styles.progressSegment,
                    darkChrome
                      ? styles.progressSegmentDark
                      : styles.progressSegmentLight,
                    {
                      width: i === index ? 32 : 14,
                      opacity: i === index ? 1 : 0.38,
                    },
                  ]}
                />
              ))}
            </View>
            <Pressable
              onPress={() => void handleNext()}
              style={({ pressed }) => [
                styles.nextPill,
                pressed && styles.pressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Далее"
            >
              <Text style={styles.nextPillText}>Далее</Text>
              <Ionicons name="arrow-forward" size={18} color="#1a1a1a" />
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#000",
  },
  list: {
    flex: 1,
  },
  slide: {
    overflow: "hidden",
  },
  slideContent: {
    flex: 1,
    paddingHorizontal: Spacing.five,
    paddingBottom: 148,
  },
  slideContentTop: {
    justifyContent: "flex-start",
  },
  slideContentCenterLower: {
    justifyContent: "flex-start",
    alignItems: "center",
  },
  slideContentFinish: {
    justifyContent: "flex-start",
    alignItems: "stretch",
  },
  finishTextArea: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: Spacing.two,
  },
  logo: {
    width: 160,
    height: 56,
    marginBottom: Spacing.three,
    alignSelf: "flex-start",
  },
  logoCenter: {
    alignSelf: "center",
  },
  textBlock: {
    gap: Spacing.two,
    maxWidth: 340,
  },
  textBlockCenter: {
    alignItems: "center",
    maxWidth: 300,
    paddingHorizontal: Spacing.two,
  },
  textBlockFinish: {
    alignItems: "center",
    maxWidth: 340,
    gap: Spacing.three,
  },
  textCenter: {
    textAlign: "center",
  },
  title: {
    fontSize: 28,
    lineHeight: 34,
    fontFamily: Fonts.sansBold,
    letterSpacing: -0.3,
  },
  titleLight: {
    color: "#fff",
  },
  titleDark: {
    color: "#1a1a1a",
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    fontFamily: Fonts.sans,
  },
  descriptionLight: {
    color: "rgba(255,255,255,0.9)",
  },
  descriptionDark: {
    color: "#323232",
  },
  titleFinish: {
    fontSize: 32,
    lineHeight: 38,
    fontFamily: Fonts.sansBold,
  },
  descriptionFinish: {
    fontSize: 18,
    lineHeight: 27,
  },
  descriptionEmphasis: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 20,
    lineHeight: 28,
  },
  skipBtn: {
    position: "absolute",
    right: Spacing.four,
    zIndex: 10,
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.two,
  },
  skipText: {
    fontSize: 15,
    fontFamily: Fonts.sansMedium,
  },
  skipTextLight: {
    color: "rgba(255,255,255,0.92)",
  },
  skipTextDark: {
    color: "rgba(26,26,26,0.75)",
  },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing.three,
  },
  progressBars: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
  },
  progressSegment: {
    height: 3,
    borderRadius: 2,
  },
  progressSegmentLight: {
    backgroundColor: "#fff",
  },
  progressSegmentDark: {
    backgroundColor: "#1a1a1a",
  },
  nextPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#fff",
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 999,
  },
  nextPillText: {
    color: "#1a1a1a",
    fontSize: 15,
    fontFamily: Fonts.sansSemiBold,
  },
  primaryWide: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: "#fff",
    paddingVertical: 16,
    paddingHorizontal: Spacing.four,
    borderRadius: 999,
    width: "100%",
  },
  primaryWideText: {
    color: "#1a1a1a",
    fontSize: 17,
    fontFamily: Fonts.sansSemiBold,
  },
  pressed: {
    opacity: 0.88,
  },
  permissionsActions: {
    width: "100%",
    gap: Spacing.three,
    alignItems: "center",
  },
  laterBtn: {
    paddingVertical: Spacing.one,
  },
  laterText: {
    fontSize: 15,
    fontFamily: Fonts.sansMedium,
    textDecorationLine: "underline",
  },
  laterTextLight: {
    color: "rgba(255,255,255,0.85)",
  },
  laterTextDark: {
    color: "rgba(26,26,26,0.7)",
  },
});
