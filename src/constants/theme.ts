/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import "@/global.css";

import { Platform } from "react-native";

export const Colors = {
  light: {
    text: "#323232",
    background: "#f8f9fa",
    backgroundElement: "#F0F0F3",
    backgroundSelected: "#E0E1E6",
    cardBackground: "#ffffff",
    textSecondary: "#60646C",
    textSelected: "#c42d26",
    primary: "#c42d26",
  },
  dark: {
    text: "#ffffff",
    background: "#000000",
    backgroundElement: "#212225",
    backgroundSelected: "#2E3135",
    cardBackground: "#212225",
    textSecondary: "#B0B4BA",
    textSelected: "#c42d26",
    primary: "#c42d26",
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    sans: "Nunito_400Regular",
    sansMedium: "Nunito_500Medium",
    sansSemiBold: "Nunito_600SemiBold",
    sansBold: "Nunito_700Bold",
    serif: "ui-serif",
    rounded: "ui-rounded",
    mono: "ui-monospace",
  },
  default: {
    sans: "Nunito_400Regular",
    sansMedium: "Nunito_500Medium",
    sansSemiBold: "Nunito_600SemiBold",
    sansBold: "Nunito_700Bold",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "var(--font-sans)",
    sansMedium: "var(--font-sans)",
    sansSemiBold: "var(--font-sans)",
    sansBold: "var(--font-sans)",
    serif: "var(--font-serif)",
    rounded: "var(--font-rounded)",
    mono: "var(--font-mono)",
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;

export const BorderRadius = {
  card: 16,
  /** Секции и юридические блоки (план About / комплаенс) */
  section: 12,
  button: 12,
} as const;

export const CardShadow = Platform.select({
  ios: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  android: {
    elevation: 2,
  },
  default: {} as {
    shadowColor?: string;
    shadowOffset?: { width: number; height: number };
    shadowOpacity?: number;
    shadowRadius?: number;
    elevation?: number;
  },
});
