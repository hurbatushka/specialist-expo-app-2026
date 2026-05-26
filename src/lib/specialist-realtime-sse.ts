import { AppState, type AppStateStatus } from "react-native";

import { getApiHeaders, getApiUrl, type AuthApi } from "@/lib/api";

export type SpecialistRealtimeHandlers = {
  onSchedule?: () => void;
  onCancellations?: () => void;
  onError?: (err: unknown) => void;
};

function parseSseChunk(buffer: string): { events: string[]; rest: string } {
  const parts = buffer.split("\n\n");
  const rest = parts.pop() ?? "";
  return { events: parts, rest };
}

function eventNameFromBlock(block: string): string | null {
  for (const line of block.split("\n")) {
    if (line.startsWith("event:")) return line.slice(6).trim();
  }
  return null;
}

/** SSE-подписка на `/api/specialist/realtime/stream` (Bearer). */
export function connectSpecialistRealtimeStream(
  authApi: AuthApi,
  handlers: SpecialistRealtimeHandlers,
): { close: () => void } {
  const abort = new AbortController();
  let closed = false;

  const run = async () => {
    while (!closed) {
      const token = authApi.getAccessToken();
      if (!token) {
        await sleep(2000);
        continue;
      }

      try {
        const res = await fetch(getApiUrl("/specialist/realtime/stream"), {
          method: "GET",
          headers: {
            ...getApiHeaders(token),
            Accept: "text/event-stream",
          },
          signal: abort.signal,
        });

        if (!res.ok || !res.body) {
          await sleep(5000);
          continue;
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (!closed) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const { events, rest } = parseSseChunk(buffer);
          buffer = rest;
          for (const block of events) {
            const name = eventNameFromBlock(block);
            if (name === "schedule") handlers.onSchedule?.();
            else if (name === "cancellations") handlers.onCancellations?.();
          }
        }
      } catch (err) {
        if (closed || abort.signal.aborted) return;
        handlers.onError?.(err);
        await sleep(4000);
      }
    }
  };

  void run();

  return {
    close: () => {
      closed = true;
      abort.abort();
    },
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/** Poll расписания при активном приложении (fallback к SSE). */
export function watchAppStateForSchedule(
  onActive: () => void,
  pollMs = 15_000,
): () => void {
  let interval: ReturnType<typeof setInterval> | null = null;

  const startPoll = () => {
    if (interval) return;
    interval = setInterval(() => {
      if (AppState.currentState === "active") onActive();
    }, pollMs);
  };

  const stopPoll = () => {
    if (interval) {
      clearInterval(interval);
      interval = null;
    }
  };

  const onChange = (state: AppStateStatus) => {
    if (state === "active") {
      onActive();
      startPoll();
    } else {
      stopPoll();
    }
  };

  if (AppState.currentState === "active") startPoll();
  const sub = AppState.addEventListener("change", onChange);

  return () => {
    stopPoll();
    sub.remove();
  };
}
