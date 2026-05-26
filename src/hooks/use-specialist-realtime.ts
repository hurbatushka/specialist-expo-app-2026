import { useEffect, useRef } from "react";

import type { AuthApi } from "@/lib/api";
import {
  connectSpecialistRealtimeStream,
  watchAppStateForSchedule,
} from "@/lib/specialist-realtime-sse";

type Options = {
  enabled: boolean;
  authApi: AuthApi;
  /** Тихое обновление (без спиннера). */
  onRefresh: () => void | Promise<void>;
  /** Дополнительная частота poll-fallback (по умолчанию 15s). */
  pollMs?: number;
};

/** Реалтайм для специалиста: SSE schedule/cancellations + foreground poll. */
export function useSpecialistRealtime({
  enabled,
  authApi,
  onRefresh,
  pollMs = 15_000,
}: Options): void {
  const onRefreshRef = useRef(onRefresh);
  onRefreshRef.current = onRefresh;

  useEffect(() => {
    if (!enabled) return;

    const tick = () => {
      void onRefreshRef.current();
    };

    const sse = connectSpecialistRealtimeStream(authApi, {
      onSchedule: tick,
      onCancellations: tick,
    });
    const stopAppWatch = watchAppStateForSchedule(tick, pollMs);

    return () => {
      sse.close();
      stopAppWatch();
    };
  }, [enabled, authApi, pollMs]);
}
