import type { ScheduleLesson } from "@/lib/schedule-shared";

export type LessonKindBadge = {
  id: string;
  label: string;
  bg: string;
  text: string;
  border: string;
};

export type LessonKindSource = Pick<
  ScheduleLesson,
  | "serviceName"
  | "serviceScheduleShortName"
  | "serviceType"
  | "isIntensive"
  | "participantCount"
>;

export function lessonIsDiagnostic(lesson: LessonKindSource): boolean {
  if (lesson.serviceType === "additional") return true;
  const blob = `${lesson.serviceScheduleShortName ?? ""} ${lesson.serviceName ?? ""}`.toLowerCase();
  return blob.includes("консультац") || blob.includes("диагност");
}

export function lessonIsIntime(lesson: LessonKindSource): boolean {
  const raw = `${lesson.serviceScheduleShortName ?? ""} ${lesson.serviceName ?? ""}`.toLowerCase();
  return raw.includes("интайм") || raw.includes("intime");
}

export function lessonIsGroup(lesson: LessonKindSource): boolean {
  if ((lesson.participantCount ?? 0) > 1) return true;
  const blob = `${lesson.serviceScheduleShortName ?? ""} ${lesson.serviceName ?? ""}`.toLowerCase();
  return blob.includes("групп");
}

/** Бейджи в том же смысле, что LessonKindBadges на веб-ЛК специалиста. */
export function getLessonKindBadges(lesson: LessonKindSource): LessonKindBadge[] {
  const badges: LessonKindBadge[] = [];

  if (lessonIsIntime(lesson)) {
    badges.push({
      id: "intime",
      label: "Интайм",
      bg: "#e0e7ff",
      text: "#312e81",
      border: "#a5b4fc",
    });
  }

  if (lessonIsDiagnostic(lesson)) {
    badges.push({
      id: "diagnostic",
      label: "Консультация",
      bg: "#ede9fe",
      text: "#5b21b6",
      border: "#c4b5fd",
    });
  }

  if (lesson.isIntensive) {
    badges.push({
      id: "intensive",
      label: "Интенсив",
      bg: "#fef3c7",
      text: "#92400e",
      border: "#fcd34d",
    });
  }

  if (lessonIsGroup(lesson)) {
    badges.push({
      id: "group",
      label: "Групповое",
      bg: "#dbeafe",
      text: "#1e40af",
      border: "#93c5fd",
    });
  }

  if (!lessonIsDiagnostic(lesson) && lesson.serviceType === "subscriptions") {
    badges.push({
      id: "subscription",
      label: "Абонемент",
      bg: "#f0fdf4",
      text: "#166534",
      border: "#86efac",
    });
  }

  if (
    !lessonIsDiagnostic(lesson) &&
    lesson.serviceType === "single" &&
    !lesson.isIntensive &&
    !lessonIsGroup(lesson)
  ) {
    badges.push({
      id: "single",
      label: "Разовое",
      bg: "#f3f4f6",
      text: "#374151",
      border: "#d1d5db",
    });
  }

  return badges;
}
