import type { Router } from "expo-router";

import { lessonRouteParamsFromLesson, type ScheduleLesson } from "@/lib/schedule-shared";
import {
  goBackInSchedule,
  getScheduleNestedScreen,
  isScheduleNestedPath,
  SCHEDULE_INDEX_HREF,
} from "@/lib/tab-navigation";

export {
  goBackInSchedule,
  getScheduleNestedScreen,
  isScheduleNestedPath,
  SCHEDULE_INDEX_HREF,
};

export type OpenLessonDetailOptions = {
  pending?: boolean;
};

export function openLessonDetail(
  router: Router,
  lesson: ScheduleLesson,
  options?: OpenLessonDetailOptions,
): void {
  const pending = options?.pending ?? false;
  router.push({
    pathname: "/schedule/[lessonId]",
    params: {
      ...lessonRouteParamsFromLesson(lesson),
      pending: pending ? "1" : "0",
    },
  });
}
