import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const KEY_ACCESS = 'blagodeti_access_token';
const KEY_REFRESH = 'blagodeti_refresh_token';
const KEY_EXPIRES = 'blagodeti_expires_at';

const isWeb = Platform.OS === 'web';
const storage = isWeb
  ? {
      getItem: (k: string) => AsyncStorage.getItem(k),
      setItem: (k: string, v: string) => AsyncStorage.setItem(k, v),
      removeItem: (k: string) => AsyncStorage.removeItem(k),
    }
  : {
      getItem: (k: string) => SecureStore.getItemAsync(k),
      setItem: (k: string, v: string) => SecureStore.setItemAsync(k, v),
      removeItem: (k: string) => SecureStore.deleteItemAsync(k),
    };

export async function getStoredTokens(): Promise<{
  accessToken: string | null;
  refreshToken: string | null;
  expiresAt: string | null;
}> {
  const [accessToken, refreshToken, expiresAt] = await Promise.all([
    storage.getItem(KEY_ACCESS),
    storage.getItem(KEY_REFRESH),
    storage.getItem(KEY_EXPIRES),
  ]);
  return {
    accessToken: accessToken ?? null,
    refreshToken: refreshToken ?? null,
    expiresAt: expiresAt ?? null,
  };
}

export async function setStoredTokens(tokens: {
  accessToken: string;
  refreshToken: string;
  expiresAt?: string;
}): Promise<void> {
  await Promise.all([
    storage.setItem(KEY_ACCESS, tokens.accessToken),
    storage.setItem(KEY_REFRESH, tokens.refreshToken),
    storage.setItem(KEY_EXPIRES, tokens.expiresAt ?? ''),
  ]);
}

export async function clearStoredTokens(): Promise<void> {
  await Promise.all([
    storage.removeItem(KEY_ACCESS),
    storage.removeItem(KEY_REFRESH),
    storage.removeItem(KEY_EXPIRES),
  ]);
}
