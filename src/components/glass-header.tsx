import { usePathname, useRouter } from 'expo-router';
import type React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '@/hooks/use-theme';

/** Высота хедера без safe area: paddingBottom 8 + bar minHeight 44 */
export const GLASS_HEADER_CONTENT_HEIGHT = 52;

const MAIN_TITLES: Record<string, string> = {
  '/': 'БлагоДети',
  '/schedule': 'Расписание',
  '/subscriptions': 'Абонементы',
  '/menu': 'Меню',
};

type NavigationChromeProps = {
  title: string;
  canGoBack: boolean;
  showSettings?: boolean;
  onBack?: () => void;
};

/** Хедер вложенных экранов: назад, заголовок, настройки (без glass). */
export function NavigationChrome({
  title,
  canGoBack,
  showSettings = true,
  onBack,
}: NavigationChromeProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const theme = useTheme();

  const backButton = canGoBack ? (
    <Pressable
      onPress={() => (onBack ? onBack() : router.back())}
      hitSlop={12}
      accessibilityRole="button"
      style={[styles.pill, { backgroundColor: theme.backgroundElement }]}
    >
      <Ionicons name="arrow-back" size={24} color={theme.text} />
    </Pressable>
  ) : (
    <View style={styles.iconPlaceholder} />
  );

  const settingsButton = showSettings ? (
    <Pressable
      onPress={() => router.navigate('/menu/settings')}
      hitSlop={12}
      accessibilityRole="button"
      style={[styles.pill, { backgroundColor: theme.backgroundElement }]}
    >
      <Ionicons name="settings-outline" size={22} color={theme.text} />
    </Pressable>
  ) : (
    <View style={styles.iconPlaceholder} />
  );

  return (
    <View
      style={[styles.wrapper, { paddingTop: insets.top }]}
      pointerEvents="box-none"
    >
      <View style={styles.inner}>
        {backButton}
        <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>
          {title}
        </Text>
        {settingsButton}
      </View>
    </View>
  );
}

type StackHeaderProps = {
  route: { name: string };
  navigation: { canGoBack: () => boolean; goBack: () => void };
  options: { title?: string };
};

export function StackHeader({ route, navigation, options }: StackHeaderProps) {
  const pathname = usePathname();
  const title =
    route.name === '(main)'
      ? (MAIN_TITLES[pathname] ?? options.title ?? 'БлагоДети')
      : (options.title ?? '');
  const canGoBack = navigation.canGoBack();
  const showSettings = route.name !== 'settings';

  return (
    <NavigationChrome
      title={title}
      canGoBack={canGoBack}
      showSettings={showSettings}
    />
  );
}

export const GlassHeader = StackHeader;
export const FallbackHeader = StackHeader;

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    minHeight: 44,
  },
  pill: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconPlaceholder: {
    width: 44,
    height: 44,
  },
  title: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
    marginHorizontal: 4,
  },
});
