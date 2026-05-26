import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';

export interface CheckboxProps {
  value?: boolean;
  onValueChange?: (value: boolean) => void;
  label?: React.ReactNode;
  disabled?: boolean;
}

const boxSize = 20;

export function Checkbox({ value = false, onValueChange, label, disabled }: CheckboxProps) {
  const theme = useTheme();
  const primary = (theme as Record<string, string>).primary;

  return (
    <Pressable
      onPress={() => !disabled && onValueChange?.(!value)}
      disabled={disabled}
      style={({ pressed }) => [
        styles.wrapper,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
      ]}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: value, disabled: !!disabled }}>
      <View
        style={[
          styles.box,
          {
            borderColor: value ? primary : '#d1d5db',
            backgroundColor: value ? primary : 'transparent',
          },
        ]}>
        {value ? (
          <Ionicons name="checkmark" size={14} color="#fff" strokeWidth={3} />
        ) : null}
      </View>
      {label != null ? (
        <ThemedText
          type="small"
          themeColor={disabled ? 'textSecondary' : 'text'}
          style={styles.labelText}>
          {label}
        </ThemedText>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  box: {
    width: boxSize,
    height: boxSize,
    marginTop: 2,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelText: { marginLeft: 12, flex: 1 },
  disabled: { opacity: 0.6 },
  pressed: { opacity: 0.85 },
});
