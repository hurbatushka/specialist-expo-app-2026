import bg1 from "@/assets/onboard/bg/1.jpg";
import bg2 from "@/assets/onboard/bg/2.jpg";
import bg3 from "@/assets/onboard/bg/3.jpg";
import bg4 from "@/assets/onboard/bg/4.jpg";
import bg5 from "@/assets/onboard/bg/5.jpg";
import bg6 from "@/assets/onboard/bg/6.jpg";
import bg7 from "@/assets/onboard/bg/7.jpg";
import logoFull from "@/assets/images/logo_full.png";

/** Фоны онбординга (порядок 1–7 ≈ шаги визарда). */
export const ONBOARDING_BACKGROUNDS = {
  welcome: bg1,
  home: bg2,
  schedule: bg3,
  subscriptions: bg4,
  menu: bg5,
  permissions: bg6,
  ready: bg7,
} as const;

export const ONBOARDING_LOGO = logoFull;
