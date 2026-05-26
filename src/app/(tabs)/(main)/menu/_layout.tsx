import { Stack, usePathname, useRouter } from "expo-router";
import { useCallback } from "react";
import { StyleSheet, View } from "react-native";

import { NavigationChrome } from "@/components/glass-header";
import { MenuRootHeader } from "@/components/menu/MenuRootHeader";
import { getMenuScreenTitle, isMenuRootPath } from "@/constants/navigation";
import { goBackInMenu, isMenuNestedPath } from "@/lib/tab-navigation";

export default function MenuLayout() {
  const pathname = usePathname();
  const router = useRouter();
  const isRoot = isMenuRootPath(pathname);
  const canGoBack = isMenuNestedPath(pathname);

  const handleBack = useCallback(() => {
    goBackInMenu(router, pathname);
  }, [router, pathname]);

  return (
    <View style={styles.root}>
      {isRoot ? (
        <MenuRootHeader />
      ) : (
        <NavigationChrome
          title={getMenuScreenTitle(pathname)}
          canGoBack={canGoBack}
          showSettings={false}
          onBack={handleBack}
        />
      )}
      <View style={styles.content}>
        <Stack
          screenOptions={{
            headerShown: false,
            gestureEnabled: true,
            fullScreenGestureEnabled: true,
            animation: "slide_from_right",
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { flex: 1 },
});
