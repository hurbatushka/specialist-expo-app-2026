import type { Action } from "expo-quick-actions";
import * as QuickActions from "expo-quick-actions";

import { APP_STORE_REVIEW_URL } from "@/lib/open-external-url";

export const QUICK_ACTION_ITEMS: Action[] = [
  {
    id: "schedule",
    title: "Расписание",
    subtitle: "Сегодня и неделя",
    icon: "symbol:calendar",
    params: { href: "/schedule" },
  },
  {
    id: "clients",
    title: "Клиенты",
    subtitle: "Список и карточки",
    icon: "symbol:person.2.fill",
    params: { href: "/clients" },
  },
  {
    id: "online",
    title: "Онлайн",
    subtitle: "Ближайшие встречи",
    icon: "symbol:video.fill",
    params: { href: "/menu/online" },
  },
  {
    id: "profile",
    title: "Профиль",
    subtitle: "Личные данные",
    icon: "symbol:person.fill",
    params: { href: "/menu/profile" },
  },
  {
    id: "review",
    title: "Дайте нам шанс!",
    subtitle: "Мы стараемся для вас",
    icon: "symbol:heart.fill",
    params: { href: APP_STORE_REVIEW_URL },
  },
];

export async function configureHomeScreenQuickActions(): Promise<void> {
  try {
    const supported = await QuickActions.isSupported();
    if (!supported) return;
    await QuickActions.setItems(QUICK_ACTION_ITEMS);
  } catch (err) {
    console.warn("[quick-actions] configure failed:", err);
  }
}

export function isExternalQuickActionHref(
  href: unknown,
): href is string {
  return (
    typeof href === "string" &&
    (/^https?:\/\//i.test(href) ||
      href.startsWith("mailto:") ||
      href.startsWith("tel:"))
  );
}
