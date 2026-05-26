import { useEffect, useMemo } from "react";
import { Animated, StyleSheet, type ViewStyle } from "react-native";

import { BorderRadius } from "@/constants/theme";
import { useThemeMode } from "@/contexts/theme-context";

export type SkeletonProps = {
  style?: ViewStyle;
  height?: number;
  width?: number | `${number}%`;
};

/**
 * Плейсхолдер с лёгким «шиммером» (план дизайн-системы).
 */
export function Skeleton({ style, height = 14, width = "100%" }: SkeletonProps) {
  const { theme } = useThemeMode();
  const isDark = theme === "dark";
  const shimmerAnim = useMemo(() => new Animated.Value(0), []);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [shimmerAnim]);

  const opacity = shimmerAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.3, 0.7, 0.3],
  });

  const base = isDark ? "#3f3f46" : "#e4e4e7";
  const widthStyle: ViewStyle =
    typeof width === "number" ? { width } : { width: width as ViewStyle["width"] };

  return (
    <Animated.View
      style={[
        styles.block,
        widthStyle,
        {
          height,
          backgroundColor: base,
          opacity,
        },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  block: {
    borderRadius: BorderRadius.section,
    overflow: "hidden",
  },
});
