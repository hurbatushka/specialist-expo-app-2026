import { View, type ViewProps } from 'react-native';

import { BorderRadius, CardShadow, ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
  type?: ThemeColor | 'card';
};

export function ThemedView({ style, lightColor, darkColor, type, ...otherProps }: ThemedViewProps) {
  const theme = useTheme();
  const isCard = type === 'card';
  const backgroundColor = isCard ? theme.cardBackground : theme[type ?? 'background'];
  const cardStyle = isCard
    ? { borderRadius: BorderRadius.card, ...CardShadow }
    : undefined;

  return (
    <View
      style={[{ backgroundColor }, cardStyle, style]}
      {...otherProps}
    />
  );
}
