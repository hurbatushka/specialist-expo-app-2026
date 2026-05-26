import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
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
import { BorderRadius, Fonts } from '@/constants/theme';
import { getApiUrl } from '@/lib/api';
import { useTheme } from '@/hooks/use-theme';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ channel?: string; sentTo?: string; code?: string }>();
  const theme = useTheme();
  const channel = params.channel ?? '';
  const sentTo = params.sentTo ?? '';
  const code = (params.code ?? '').replace(/\D/g, '').slice(0, 6);

  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const textSecondary = (theme as Record<string, string>).textSecondary ?? '#60646C';
  const hasParams = channel && sentTo && code.length === 6;

  const handleSubmit = async () => {
    if (!newPassword) {
      setError('Введите новый пароль');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Пароли не совпадают');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(getApiUrl('/auth/reset-password'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel,
          sentTo,
          code,
          newPassword,
          confirmPassword,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { success?: boolean; error?: string; message?: string };
      if (data.success) {
        router.replace({
          pathname: '/login',
          params: { message: data.message ?? 'Пароль изменён. Войдите с новым паролем.' },
        });
        return;
      }
      setError(data.error ?? 'Ошибка при смене пароля.');
    } catch {
      setError('Сервер недоступен. Проверьте подключение к интернету.');
    } finally {
      setLoading(false);
    }
  };

  if (!hasParams) {
    return (
      <View style={[styles.container, { backgroundColor: '#ffffff' }]}>
        <SafeAreaView style={styles.safe}>
          <View style={styles.logoWrap}>
            <Image source={logoFull} style={styles.logoImage} resizeMode="contain" accessibilityLabel="БлагоДети" />
          </View>
          <View style={styles.centered}>
            <Text style={styles.paragraph}>Сначала подтвердите код из СМС или письма.</Text>
            <Button variant="primary" size="md" onPress={() => router.replace('/forgot-password')}>
              Восстановить пароль
            </Button>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: '#ffffff' }]}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboard}>
          <View style={styles.logoWrap}>
            <Pressable onPress={() => router.back()}>
              <Image source={logoFull} style={styles.logoImage} resizeMode="contain" accessibilityLabel="БлагоДети" />
            </Pressable>
          </View>

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            <Text style={styles.title}>Новый пароль</Text>
            <Text style={styles.subtitle}>Код подтверждён. Придумайте новый пароль.</Text>

            <View style={styles.form}>
              <Input
                label="Новый пароль"
                placeholder="Не менее 8 символов"
                value={newPassword}
                onChangeText={(t) => {
                  setNewPassword(t);
                  setError(null);
                }}
                secureTextEntry={!showNewPassword}
                editable={!loading}
                autoComplete="new-password"
                textContentType="newPassword"
                leftIcon={<Ionicons name="lock-closed-outline" size={20} color={textSecondary} />}
                rightSlot={
                  <Pressable onPress={() => setShowNewPassword((v) => !v)} hitSlop={12}>
                    <Ionicons
                      name={showNewPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={20}
                      color={textSecondary}
                    />
                  </Pressable>
                }
              />
              <Input
                label="Повторите пароль"
                placeholder="Повторите пароль"
                value={confirmPassword}
                onChangeText={(t) => {
                  setConfirmPassword(t);
                  setError(null);
                }}
                secureTextEntry={!showConfirm}
                editable={!loading}
                autoComplete="new-password"
                textContentType="newPassword"
                leftIcon={<Ionicons name="lock-closed-outline" size={20} color={textSecondary} />}
                rightSlot={
                  <Pressable onPress={() => setShowConfirm((v) => !v)} hitSlop={12}>
                    <Ionicons
                      name={showConfirm ? 'eye-off-outline' : 'eye-outline'}
                      size={20}
                      color={textSecondary}
                    />
                  </Pressable>
                }
              />
              {error ? (
                <View style={styles.errorBlock}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}
              <Button
                variant="primary"
                size="md"
                fullWidth
                onPress={handleSubmit}
                isLoading={loading}
                disabled={loading}>
                Сохранить пароль
              </Button>
            </View>

            <Pressable onPress={() => router.replace('/login')} style={styles.centeredLink}>
              <Text style={styles.linkText}>Войти</Text>
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
  logoWrap: { alignItems: 'center', paddingTop: 32, paddingBottom: 16 },
  logoImage: { height: 40, width: 200, maxWidth: 240 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, gap: 16 },
  paragraph: { fontSize: 16, color: '#4b5563', textAlign: 'center', marginBottom: 8, fontFamily: Fonts.sans },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
    maxWidth: 448,
    width: '100%',
    alignSelf: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
    fontFamily: Fonts.sansSemiBold,
  },
  subtitle: { fontSize: 14, color: '#4b5563', textAlign: 'center', marginBottom: 24, fontFamily: Fonts.sans },
  form: { gap: 16, marginBottom: 24 },
  errorBlock: {
    padding: 12,
    borderRadius: BorderRadius.card,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  errorText: { fontSize: 14, color: '#b91c1c', fontFamily: Fonts.sansMedium },
  centeredLink: { alignSelf: 'center', marginTop: 8 },
  linkText: { fontSize: 14, color: '#4b5563', fontFamily: Fonts.sansMedium },
});
