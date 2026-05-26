/** Заголовки экранов `/menu/*` */
export const MENU_STACK_TITLES: Record<string, string> = {
  profile: "Профиль",
  online: "Онлайн",
  "my-stats": "Моя статистика",
  "completed-lessons": "Прошедшие занятия",
  "work-schedule": "Рабочий график",
  intensives: "Интенсивы",
  more: "Все разделы",
  about: "О приложении",
  services: "Услуги",
  surveys: "Анкеты",
  settings: "Настройки",
  notifications: "Уведомления",
};

export function isMenuRootPath(pathname: string): boolean {
  return pathname === "/menu" || pathname === "/menu/";
}

export function getMenuScreenTitle(pathname: string): string {
  const segment = pathname.replace(/^\/menu\/?/, "").split("/")[0];
  if (!segment) return "Меню";
  if (segment === "surveys" && /\/surveys\/[^/]+/.test(pathname)) return "Анкета";
  if (segment === "intensives" && /\/intensives\/[^/]+/.test(pathname)) return "Интенсив";
  return MENU_STACK_TITLES[segment] ?? "Меню";
}
