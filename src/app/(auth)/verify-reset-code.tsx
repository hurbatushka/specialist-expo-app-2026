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
import { Button, OtpCodeInput } from '@/components/ui';
import { BorderRadius, Fonts } from '@/constants/theme';
import { getApiUrl } from '@/lib/api';

export default function VerifyResetCodeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ channel?: string; sentTo?: string }>();
  const channel = params.channel ?? '';
  const sentTo = params.sentTo ?? '';

  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const hasParams = channel && sentTo;

  const handleSubmit = async () => {
    const codeClean = code.replace(/\D/g, '').slice(0, 6);
    if (codeClean.length !== 6) {
      setError('Введите 6-значный код');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(getApiUrl('/auth/verify-reset-code'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel, sentTo, code: codeClean }),
      });
      const data = (await res.json().catch(() => ({}))) as { success?: boolean; error?: string };
      if (data.success) {
        router.push({
          pathname: '/reset-password',
          params: { channel, sentTo, code: codeClean },
        });
        return;
      }
      setError(data.error ?? 'Неверный код или срок действия истёк.');
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
            <Text style={styles.paragraph}>Сначала запросите код восстановления.</Text>
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
            <Pressable onPress={() => router.back()} style={styles.backLink}>
              <Ionicons name="arrow-back" size={20} color="#6b7280" />
              <Text style={styles.backLinkText}>Назад</Text>
            </Pressable>

            <Text style={styles.title}>Код из {channel === 'email' ? 'письма' : 'СМС'}</Text>
            <Text style={styles.subtitle}>
              Введите 6 цифр. На iPhone код можно вставить из подсказки над клавиатурой.
            </Text>

            <View style={styles.form}>
              <OtpCodeInput
                autoFocus
                value={code}
                onChangeValue={(v) => {
                  setCode(v);
                  setError(null);
                }}
                editable={!loading}
                errorMessage={error ?? undefined}
              />
              <Button
                variant="primary"
                size="md"
                fullWidth
                onPress={handleSubmit}
                isLoading={loading}
                disabled={loading || code.length !== 6}>
                Продолжить
              </Button>
            </View>

            <Pressable onPress={() => router.replace('/forgot-password')} style={styles.centeredLink}>
              <Text style={styles.linkText}>Отправить код повторно</Text>
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
  paragraph: { fontSize: 16, color: '#4b5563', textAlign: 'center', fontFamily: Fonts.sans },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
    maxWidth: 448,
    width: '100%',
    alignSelf: 'center',
  },
  backLink: { flexDirection: 'row', alignItems: 'center', marginBottom: 24, gap: 8 },
  backLinkText: { fontSize: 14, color: '#6b7280', fontFamily: Fonts.sansMedium },
  title: { fontSize: 20, fontWeight: '600', color: '#111827', marginBottom: 8, fontFamily: Fonts.sansSemiBold },
  subtitle: { fontSize: 14, color: '#4b5563', marginBottom: 24, fontFamily: Fonts.sans },
  form: { gap: 16, marginBottom: 24 },
  centeredLink: { alignSelf: 'center', marginTop: 8 },
  linkText: { fontSize: 14, color: '#4b5563', fontFamily: Fonts.sansMedium },
});
