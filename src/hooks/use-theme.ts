/**
 * Тема приложения: светлая по умолчанию, переключается в настройках.
 */

import { Colors } from '@/constants/theme';
import { useThemeMode } from '@/contexts/theme-context';

export function useTheme() {
  const { theme } = useThemeMode();
  return Colors[theme];
}
