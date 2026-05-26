import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useAuth } from "@/contexts/auth-context";
import { useSpecialistRealtime } from "@/hooks/use-specialist-realtime";
import { fetchWithAuth } from "@/lib/api";
import type { ScheduleLesson } from "@/lib/schedule-shared";

export type SpecialistLesson = ScheduleLesson;

export type SpecialistDashboardData = {
  firstName: string | null;
  today: {
    lessons: SpecialistLesson[];
    completed: number;
    remaining: number;
  };
  upcoming: SpecialistLesson[];
  pendingCancellationIds: string[];
};

type State = {
  data: SpecialistDashboardData | null;
  loading: boolean;
  error: string | null;
  revision: number;
  refresh: (opts?: { silent?: boolean }) => Promise<void>;
};

const ctx = createContext<State | null>(null);

const EMPTY: SpecialistDashboardData = {
  firstName: null,
  today: { lessons: [], completed: 0, remaining: 0 },
  upcoming: [],
  pendingCancellationIds: [],
};

export function SpecialistScheduleProvider({ children }: { children: React.ReactNode }) {
  const { authApi, isSignedIn, isReady } = useAuth();
  const [data, setData] = useState<SpecialistDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);

  const refresh = useCallback(
    async (opts?: { silent?: boolean }) => {
      if (!isReady || !isSignedIn) {
        setData(null);
        setLoading(false);
        return;
      }
      if (!opts?.silent) setLoading(true);
      setError(null);
      try {
        const res = await fetchWithAuth("/specialist/dashboard", {}, authApi);
        if (!res.ok) {
          setError(`Ошибка ${res.status}`);
          return;
        }
        const json = (await res.json()) as Partial<SpecialistDashboardData>;
        setData({
          firstName: json.firstName ?? null,
          today: {
            lessons: Array.isArray(json.today?.lessons) ? json.today!.lessons : [],
            completed: json.today?.completed ?? 0,
            remaining: json.today?.remaining ?? 0,
          },
          upcoming: Array.isArray(json.upcoming) ? json.upcoming : [],
          pendingCancellationIds: Array.isArray(json.pendingCancellationIds)
            ? json.pendingCancellationIds
            : [],
        });
        setRevision((r) => r + 1);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Ошибка загрузки");
      } finally {
        if (!opts?.silent) setLoading(false);
      }
    },
    [authApi, isSignedIn, isReady],
  );

  useEffect(() => {
    if (!isReady || !isSignedIn) {
      setLoading(false);
      return;
    }
    void refresh({ silent: false });
  }, [isReady, isSignedIn, refresh]);

  useSpecialistRealtime({
    enabled: isReady && isSignedIn,
    authApi,
    onRefresh: () => refresh({ silent: true }),
  });

  const value = useMemo<State>(
    () => ({
      data: data ?? (isSignedIn ? null : EMPTY),
      loading,
      error,
      revision,
      refresh,
    }),
    [data, loading, error, revision, refresh, isSignedIn],
  );

  return <ctx.Provider value={value}>{children}</ctx.Provider>;
}

export function useSpecialistSchedule(): State {
  const value = useContext(ctx);
  if (!value) {
    throw new Error(
      "useSpecialistSchedule must be used inside SpecialistScheduleProvider",
    );
  }
  return value;
}
