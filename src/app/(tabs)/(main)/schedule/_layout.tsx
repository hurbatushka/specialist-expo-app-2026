import { Stack, useLocalSearchParams, usePathname, useRouter } from "expo-router";
import { useCallback } from "react";
import { StyleSheet, View } from "react-native";

import { EdgeBackSwipe } from "@/components/edge-back-swipe";
import { NavigationChrome } from "@/components/glass-header";
import { getScheduleNestedScreen, goBackInSchedule } from "@/lib/tab-navigation";

export default function ScheduleLayout() {
  const pathname = usePathname();
  const router = useRouter();
  const params = useLocalSearchParams<{ status?: string }>();

  const nestedScreen = getScheduleNestedScreen(pathname);
  const isRequest = nestedScreen === "request";
  const isLessonDetail = nestedScreen === "lesson";
  const showChrome = isRequest || isLessonDetail;

  const lessonStatus = Array.isArray(params.status) ? params.status[0] : params.status;
  const title = isRequest
    ? "Запрос на отмену"
    : isLessonDetail
      ? lessonStatus === "cancelled"
        ? "Отменённое занятие"
        : "Занятие"
      : "";

  const handleBack = useCallback(() => {
    goBackInSchedule(router, pathname);
  }, [router, pathname]);

  return (
    <View style={styles.root}>
      <EdgeBackSwipe enabled={showChrome} onBack={handleBack} />
      {showChrome ? (
        <NavigationChrome
          title={title}
          canGoBack
          showSettings={false}
          onBack={handleBack}
        />
      ) : null}
      <View style={styles.content}>
        <Stack screenOptions={{ headerShown: false }} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { flex: 1 },
});
