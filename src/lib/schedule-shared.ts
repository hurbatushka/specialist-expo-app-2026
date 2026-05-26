export type ScheduleLesson = {
  id: string;
  startsAt: string;
  durationMinutes: number;
  status: string;
  serviceName: string | null;
  serviceScheduleShortName?: string | null;
  serviceType?: string | null;
  isIntensive?: boolean;
  participantCount?: number;
  roomName: string | null;
  /** Имя клиента (родителя/абонента). */
  clientName: string;
  /** Если известно — имя ребёнка, для подписи. */
  clientChildName?: string | null;
  /** Онлайн-занятие (показываем шорткат «Войти в комнату»). */
  isOnline: boolean;
  /** ID alfa-клиента — для перехода в карточку. */
  alfaClientId?: string | null;
};

export const LESSON_STATUS_LABELS: Record<string, string> = {
  scheduled: "Запланировано",
  completed: "Проведено",
  cancelled: "Отменено",
  no_show: "Не пришёл",
};

export function isLessonCancelled(status: string): boolean {
  return status === "cancelled";
}

export function isLessonScheduled(status: string): boolean {
  return status === "scheduled";
}

export function lessonEndTimestamp(
  lesson: Pick<ScheduleLesson, "startsAt" | "durationMinutes">,
): number {
  return new Date(lesson.startsAt).getTime() + lesson.durationMinutes * 60 * 1000;
}

export function isLessonLiveNow(
  lesson: Pick<ScheduleLesson, "startsAt" | "durationMinutes" | "status">,
  now = Date.now(),
): boolean {
  if (!isLessonScheduled(lesson.status)) return false;
  const start = new Date(lesson.startsAt).getTime();
  return now >= start && lessonEndTimestamp(lesson) > now;
}

export function formatDate(d: string): string {
  return new Date(d).toLocaleDateString("ru-RU", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

/** «26 мая 2026 года» */
export function formatLongDateWithYear(isoOrDate: string | Date): string {
  const d = typeof isoOrDate === "string" ? new Date(isoOrDate) : isoOrDate;
  const raw = d.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  return raw.replace(/\s*г\.?$/, " года");
}

/**
 * Заголовок блока дня: «Сегодня — 26 мая 2026 года», «Завтра — …», «Понедельник — …».
 */
export function formatDaySectionHeading(
  isoOrDate: string | Date,
  now = new Date(),
): string {
  const d = typeof isoOrDate === "string" ? new Date(isoOrDate) : isoOrDate;
  const longDate = formatLongDateWithYear(d);
  const key = scheduleDayKey(d.toISOString());
  const todayKey = scheduleDayKey(now.toISOString());

  if (key === todayKey) return `Сегодня — ${longDate}`;

  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (key === scheduleDayKey(tomorrow.toISOString())) return `Завтра — ${longDate}`;

  const weekday = d.toLocaleDateString("ru-RU", { weekday: "long" });
  const cap = weekday.charAt(0).toUpperCase() + weekday.slice(1);
  return `${cap} — ${longDate}`;
}

export function formatTime(d: string): string {
  return new Date(d).toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatLessonDateTime(startsAt: string): string {
  const date = new Date(startsAt).toLocaleDateString("ru-RU", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const time = formatTime(startsAt);
  return `${date}, ${time}`;
}

export function hoursUntilLesson(startsAt: string): number {
  return (new Date(startsAt).getTime() - Date.now()) / (1000 * 60 * 60);
}

export function dayKey(startsAt: string): string {
  const d = new Date(startsAt);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const SCHEDULE_TZ = "Europe/Minsk";

function ymdInScheduleTz(d: Date): string {
  return d.toLocaleDateString("en-CA", { timeZone: SCHEDULE_TZ });
}

export function scheduleDayKey(startsAt: string): string {
  return ymdInScheduleTz(new Date(startsAt));
}

export function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export function todayDayKey(): string {
  return dayKey(startOfToday().toISOString());
}

export function isLessonOnOrAfterToday(startsAt: string): boolean {
  return dayKey(startsAt) >= todayDayKey();
}

export function upcomingScheduleFetchRange(monthsAhead = 2): {
  from: Date;
  to: Date;
} {
  const from = startOfToday();
  const to = new Date(from);
  to.setMonth(to.getMonth() + monthsAhead);
  to.setHours(23, 59, 59, 999);
  return { from, to };
}

export function startOfWeek(d: Date): Date {
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const start = new Date(d);
  start.setDate(diff);
  start.setHours(0, 0, 0, 0);
  return start;
}

export function endOfWeek(d: Date): Date {
  const s = startOfWeek(d);
  const e = new Date(s);
  e.setDate(e.getDate() + 6);
  e.setHours(23, 59, 59, 999);
  return e;
}

export function formatWeekRange(from: Date, to: Date): string {
  const f = from.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
  const t = to.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
  return `${f} — ${t}`;
}

export type CancellationRequestKind = "CANCELLATION" | "TRANSFER";

export type LessonRouteParams = {
  lessonId: string;
  startsAt: string;
  serviceName?: string;
  clientName?: string;
  clientChildName?: string;
  roomName?: string;
  durationMinutes?: string;
  status?: string;
  alfaClientId?: string;
};

export function lessonRouteParamsFromLesson(
  lesson: ScheduleLesson,
): LessonRouteParams {
  return {
    lessonId: lesson.id,
    startsAt: lesson.startsAt,
    serviceName: lesson.serviceName ?? "",
    clientName: lesson.clientName,
    clientChildName: lesson.clientChildName ?? "",
    roomName: lesson.roomName ?? "",
    durationMinutes: String(lesson.durationMinutes),
    status: lesson.status,
    alfaClientId: lesson.alfaClientId ?? "",
  };
}

export const QUICK_REASONS_CANCEL = [
  "Болезнь специалиста",
  "Семейные обстоятельства",
  "Накладка с графиком",
  "Другое",
] as const;

export const QUICK_REASONS_TRANSFER = [
  "Нужен другой день",
  "Не успеваю в это время",
  "Болезнь — перенести",
  "Семейные обстоятельства",
] as const;

export function parseLessonIdsFromNotificationData(
  data: Record<string, unknown> | null | undefined,
): string[] {
  if (!data) return [];
  if (typeof data.lessonId === "string" && data.lessonId) {
    return [data.lessonId];
  }
  if (typeof data.lessonIds === "string" && data.lessonIds) {
    return data.lessonIds
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  if (Array.isArray(data.lessonIds)) {
    return (data.lessonIds as unknown[])
      .filter((x): x is string => typeof x === "string")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
}
