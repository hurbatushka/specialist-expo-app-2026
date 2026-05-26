import { useEffect, useRef, useState } from "react";

function easeOutCubic(t: number): number {
  return 1 - (1 - t) ** 3;
}

export function useAnimatedNumber(
  target: number,
  options?: {
    durationMs?: number;
    resetKey?: string | number;
    fromZero?: boolean;
  },
): number {
  const { durationMs = 700, resetKey, fromZero } = options ?? {};
  const [display, setDisplay] = useState(() => (fromZero ? 0 : target));
  const displayRef = useRef(fromZero ? 0 : target);

  useEffect(() => {
    if (fromZero) {
      displayRef.current = 0;
      setDisplay(0);
    } else {
      displayRef.current = target;
      setDisplay(target);
    }
    // reset only on entity change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey, fromZero]);

  useEffect(() => {
    const from = displayRef.current;
    if (Number.isNaN(target) || Number.isNaN(from)) {
      displayRef.current = target;
      setDisplay(target);
      return;
    }
    if (Math.abs(from - target) < 1e-6) return;

    let cancelled = false;
    let rafId = 0;
    const start = performance.now();

    const tick = (now: number) => {
      if (cancelled) return;
      const t = Math.min(1, (now - start) / durationMs);
      const v = from + (target - from) * easeOutCubic(t);
      displayRef.current = v;
      setDisplay(v);
      if (t < 1) {
        rafId = requestAnimationFrame(tick);
      } else {
        displayRef.current = target;
        setDisplay(target);
      }
    };

    rafId = requestAnimationFrame(tick);
    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
    };
  }, [target, durationMs]);

  return display;
}

