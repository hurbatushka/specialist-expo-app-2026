import * as Device from 'expo-device';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY_DEVICE_FP = 'blagodeti_device_fingerprint';

const storage =
  Platform.OS === 'web'
    ? {
        getItem: (k: string) => AsyncStorage.getItem(k),
        setItem: (k: string, v: string) => AsyncStorage.setItem(k, v),
      }
    : {
        getItem: (k: string) => SecureStore.getItemAsync(k),
        setItem: (k: string, v: string) => SecureStore.setItemAsync(k, v),
      };

function randomHexId(): string {
  const bytes = new Uint8Array(16);
  if (typeof globalThis.crypto?.getRandomValues === 'function') {
    globalThis.crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

/** Стабильный fingerprint устройства (один на установку). */
export async function getStableDeviceFingerprint(): Promise<string> {
  let id = await storage.getItem(KEY_DEVICE_FP);
  if (!id) {
    id = randomHexId();
    await storage.setItem(KEY_DEVICE_FP, id);
  }
  return id.slice(0, 64);
}

export async function getMobileDeviceInfo(): Promise<{
  deviceFingerprint: string;
  deviceName: string;
  os: string;
  platform: string;
  browser: string;
}> {
  const os = Platform.OS === 'ios' ? 'iOS' : Platform.OS === 'android' ? 'Android' : 'Web';
  const deviceName =
    Device.deviceName ??
    (Platform.OS === 'ios' ? 'iPhone' : Platform.OS === 'android' ? 'Android' : 'Web');
  return {
    deviceFingerprint: await getStableDeviceFingerprint(),
    deviceName,
    os,
    platform: Device.deviceType === 2 ? 'Tablet' : 'Mobile',
    browser: 'BlagodetiSpecialistApp',
  };
}
