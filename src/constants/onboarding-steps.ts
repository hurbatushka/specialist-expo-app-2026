import { ONBOARDING_BACKGROUNDS } from "@/constants/onboarding-images";

export type OnboardingStepKind = "story" | "permissions" | "finish";

export type OnboardingTextLayout =
  | "top"
  | "center-lower"
  | "finish-centered";

export type OnboardingStep = {
  id: string;
  kind: OnboardingStepKind;
  title: string;
  description: string;
  background: number;
  textLayout: OnboardingTextLayout;
  textTone?: "light" | "dark";
};

export function isOnboardingDarkText(step: OnboardingStep): boolean {
  if (step.textTone) return step.textTone === "dark";
  return step.textLayout === "center-lower" || step.textLayout === "finish-centered";
}

export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: "welcome",
    kind: "story",
    title: "Кабинет специалиста",
    description:
      "Мобильное приложение для специалистов БлагоДети: расписание, клиенты, онлайн-занятия, анкеты и уведомления — всё в одном месте.\n\nУдобно смотреть день, подавать заявки на отмену и входить в онлайн-комнату прямо с телефона.",
    background: ONBOARDING_BACKGROUNDS.welcome,
    textLayout: "top",
    textTone: "dark",
  },
  {
    id: "home",
    kind: "story",
    title: "Главная — ваш день",
    description:
      "На главной — занятия на сегодня, счётчики проведённых и оставшихся визитов, ближайшие записи.\n\nБыстрый обзор без лишних переходов.",
    background: ONBOARDING_BACKGROUNDS.home,
    textLayout: "top",
    textTone: "dark",
  },
  {
    id: "schedule",
    kind: "story",
    title: "Расписание",
    description:
      "Вкладки «Сегодня», «Неделя» и «Все» — предстоящие занятия с клиентами, кабинетами и онлайн-метками.\n\nИз карточки можно подать заявку на отмену.",
    background: ONBOARDING_BACKGROUNDS.schedule,
    textLayout: "top",
    textTone: "dark",
  },
  {
    id: "clients",
    kind: "story",
    title: "Клиенты",
    description:
      "Список ваших клиентов с датой последнего занятия. Откройте карточку — контакты и история взаимодействия.",
    background: ONBOARDING_BACKGROUNDS.subscriptions,
    textLayout: "top",
    textTone: "dark",
  },
  {
    id: "menu",
    kind: "story",
    title: "Меню",
    description:
      "Онлайн-комната, прошедшие занятия, статистика, рабочий график, интенсивы, услуги, анкеты и настройки Telegram.\n\nКолокольчик — все важные уведомления.",
    background: ONBOARDING_BACKGROUNDS.menu,
    textLayout: "top",
    textTone: "dark",
  },
  {
    id: "permissions",
    kind: "permissions",
    title: "Push-уведомления",
    description:
      "Разрешите уведомления — мы напомним о занятиях и важных событиях в расписании.\n\nОтключить можно в любой момент в настройках iOS.",
    background: ONBOARDING_BACKGROUNDS.permissions,
    textLayout: "center-lower",
  },
  {
    id: "ready",
    kind: "finish",
    title: "Всё готово!",
    description:
      "Добро пожаловать в приложение для специалистов БлагоДети.\n\nЖелаем продуктивных занятий и спокойных дней!",
    background: ONBOARDING_BACKGROUNDS.ready,
    textLayout: "finish-centered",
    textTone: "dark",
  },
];
