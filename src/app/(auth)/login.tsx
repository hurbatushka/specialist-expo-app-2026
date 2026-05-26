import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import logoFull from '@/assets/images/logo_full.png';
import { Button, Input } from '@/components/ui';
import { useAuth } from '@/contexts/auth-context';
import { getMobileDeviceInfo } from '@/lib/device-fingerprint';
import { dismissKeyboardAndWait } from '@/lib/keyboard-navigation';
import { openExternalUrl } from '@/lib/open-external-url';
import { BorderRadius, Fonts, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function LoginScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ message?: string }>();
  const theme = useTheme();
  const { login, activateSession, isBlocked, clearBlocked } = useAuth();

  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(
    typeof params.message === 'string' ? decodeURIComponent(params.message) : null
  );
  const [loading, setLoading] = useState(false);

  const isEmail = emailOrPhone.includes('@');
  const emailPhoneIcon = isEmail ? 'mail-outline' : 'call-outline';

  useEffect(() => {
    if (isBlocked) {
      setError('Аккаунт заблокирован');
      clearBlocked();
    }
  }, [isBlocked, clearBlocked]);

  const handleSubmit = async () => {
    const trimmed = emailOrPhone.trim();
    if (!trimmed || !password) {
      setError('Заполните все поля');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const result = await login(
        { emailOrPhone: trimmed, password },
        await getMobileDeviceInfo()
      );
      if (result.ok) {
        await dismissKeyboardAndWait();
        activateSession();
        return;
      }
      setError(result.message ?? 'Ошибка входа');
      if (result.blocked) {
        setError('Аккаунт заблокирован');
      }
    } finally {
      setLoading(false);
    }
  };

  const openForgotPassword = () => {
    router.push('/forgot-password');
  };

  const openTerms = () => {
    void openExternalUrl('https://app.blagodeti.by/terms');
  };

  const openPrivacy = () => {
    void openExternalUrl('https://app.blagodeti.by/privacy-policy');
  };

  const textSecondary = (theme as Record<string, string>).textSecondary ?? '#60646C';

  return (
    <View style={[styles.container, { backgroundColor: '#ffffff' }]}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboard}>
          {/* Логотип — как на вебе: flex justify-center pt-8 pb-4 */}
          <View style={styles.logoWrap}>
            <Image
              source={logoFull}
              style={styles.logoImage}
              resizeMode="contain"
              accessibilityLabel="БлагоДети"
            />
          </View>

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            showsVerticalScrollIndicator={false}>
            <View style={styles.centerWrap}>
              {/* Заголовок: "Войдите в аккаунт" — text-2xl font-semibold text-gray-900 mb-2 text-center mb-6 */}
              <Text style={styles.title}>Войдите в аккаунт</Text>

              {/* Форма: space-y-4 mb-4 */}
              <View style={styles.form}>
                <Input
                  label="Email или телефон"
                  placeholder="name@blagodeti.by или номер телефона"
                  value={emailOrPhone}
                  onChangeText={(t) => {
                    setEmailOrPhone(t);
                    setError(null);
                  }}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoComplete="email"
                  blurOnSubmit={false}
                  editable={!loading}
                  leftIcon={
                    <Ionicons
                      name={emailPhoneIcon as 'mail-outline' | 'call-outline'}
                      size={20}
                      color={textSecondary}
                    />
                  }
                />
                <Input
                  label="Пароль"
                  placeholder="Введите пароль"
                  value={password}
                  onChangeText={(t) => {
                    setPassword(t);
                    setError(null);
                  }}
                  secureTextEntry={!showPassword}
                  autoComplete="password"
                  returnKeyType="go"
                  onSubmitEditing={() => void handleSubmit()}
                  blurOnSubmit
                  editable={!loading}
                  leftIcon={
                    <Ionicons
                      name="lock-closed-outline"
                      size={20}
                      color={textSecondary}
                    />
                  }
                  rightSlot={
                    <Pressable
                      onPress={() => setShowPassword((v) => !v)}
                      hitSlop={12}
                      style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}>
                      <Ionicons
                        name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                        size={20}
                        color={textSecondary}
                      />
                    </Pressable>
                  }
                />

                {/* Успех (например после сброса пароля) */}
                {successMessage ? (
                  <View style={styles.successBlock}>
                    <Text style={styles.successText}>{successMessage}</Text>
                  </View>
                ) : null}
                {/* Ошибка: p-3 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm */}
                {error ? (
                  <View style={styles.errorBlock}>
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                ) : null}

                {/* Кнопка Войти — variant primary (как на вебе: outline primary), fullWidth */}
                <Button
                  variant="primary"
                  size="md"
                  fullWidth
                  isLoading={loading}
                  onPress={handleSubmit}
                  style={styles.submitBtn}>
                  Войти
                </Button>
              </View>

              {/* Восстановить пароль — text-center mb-2 */}
              <Pressable onPress={openForgotPassword} style={styles.linkWrap}>
                <Text style={styles.linkText}>Восстановить пароль</Text>
              </Pressable>

              {/* Футер: Условия и Политика — text-sm text-gray-600 text-center mt-6 mb-4 */}
              <Text style={styles.footerText}>
                Продолжая, вы соглашаетесь с{' '}
                <Text style={styles.footerLink} onPress={openTerms}>
                  Условиями
                </Text>{' '}
                и{' '}
                <Text style={styles.footerLink} onPress={openPrivacy}>
                  Политикой конфиденциальности
                </Text>{' '}
                БлагоДети.
              </Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },
  keyboard: { flex: 1 },
  logoWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 32,
    paddingBottom: 16,
  },
  logoImage: {
    height: 40,
    width: 200,
    maxWidth: 240,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 32,
    maxWidth: 448,
    width: '100%',
    alignSelf: 'center',
  },
  centerWrap: {
    width: '100%',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 24,
    textAlign: 'center',
    fontFamily: Fonts.sansSemiBold,
  },
  form: {
    width: '100%',
    gap: 16,
    marginBottom: 16,
  },
  successBlock: {
    padding: 12,
    borderRadius: BorderRadius.card,
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  successText: { fontSize: 14, color: '#166534', fontFamily: Fonts.sansMedium },
  errorBlock: {
    padding: 12,
    borderRadius: BorderRadius.card,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  errorText: {
    fontSize: 14,
    color: '#b91c1c',
    fontFamily: Fonts.sansMedium,
  },
  submitBtn: {},
  linkWrap: {
    alignSelf: 'center',
    marginBottom: 8,
  },
  linkText: {
    fontSize: 14,
    color: '#4b5563',
    fontFamily: Fonts.sansMedium,
  },
  footerText: {
    fontSize: 14,
    color: '#4b5563',
    textAlign: 'center',
    marginTop: 24,
    marginBottom: 16,
    fontFamily: Fonts.sans,
    lineHeight: 20,
  },
  footerLink: {
    color: '#c42d26',
    textDecorationLine: 'underline',
    fontFamily: Fonts.sansMedium,
  },
});
