import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";

import AppTabs from "@/components/app-tabs";
import { useThemeMode } from "@/contexts/theme-context";
import { useTheme } from "@/hooks/use-theme";

/** Фон под контентом табов = тема приложения (иначе liquid glass сэмплит чёрный RN-фон). */
export default function MainTabsLayout() {
  const theme = useTheme();
  const { theme: mode } = useThemeMode();

  const base = mode === "dark" ? DarkTheme : DefaultTheme;
  const navTheme = {
    ...base,
    colors: {
      ...base.colors,
      primary: theme.primary,
      background: theme.background,
      card: theme.cardBackground,
      text: theme.text,
      border: theme.backgroundSelected,
    },
  };

  return (
    <ThemeProvider value={navTheme}>
      <AppTabs />
    </ThemeProvider>
  );
}
