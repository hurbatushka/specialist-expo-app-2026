import React from 'react';
import {
  StyleSheet,
  TextInput,
  View,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { BorderRadius, Fonts, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export interface InputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  error?: boolean;
  errorMessage?: string;
  containerStyle?: ViewStyle;
  inputStyle?: ViewStyle;
  leftIcon?: React.ReactNode;
  rightSlot?: React.ReactNode;
}

export function Input({
  label,
  error = false,
  errorMessage,
  containerStyle,
  inputStyle,
  placeholderTextColor,
  leftIcon,
  rightSlot,
  ...props
}: InputProps) {
  const theme = useTheme();
  const showError = error || !!errorMessage;
  const borderColor = showError ? theme.primary : (theme as Record<string, string>).textSecondary + '40';
  const placeholderColor = placeholderTextColor ?? '#9ca3af';
  const hasLeft = !!leftIcon;
  const hasRight = !!rightSlot;

  return (
    <View style={[styles.wrapper, containerStyle]}>
      {label ? (
        <ThemedText
          type="small"
          themeColor="textSecondary"
          style={styles.label}>
          {label}
        </ThemedText>
      ) : null}
      <View style={styles.inputWrap}>
        {leftIcon ? (
          <View style={styles.leftIcon} pointerEvents="none">
            {leftIcon}
          </View>
        ) : null}
        <TextInput
          placeholderTextColor={placeholderColor}
          style={[
            styles.input,
            { borderColor, color: theme.text, backgroundColor: theme.cardBackground },
            hasLeft && styles.inputWithLeft,
            hasRight && styles.inputWithRight,
            props.editable === false && styles.disabled,
            inputStyle,
          ]}
          {...props}
        />
        {rightSlot ? (
          <View style={styles.rightSlot}>
            {rightSlot}
          </View>
        ) : null}
      </View>
      {errorMessage ? (
        <ThemedText type="small" style={[styles.errorText, { color: theme.primary }]}>
          {errorMessage}
        </ThemedText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { width: '100%' },
  label: { marginBottom: Spacing.one },
  inputWrap: {
    position: 'relative',
    width: '100%',
  },
  input: {
    width: '100%',
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    paddingHorizontal: Spacing.three,
    paddingVertical: 10,
    fontSize: 16,
    fontFamily: Fonts.sansMedium,
  },
  inputWithLeft: { paddingLeft: 40 },
  inputWithRight: { paddingRight: 40 },
  leftIcon: {
    position: 'absolute',
    left: Spacing.three,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    zIndex: 1,
  },
  rightSlot: {
    position: 'absolute',
    right: Spacing.two,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    zIndex: 1,
  },
  disabled: { opacity: 0.7 },
  errorText: { marginTop: Spacing.one },
});
