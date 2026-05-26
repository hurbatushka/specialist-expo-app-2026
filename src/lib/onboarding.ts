import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

const KEY = "@onboarding_done";

/** Fallback, если AsyncStorage недоступен: false = онбординг ещё не пройден */
let memoryFallback = false;

const useWebStorage =
  Platform.OS === "web" && typeof localStorage !== "undefined";

export const setOnboardingDone = async (): Promise<void> => {
  if (useWebStorage) {
    localStorage.setItem(KEY, "1");
    return;
  }
  try {
    await AsyncStorage.setItem(KEY, "1");
  } catch {
    memoryFallback = true;
  }
};

export const hasSeenOnboarding = async (): Promise<boolean> => {
  if (useWebStorage) {
    return localStorage.getItem(KEY) === "1";
  }
  try {
    const value = await AsyncStorage.getItem(KEY);
    return value === "1";
  } catch {
    return memoryFallback;
  }
};

/** Повторный показ визарда (Настройки → «Познакомиться с приложением»). */
export const clearOnboardingDone = async (): Promise<void> => {
  memoryFallback = false;
  if (useWebStorage) {
    localStorage.removeItem(KEY);
    return;
  }
  try {
    await AsyncStorage.removeItem(KEY);
  } catch {
    memoryFallback = false;
  }
};
