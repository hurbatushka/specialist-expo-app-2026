import * as WebBrowser from "expo-web-browser";
import { Alert, Linking, Platform } from "react-native";

/** App Store Connect id «БлагоДети: Всегда рядом!» */
export const APP_STORE_REVIEW_URL =
  "https://apps.apple.com/app/id6752854525?action=write-review";

export async function openExternalUrl(url: string): Promise<boolean> {
  try {
    if (Platform.OS === "web") {
      if (typeof window !== "undefined") {
        window.open(url, "_blank", "noopener,noreferrer");
      }
      return true;
    }

    const useSystemLink =
      url.startsWith("mailto:") ||
      url.startsWith("tel:") ||
      url.includes("apps.apple.com") ||
      url.startsWith("itms-apps://");

    if (useSystemLink) {
      await Linking.openURL(url);
      return true;
    }

    await WebBrowser.openBrowserAsync(url, {
      presentationStyle: WebBrowser.WebBrowserPresentationStyle.AUTOMATIC,
    });
    return true;
  } catch {
    Alert.alert("Ошибка", "Не удалось открыть ссылку");
    return false;
  }
}
