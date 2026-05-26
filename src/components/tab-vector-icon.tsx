import { Ionicons } from "@expo/vector-icons";

export type TabVectorIconName = keyof typeof TAB_VECTOR_ICONS;

/** Ionicons для табов (кроме «БлагоДети») — outline / filled */
export const TAB_VECTOR_ICONS = {
  schedule: {
    outline: "calendar-outline",
    filled: "calendar",
  },
  subscriptions: {
    outline: "ticket-outline",
    filled: "ticket",
  },
  menu: {
    outline: "grid-outline",
    filled: "grid",
  },
} as const satisfies Record<
  string,
  {
    outline: keyof typeof Ionicons.glyphMap;
    filled: keyof typeof Ionicons.glyphMap;
  }
>;
