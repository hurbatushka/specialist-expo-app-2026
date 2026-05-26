import { Platform, AppState, type AppStateStatus, Linking } from "react-native";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import Constants, { ExecutionEnvironment } from "expo-constants";
import { Router } from "expo-router";

import { fetchWithAuth, type AuthApi, getApiUrl } from "@/lib/api";
import { navigateFromPushData } from "@/lib/push-navigation";

let notificationHandlerInstalled = false;

function ensureNotificationHandler(): void {
  if (notificationHandlerInstalled) return;
  notificationHandlerInstalled = true;
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldPlaySound: true,
        shouldShowAlert: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  } catch (err) {
    console.warn("[push] setNotificationHandler failed:", err);
  }
}

export type PushPlatformLabel =
  | "ios-standalone"
  | "ios-storeClient"
  | "android-standalone"
  | "android-storeClient"
  | "ios"
  | "android"
  | "web";

export type PushRuntimeInfo = {
  platform: PushPlatformLabel;
  appId: string | null;
  isStandalone: boolean;
  isExpoGo: boolean;
};

export type PushTokenResult = {
  token: string | null;
  permission: Notifications.PermissionStatus;
};

/** iOS SDK 53+: без listener getExpoPushTokenAsync может зависнуть. */
let pushTokenListenerInstalled = false;

function ensurePushTokenListener(): void {
  if (pushTokenListenerInstalled || Platform.OS === "web") return;
  pushTokenListenerInstalled = true;
  try {
    Notifications.addPushTokenListener(() => {
      /* нужен только для инициализации нативного модуля */
    });
  } catch (err) {
    console.warn("[push] addPushTokenListener failed:", err);
  }
}

/** TestFlight/App Store vs Expo Go — для сервера, чтобы не слать пуши в Go. */
export function resolvePushPlatformLabel(): PushPlatformLabel {
  const os = Platform.OS as "ios" | "android" | "web";
  if (os === "web") return "web";
  switch (Constants.executionEnvironment) {
    case ExecutionEnvironment.Standalone:
    case ExecutionEnvironment.Bare:
      return `${os}-standalone` as PushPlatformLabel;
    case ExecutionEnvironment.StoreClient:
      return `${os}-storeClient` as PushPlatformLabel;
    default:
      return os;
  }
}

export function resolvePushAppId(): string | null {
  return (
    Constants.expoConfig?.ios?.bundleIdentifier ??
    Constants.expoConfig?.android?.package ??
    null
  );
}

export function getPushRuntimeInfo(): PushRuntimeInfo {
  const platform = resolvePushPlatformLabel();
  return {
    platform,
    appId: resolvePushAppId(),
    isStandalone: platform.endsWith("-standalone"),
    isExpoGo: platform.endsWith("-storeClient"),
  };
}

/** В Expo Go надёжнее env, чем easConfig от оболочки Go. */
function resolveExpoProjectId(): string | undefined {
  return (
    process.env.EXPO_PUBLIC_EAS_PROJECT_ID ??
    Constants?.expoConfig?.extra?.eas?.projectId ??
    Constants?.easConfig?.projectId ??
    undefined
  );
}

const TOKEN_FETCH_TIMEOUT_MS = 25_000;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error("getExpoPushTokenAsync timeout")),
      ms,
    );
    promise
      .then((v) => {
        clearTimeout(timer);
        resolve(v);
      })
      .catch((e) => {
        clearTimeout(timer);
        reject(e);
      });
  });
}

export function setupExpoPushNotifications(): void {
  ensureNotificationHandler();
  ensurePushTokenListener();
}

/** Текущий статус разрешения iOS без побочных эффектов. */
export async function getPushPermissionStatus(): Promise<Notifications.PermissionStatus> {
  if (Platform.OS === "web" || !Device.isDevice) return "denied";
  try {
    const res = await Notifications.getPermissionsAsync();
    return res.status;
  } catch {
    return "undetermined";
  }
}

/** Явный запрос разрешения у пользователя (вызывает iOS-диалог). */
export async function requestPushPermission(): Promise<Notifications.PermissionStatus> {
  if (Platform.OS === "web" || !Device.isDevice) return "denied";
  try {
    const existing = await Notifications.getPermissionsAsync();
    if (existing.status === "granted") return "granted";

    const req = await Notifications.requestPermissionsAsync(
      Platform.OS === "ios"
        ? {
            ios: {
              allowAlert: true,
              allowSound: true,
              allowBadge: true,
            },
          }
        : undefined,
    );
    return req.status;
  } catch (err) {
    console.warn("[push] requestPermission failed:", err);
    return "undetermined";
  }
}

