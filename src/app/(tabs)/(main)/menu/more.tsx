import { Redirect } from "expo-router";

/** Разделы перенесены на главный экран меню */
export default function MenuMoreScreen() {
  return <Redirect href="/menu" />;
}
