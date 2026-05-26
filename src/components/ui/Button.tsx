import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  ViewStyle,
  type GestureResponderEvent,
} from 'react-native';

import { BorderRadius, Fonts, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type ButtonVariant = 'outline' | 'primary' | 'primaryFilled' | 'ghost' | 'secondary';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps {
  children: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  onPress?: (event: GestureResponderEvent) => void;
  style?: ViewStyle;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const sizePadding = {
  sm: { paddingHorizontal: Spacing.three, paddingVertical: Spacing.two },
  md: { paddingHorizontal: Spacing.four, paddingVertical: Spacing.three },
  lg: { paddingHorizontal: Spacing.six, paddingVertical: Spacing.four },
} as const;

const sizeFont = {
  sm: 14,
  md: 14,
  lg: 16,
} as const;

export function Button({
  children,
  variant = 'outline',
  size = 'md',
  isLoading = false,
  disabled = false,
  fullWidth,
  onPress,
  style,
  leftIcon,
  rightIcon,
}: ButtonProps) {
  const theme = useTheme();
  const colors = theme as Record<string, string>;
  const isDisabled = disabled || isLoading;

  const variantStyles: Record<ButtonVariant, { container: ViewStyle; textColor: string }> = {
    outline: {
      container: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: '#d1d5db',
      },
      textColor: '#111827',
    },
    primary: {
      container: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: colors.primary,
      },
      textColor: colors.primary,
    },
    primaryFilled: {
      container: {
        backgroundColor: colors.primary,
        borderWidth: 0,
      },
      textColor: '#ffffff',
    },
    ghost: {
      container: {
        backgroundColor: 'transparent',
        borderWidth: 0,
      },
      textColor: '#4b5563',
    },
    secondary: {
      container: {
        backgroundColor: '#f3f4f6',
        borderWidth: 1,
        borderColor: '#d1d5db',
      },
      textColor: '#111827',
    },
  };

  const v = variantStyles[variant];
  const padding = sizePadding[size];

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        v.container,
        padding,
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        pressed && !isDisabled && styles.pressed,
        style,
      ]}>
      {isLoading ? (
        <ActivityIndicator size="small" color={v.textColor} style={styles.loader} />
      ) : leftIcon ? (
        <>{leftIcon}</>
      ) : null}
      <Text
        style={[
          styles.label,
          { color: v.textColor, fontSize: sizeFont[size] },
          (isLoading || leftIcon) && styles.textWithLeft,
        ]}>
        {children}
      </Text>
      {rightIcon && !isLoading ? rightIcon : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.card,
    minHeight: 44,
  },
  fullWidth: { width: '100%' },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.85 },
  loader: { marginRight: Spacing.two },
  textWithLeft: { marginLeft: Spacing.two },
  label: { fontFamily: Fonts.sansMedium },
});