/**
 * Получить токен. По умолчанию **НЕ запрашивает** разрешение пользователя — только если оно уже granted.
 * Используй `requestPushPermission()` отдельно, если нужно показать iOS-диалог.
 */
export async function getExpoPushToken(options?: {
  /** Если true — может вызвать iOS-диалог запроса разрешения. */
  requestPermission?: boolean;
}): Promise<PushTokenResult> {
  if (Platform.OS === "web") return { token: null, permission: "undetermined" };
  if (!Device.isDevice) return { token: null, permission: "denied" };

  ensurePushTokenListener();

  let permission = await getPushPermissionStatus();
  if (permission !== "granted") {
    if (options?.requestPermission) {
      permission = await requestPushPermission();
    } else {
      return { token: null, permission };
    }
  }
  if (permission !== "granted") return { token: null, permission };

  const projectId = resolveExpoProjectId();
  if (!projectId) {
    console.warn(
      "Expo push: задайте EXPO_PUBLIC_EAS_PROJECT_ID в .env (сейчас: e59f9dd1-...)",
    );
    return { token: null, permission };
  }

  try {
    const tokenResult = await withTimeout(
      Notifications.getExpoPushTokenAsync({ projectId }),
      TOKEN_FETCH_TIMEOUT_MS,
    );
    const token = tokenResult.data ?? null;
    if (__DEV__ && token) {
      const { platform, appId } = getPushRuntimeInfo();
      console.log("[push] token:", { platform, appId, token: token.slice(0, 40) + "…" });
    }
    return { token, permission };
  } catch (error) {
    console.warn("[push] getExpoPushTokenAsync failed:", error);
    return { token: null, permission };
  }
}

export type PushTokenSyncResult =
  | { ok: true; token: string }
  | { ok: false; reason: "no_token" | "no_permission" | "api_error" | "network" };

/**
 * Синхронизировать токен с сервером. По умолчанию **тихий режим** — не вызывает iOS-диалог.
 * Если разрешения нет — возвращает `no_permission` без побочных эффектов.
 */
export async function syncPushToken(
  authApi: AuthApi,
  options?: { maxAttempts?: number; requestPermission?: boolean },
): Promise<PushTokenSyncResult> {
  const maxAttempts = options?.maxAttempts ?? 3;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const { token, permission } = await getExpoPushToken({
        requestPermission: options?.requestPermission,
      });
      if (permission !== "granted") {
        return { ok: false, reason: "no_permission" };
      }
      if (!token) {
        if (attempt < maxAttempts) {
          await new Promise((r) => setTimeout(r, 1500 * attempt));
          continue;
        }
        return { ok: false, reason: "no_token" };
      }

      const accessToken = authApi.getAccessToken();
      if (!accessToken) {
        if (attempt < maxAttempts) {
          await new Promise((r) => setTimeout(r, 500 * attempt));
          continue;
        }
        return { ok: false, reason: "api_error" };
      }

      const info = getPushRuntimeInfo();
      const res = await fetchWithAuth(
        "/specialist/push-token",
        {
          method: "POST",
          body: JSON.stringify({
            token,
            platform: info.platform,
            appId: info.appId,
          }),
          headers: {
            "Content-Type": "application/json",
          },
        },
        authApi,
      );

      if (res.ok) {
        if (__DEV__ || info.isStandalone) {
          console.log("[push] token saved:", { platform: info.platform, appId: info.appId });
        }
        if (info.isExpoGo) {
          console.warn(
            "[push] токен зарегистрирован как Expo Go / dev client — пуши на TestFlight не придут.",
          );
        }
        return { ok: true, token };
      }

      const err = await res.text().catch(() => "");
      console.warn(
        `[push] sync attempt ${attempt}/${maxAttempts} failed:`,
        res.status,
        err,
      );

      if (res.status === 401) {
        return { ok: false, reason: "api_error" };
      }

      if (attempt < maxAttempts) {
        await new Promise((r) => setTimeout(r, 2000 * attempt));
        continue;
      }
      return { ok: false, reason: "api_error" };
    } catch (error) {
      console.warn(`[push] sync attempt ${attempt}/${maxAttempts} error:`, error);
      if (attempt < maxAttempts) {
        await new Promise((r) => setTimeout(r, 2000 * attempt));
        continue;
      }
      return { ok: false, reason: "network" };
    }
  }

  return { ok: false, reason: "network" };
}

