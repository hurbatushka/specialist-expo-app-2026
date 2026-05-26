import type { Router } from "expo-router";

import { parseLessonIdsFromNotificationData } from "@/lib/schedule-shared";
import {
  CLIENTS_INDEX_HREF,
  HOME_HREF,
  MENU_NOTIFICATIONS_HREF,
  SCHEDULE_INDEX_HREF,
  navigateTabRoot,
} from "@/lib/tab-navigation";

export function navigateFromPushData(
  router: Router,
  data: Record<string, unknown> | undefined,
): void {
  const type = typeof data?.type === "string" ? data.type : "";
  const lessonIds = parseLessonIdsFromNotificationData(data);

  if (lessonIds.length === 1) {
    router.navigate({
      pathname: "/schedule/[lessonId]",
      params: { lessonId: lessonIds[0] },
    });
    return;
  }

  if (lessonIds.length > 1) {
    navigateTabRoot(router, SCHEDULE_INDEX_HREF);
    return;
  }

  if (type === "client_new" || type === "client_assigned") {
    navigateTabRoot(router, CLIENTS_INDEX_HREF);
    return;
  }

  if (type === "schedule_changed" || type === "cancellation_decision") {
    navigateTabRoot(router, SCHEDULE_INDEX_HREF);
    return;
  }

  if (type === "go_home") {
    navigateTabRoot(router, HOME_HREF);
    return;
  }

  navigateTabRoot(router, MENU_NOTIFICATIONS_HREF);
}
