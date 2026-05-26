import * as SecureStore from 'expo-secure-store';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

const THEME_STORAGE_KEY = 'blagodeti_theme';

export type ThemeMode = 'light' | 'dark';

type ThemeContextValue = {
  theme: ThemeMode;
  setTheme: (mode: ThemeMode) => Promise<void>;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>('light');

  useEffect(() => {
    SecureStore.getItemAsync(THEME_STORAGE_KEY).then((stored) => {
      if (stored === 'light' || stored === 'dark') {
        setThemeState(stored);
      }
    }).catch(() => {
      // SecureStore недоступен (например web) — остаёмся на light
    });
  }, []);

  const setTheme = useCallback(async (mode: ThemeMode) => {
    setThemeState(mode);
    try {
      await SecureStore.setItemAsync(THEME_STORAGE_KEY, mode);
    } catch {
      // игнорируем ошибки записи (web и т.д.)
    }
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useThemeMode() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useThemeMode must be used within ThemeProvider');
  }
  return ctx;
}