/** Деактивировать токен этого устройства на сервере (для тогла «выключить пуши»). */
export async function disablePushTokenOnServer(authApi: AuthApi): Promise<boolean> {
  try {
    const projectId = resolveExpoProjectId();
    if (!projectId) return false;
    const permission = await getPushPermissionStatus();
    if (permission !== "granted") {
      // Без разрешения токен получить нельзя, но на сервере можно деактивировать
      // по platform/appId этого устройства
      const info = getPushRuntimeInfo();
      const res = await fetchWithAuth(
        "/specialist/push-token/disable",
        {
          method: "POST",
          body: JSON.stringify({ platform: info.platform, appId: info.appId }),
          headers: { "Content-Type": "application/json" },
        },
        authApi,
      );
      return res.ok;
    }

    const tokenResult = await withTimeout(
      Notifications.getExpoPushTokenAsync({ projectId }),
      TOKEN_FETCH_TIMEOUT_MS,
    );
    const token = tokenResult.data ?? null;
    if (!token) return false;

    const info = getPushRuntimeInfo();
    const res = await fetchWithAuth(
      "/specialist/push-token/disable",
      {
        method: "POST",
        body: JSON.stringify({ token, platform: info.platform, appId: info.appId }),
        headers: { "Content-Type": "application/json" },
      },
      authApi,
    );
    return res.ok;
  } catch (err) {
    console.warn("[push] disablePushTokenOnServer failed:", err);
    return false;
  }
}

export function registerPushTokenSyncOnAppState(authApi: AuthApi): () => void {
  const sub = AppState.addEventListener("change", (state: AppStateStatus) => {
    if (state === "active") void syncPushToken(authApi);
  });
  return () => sub.remove();
}

async function markNotificationReadFromPush(
  authApi: AuthApi,
  notificationId: string | undefined,
) {
  if (!notificationId) return;
  try {
    await fetchWithAuth(
      `/specialist/notifications/${notificationId}/read`,
      { method: "POST" },
      authApi,
    );
  } catch {
    /* ignore */
  }
}

export function registerNotificationNavigation(
  router: Router,
  authApi: AuthApi,
  options?: { onNotificationReceived?: () => void },
): () => void {
  const receivedSub = Notifications.addNotificationReceivedListener(() => {
    options?.onNotificationReceived?.();
  });

  const responseSub = Notifications.addNotificationResponseReceivedListener(
    (response) => {
      const data = response.notification.request.content.data as
        | Record<string, unknown>
        | undefined;
      const notificationId =
        typeof data?.notificationId === "string"
          ? data.notificationId
          : undefined;
      void markNotificationReadFromPush(authApi, notificationId);
      options?.onNotificationReceived?.();
      navigateFromPushData(router, data);
    },
  );

  return () => {
    receivedSub.remove();
    responseSub.remove();
  };
}

export async function sendTestLocalNotification() {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Пуши подключены",
      body: "Теперь вы будете получать уведомления по занятиям.",
    },
    trigger: null,
  });
}

export type TestPushFromServerResult =
  | { ok: true; notificationId?: string | null }
  | { ok: false; reason: "no_token" | "api_error" | "network" };

/** Тестовый push с сервера (Expo) — проверяет, что токен зарегистрирован. */
export async function sendTestPushFromServer(
  authApi: AuthApi,
): Promise<TestPushFromServerResult> {
  try {
    const res = await fetchWithAuth(
      "/specialist/push-token/test",
      { method: "POST" },
      authApi,
    );
    if (res.ok) {
      const json = (await res.json().catch(() => ({}))) as {
        notificationId?: string | null;
      };
      return { ok: true, notificationId: json.notificationId ?? null };
    }
    if (res.status === 400) {
      return { ok: false, reason: "no_token" };
    }
    return { ok: false, reason: "api_error" };
  } catch {
    return { ok: false, reason: "network" };
  }
}

/** Открыть системные настройки приложения (для случая denied). */
export async function openSystemNotificationSettings(): Promise<void> {
  try {
    if (Platform.OS === "ios") {
      await Linking.openURL("app-settings:");
    } else if (Platform.OS === "android") {
      await Linking.openSettings();
    }
  } catch (err) {
    console.warn("[push] openSystemNotificationSettings failed:", err);
  }
}

/** @deprecated использовать `openSystemNotificationSettings` */
export function getPushSettingsUrl(): string {
  return getApiUrl("/auth/check");
}
