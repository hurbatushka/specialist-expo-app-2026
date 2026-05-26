import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState, type ReactNode } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BorderRadius, Fonts, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

const SPRING = { damping: 26, stiffness: 340, mass: 0.85 };

export type BottomSheetModalProps = {
  visible: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: ReactNode;
  /** Доли высоты экрана: свёрнуто / развёрнуто. */
  snapFractions?: [number, number];
  /** Поднять контент при открытой клавиатуре (формы). */
  keyboardAvoiding?: boolean;
};

export function BottomSheetModal({
  visible,
  onClose,
  title,
  subtitle,
  children,
  snapFractions = [0.42, 0.88],
  keyboardAvoiding = false,
}: BottomSheetModalProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { height: screenH } = useWindowDimensions();

  const [collapsedFrac, expandedFrac] = snapFractions;
  const sheetHeight = Math.min(screenH * expandedFrac, screenH - insets.top - 24);
  const collapsedOffset = sheetHeight * (1 - collapsedFrac / expandedFrac);
  const hiddenOffset = sheetHeight;

  const [mounted, setMounted] = useState(visible);
  const translateY = useSharedValue(hiddenOffset);
  const dragStartY = useSharedValue(0);

  const dismiss = () => onClose();

  useEffect(() => {
    if (visible) {
      setMounted(true);
      translateY.value = hiddenOffset;
      translateY.value = withSpring(0, SPRING);
      return;
    }
    if (!mounted) return;
    translateY.value = withSpring(hiddenOffset, SPRING, (finished) => {
      if (finished) {
        runOnJS(setMounted)(false);
      }
    });
  }, [visible, collapsedOffset, hiddenOffset, mounted, translateY]);

  const panGesture = Gesture.Pan()
    .onStart(() => {
      dragStartY.value = translateY.value;
    })
    .onUpdate((e) => {
      const next = dragStartY.value + e.translationY;
      translateY.value = Math.max(0, Math.min(hiddenOffset, next));
    })
    .onEnd((e) => {
      const y = translateY.value;
      const vy = e.velocityY;

      if (y > hiddenOffset * 0.55 || vy > 900) {
        runOnJS(dismiss)();
        return;
      }

      const mid = collapsedOffset * 0.45;
      if (vy < -400 || y < mid) {
        translateY.value = withSpring(0, SPRING);
      } else if (vy > 400 || y > collapsedOffset * 1.15) {
        translateY.value = withSpring(collapsedOffset, SPRING);
      } else {
        translateY.value = withSpring(y < collapsedOffset / 2 ? 0 : collapsedOffset, SPRING);
      }
    });

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      translateY.value,
      [hiddenOffset, collapsedOffset, 0],
      [0, 0.45, 0.52],
      Extrapolation.CLAMP,
    ),
  }));

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  if (!mounted) return null;

  return (
    <Modal
      visible={mounted}
      transparent
      animationType="none"
      onRequestClose={dismiss}
      statusBarTranslucent
    >
      <GestureHandlerRootView style={styles.root}>
        <Animated.View style={[styles.backdrop, backdropStyle]} pointerEvents="none" />
        <Pressable style={StyleSheet.absoluteFill} onPress={dismiss} accessibilityLabel="Закрыть" />

        <Animated.View
          style={[
            styles.sheet,
            {
              height: sheetHeight,
              paddingBottom: Math.max(insets.bottom, Spacing.three),
              backgroundColor: theme.cardBackground,
            },
            sheetStyle,
          ]}
        >
          <GestureDetector gesture={panGesture}>
            <View style={styles.dragZone}>
              <View style={[styles.handle, { backgroundColor: theme.backgroundElement }]} />
              <View style={styles.headerRow}>
                <View style={styles.headerText}>
                  {title ? (
                    <Text
                      style={[
                        styles.title,
                        { color: theme.text, fontFamily: Fonts.sansSemiBold },
                      ]}
                      numberOfLines={2}
                    >
                      {title}
                    </Text>
                  ) : null}
                  {subtitle ? (
                    <Text
                      style={[
                        styles.subtitle,
                        { color: theme.textSecondary, fontFamily: Fonts.sans },
                      ]}
                      numberOfLines={2}
                    >
                      {subtitle}
                    </Text>
                  ) : null}
                </View>
                <Pressable
                  onPress={dismiss}
                  hitSlop={12}
                  style={[
                    styles.closeBtn,
                    { backgroundColor: theme.backgroundElement },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Закрыть"
                >
                  <Ionicons name="close" size={20} color={theme.text} />
                </Pressable>
              </View>
            </View>
          </GestureDetector>

          <KeyboardAvoidingView
            style={styles.scrollWrap}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            enabled={keyboardAvoiding}
          >
            <ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              bounces
            >
              {children}
            </ScrollView>
          </KeyboardAvoidingView>
        </Animated.View>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#000",
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: "hidden",
  },
  dragZone: {
    paddingTop: Spacing.two,
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.two,
  },
  handle: {
    alignSelf: "center",
    width: 36,
    height: 4,
    borderRadius: 2,
    marginBottom: Spacing.three,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.two,
  },
  headerText: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  title: {
    fontSize: 18,
    lineHeight: 24,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 19,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  scrollWrap: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.two,
  },
});
