import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
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
import { SafeAreaView } from 'react-native-safe-area-context';

import logoFull from '@/assets/images/logo_full.png';
import { Button, Input } from '@/components/ui';
import { BorderRadius, Fonts, Spacing } from '@/constants/theme';
import { getApiUrl } from '@/lib/api';
import { useTheme } from '@/hooks/use-theme';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const theme = useTheme();
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isEmail = emailOrPhone.includes('@');
  const textSecondary = (theme as Record<string, string>).textSecondary ?? '#60646C';

  const handleSubmit = async () => {
    const trimmed = emailOrPhone.trim();
    if (!trimmed) {
      setError('Введите email или телефон');
      return;
    }
    setError(null);
    setSuccessMessage(null);
    setLoading(true);
    try {
      const res = await fetch(getApiUrl('/auth/forgot-password'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailOrPhone: trimmed }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        success?: boolean;
        error?: string;
        message?: string;
        resetChannel?: string;
        resetSentTo?: string;
      };
      if (data.success && data.resetChannel && data.resetSentTo) {
        router.push({
          pathname: '/verify-reset-code',
          params: { channel: data.resetChannel, sentTo: data.resetSentTo },
        });
        return;
      }
      if (data.success && data.message) {
        setSuccessMessage(data.message);
        return;
      }
      setError(data.error ?? 'Ошибка при отправке. Попробуйте позже.');
    } catch {
      setError('Сервер недоступен. Проверьте подключение к интернету.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: '#ffffff' }]}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboard}>
          <View style={styles.logoWrap}>
            <Pressable onPress={() => router.back()}>
              <Image
                source={logoFull}
                style={styles.logoImage}
                resizeMode="contain"
                accessibilityLabel="БлагоДети"
              />
            </Pressable>
          </View>

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            <Pressable onPress={() => router.back()} style={styles.backLink}>
              <Ionicons name="arrow-back" size={20} color="#6b7280" />
              <Text style={styles.backLinkText}>Назад к входу</Text>
            </Pressable>

            <Text style={styles.title}>Восстановление пароля</Text>
            <Text style={styles.subtitle}>
              Введите email или телефон — туда придёт код: на почту письмо, на номер — СМС.
            </Text>

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
                editable={!loading}
                leftIcon={
                  <Ionicons
                    name={(isEmail ? 'mail-outline' : 'call-outline') as 'mail-outline' | 'call-outline'}
                    size={20}
                    color={textSecondary}
                  />
                }
              />
              {error ? (
                <View style={styles.errorBlock}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}
              {successMessage ? (
                <View style={styles.successBlock}>
                  <Text style={styles.successText}>{successMessage}</Text>
                </View>
              ) : null}
              <Button
                variant="primary"
                size="md"
                fullWidth
                onPress={handleSubmit}
                isLoading={loading}
                disabled={loading}>
                Отправить код
              </Button>
            </View>

            <Pressable onPress={() => router.back()} style={styles.centeredLink}>
              <Text style={styles.linkText}>Вернуться к входу</Text>
            </Pressable>
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
    paddingTop: 32,
    paddingBottom: 16,
  },
  logoImage: { height: 40, width: 200, maxWidth: 240 },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
    maxWidth: 448,
    width: '100%',
    alignSelf: 'center',
  },
  backLink: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 8,
  },
  backLinkText: { fontSize: 14, color: '#6b7280', fontFamily: Fonts.sansMedium },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
    fontFamily: Fonts.sansSemiBold,
  },
  subtitle: { fontSize: 14, color: '#4b5563', marginBottom: 24, fontFamily: Fonts.sans },
  form: { gap: 16, marginBottom: 24 },
  errorBlock: {
    padding: 12,
    borderRadius: BorderRadius.card,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  errorText: { fontSize: 14, color: '#b91c1c', fontFamily: Fonts.sansMedium },
  successBlock: {
    padding: 12,
    borderRadius: BorderRadius.card,
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  successText: { fontSize: 14, color: '#166534', fontFamily: Fonts.sansMedium },
  centeredLink: { alignSelf: 'center', marginTop: 8 },
  linkText: { fontSize: 14, color: '#4b5563', fontFamily: Fonts.sansMedium },
});
