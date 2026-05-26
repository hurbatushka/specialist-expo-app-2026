import { Stack } from "expo-router";

import { NavigationChrome } from "@/components/glass-header";

export default function ClientsLayout() {
  return (
    <>
      <NavigationChrome title="Клиенты" canGoBack={false} showSettings={false} />
      <Stack screenOptions={{ headerShown: false, animation: "slide_from_right" }} />
    </>
  );
}
