/**
 * Правила навигации в табах:
 * 1. Корень вкладки — HOME, SCHEDULE_INDEX, MENU_INDEX, SUBSCRIPTIONS (см. константы).
 * 2. Повторное нажатие на таб → navigateTabRoot (сброс вложенных экранов).
 * 3. «Назад» внутри вкладки → goBackInSchedule / goBackInMenu, не router.back() вслепую.
 * 4. Переход на другую вкладку → router.navigate, не push (иначе back уводит не туда).
 * 5. Вложенные стеки — Stack в schedule/_layout и menu/_layout.
 */
import type { Href, Router } from "expo-router";

import { isMenuRootPath } from "@/constants/navigation";

/** Корни вкладок — при нажатии на таб всегда сюда. */
export const HOME_HREF = "/" as const;
export const SCHEDULE_INDEX_HREF = "/schedule" as const;
export const CLIENTS_INDEX_HREF = "/clients" as const;
export const MENU_INDEX_HREF = "/menu" as const;
export const MENU_NOTIFICATIONS_HREF = "/menu/notifications" as const;

export type ScheduleNestedScreen = "index" | "lesson" | "request";

export function isScheduleNestedPath(pathname: string): boolean {
  return getScheduleNestedScreen(pathname) !== "index";
}

export function getScheduleNestedScreen(pathname: string): ScheduleNestedScreen {
  const path = pathname.split("?")[0];
  if (path.includes("/schedule/request")) {
    return "request";
  }
  const lastSegment = path.split("/").filter(Boolean).pop() ?? "";
  if (
    path.includes("/schedule/") &&
    lastSegment !== "schedule" &&
    lastSegment !== "request" &&
    lastSegment !== "index"
  ) {
    return "lesson";
  }
  return "index";
}

export function isMenuNestedPath(pathname: string): boolean {
  return pathname.includes("/menu/") && !isMenuRootPath(pathname);
}

export function getMenuBackHref(pathname: string): Href {
  const path = pathname.split("?")[0].replace(/\/$/, "") || MENU_INDEX_HREF;
  if (isMenuRootPath(path)) return MENU_INDEX_HREF;
  return MENU_INDEX_HREF;
}

/** Назад в расписании: с карточки занятия — в список, не на главную. */
export function goBackInSchedule(router: Router, pathname: string): void {
  const screen = getScheduleNestedScreen(pathname);
  if (screen === "lesson") {
    router.navigate(SCHEDULE_INDEX_HREF);
    return;
  }
  if (router.canGoBack()) {
    router.back();
    return;
  }
  router.navigate(SCHEDULE_INDEX_HREF);
}

/** Назад в меню: pop стека (нативный свайп/слайд), иначе — корень меню. */
export function goBackInMenu(router: Router, pathname: string): void {
  if (router.canGoBack()) {
    router.back();
    return;
  }
  router.navigate(getMenuBackHref(pathname));
}

export function navigateTabRoot(router: Router, href: Href): void {
  router.navigate(href);
}
