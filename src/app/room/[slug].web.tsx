import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { getWebAppOrigin } from '@/lib/web-app-origin';

/**
 * Видеокомната в Expo Web — не поддерживается; открываем кабинет на сайте.
 */
export default function RoomWebStub() {
  const router = useRouter();
  const web = getWebAppOrigin();

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Видеозвонок в браузере</Text>
      <Text style={styles.sub}>
        Нативная комната доступна в приложении iOS/Android (development build). В веб-версии Expo откройте
        личный кабинет на сайте.
      </Text>
      <Pressable onPress={() => router.back()} style={styles.btn}>
        <Text style={styles.btnText}>Назад</Text>
      </Pressable>
      <Text style={styles.hint}>{web}/online</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, padding: 24, justifyContent: 'center', gap: 16 },
  title: { fontSize: 20, fontWeight: '600', textAlign: 'center' },
  sub: { fontSize: 14, color: '#4b5563', textAlign: 'center', lineHeight: 20 },
  btn: {
    alignSelf: 'center',
    backgroundColor: '#c42d26',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  btnText: { color: '#fff', fontWeight: '600' },
  hint: { fontSize: 12, color: '#9ca3af', textAlign: 'center' },
});
