import React, { useCallback, useEffect, useRef } from 'react';
import {
  Platform,
  StyleSheet,
  TextInput,
  type TextInputProps,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { BorderRadius, Fonts, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type OtpCodeInputProps = Omit<TextInputProps, 'value' | 'onChangeText'> & {
  label?: string;
  value: string;
  onChangeValue: (code: string) => void;
  errorMessage?: string;
  /** Фокус с задержкой — подсказка OTP появляется, когда клавиатура уже открыта (см. RN issue #29536). */
  autoFocus?: boolean;
};

/**
 * Одно поле для OTP (не 6 ячеек — иначе iOS AutoFill не сработает).
 *
 * Reddit / RN #29536: подсказка есть, но в controlled TextInput не подставляется —
 * не используем letterSpacing, не multiline, onChangeText принимает всю строку из AutoFill.
 *
 * iOS: textContentType=oneTimeCode + autoComplete=one-time-code, системная клавиатура.
 * Нужны: associatedDomains + AASA + СМС с @domain #код.
 */
export function OtpCodeInput({
  label = 'Код из СМС',
  value,
  onChangeValue,
  errorMessage,
  editable = true,
  autoFocus = false,
  ...props
}: OtpCodeInputProps) {
  const theme = useTheme();
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (!autoFocus || !editable) return;
    const t = setTimeout(() => inputRef.current?.focus(), Platform.OS === 'ios' ? 400 : 100);
    return () => clearTimeout(t);
  }, [autoFocus, editable]);

  const handleChange = useCallback(
    (text: string) => {
      const cleaned = text.replace(/\D/g, '').slice(0, 6);
      if (cleaned !== value) {
        onChangeValue(cleaned);
      }
    },
    [onChangeValue, value],
  );

  return (
    <>
      {label ? (
        <ThemedText type="small" themeColor="textSecondary" style={styles.label}>
          {label}
        </ThemedText>
      ) : null}
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={handleChange}
        placeholder="123456"
        placeholderTextColor="#9ca3af"
        keyboardType="number-pad"
        maxLength={6}
        editable={editable}
        multiline={false}
        textContentType="oneTimeCode"
        autoComplete={Platform.OS === 'android' ? 'sms-otp' : 'one-time-code'}
        importantForAutofill="yes"
        autoCorrect={false}
        spellCheck={false}
        autoCapitalize="none"
        textAlign="center"
        style={[
          styles.input,
          Platform.OS === 'ios' ? styles.inputIos : null,
          {
            color: theme.text,
            borderColor: errorMessage ? theme.primary : theme.backgroundElement,
            backgroundColor: theme.cardBackground,
            fontFamily: Fonts.sansSemiBold,
          },
        ]}
        {...props}
      />
      {errorMessage ? (
        <ThemedText type="small" style={[styles.error, { color: theme.primary }]}>
          {errorMessage}
        </ThemedText>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  label: { marginBottom: Spacing.one },
  input: {
    width: '100%',
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    paddingHorizontal: Spacing.three,
    paddingVertical: 14,
    fontSize: 22,
    letterSpacing: 4,
    textAlign: 'center',
  },
  /** letterSpacing ломает подстановку из подсказки iOS (RN #29536, Reddit). */
  inputIos: {
    letterSpacing: 0,
  },
  error: { marginTop: Spacing.one },
});
