"use client";

import { useEffect, useState } from "react";

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

/**
 * Animates a numeric value from 0 to `target` using an ease-out cubic curve.
 * Returns the current frame value; safe to call from React render.
 *
 * Honors `prefers-reduced-motion`: when enabled, jumps straight to `target`
 * with no animation.
 */
export function useCountUp(
  target: number,
  duration = 1600,
  delay = 0,
): number {
  const [value, setValue] = useState(() =>
    prefersReducedMotion() ? target : 0,
  );

  useEffect(() => {
    if (prefersReducedMotion()) {
      setValue(target);
      return;
    }

    let raf = 0;
    const t0 = performance.now() + delay;

    const tick = (now: number) => {
      if (now < t0) {
        raf = requestAnimationFrame(tick);
        return;
      }
      const progress = Math.min(1, (now - t0) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(target * eased);
      if (progress < 1) {
        raf = requestAnimationFrame(tick);
      }
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration, delay]);

  return value;
}
