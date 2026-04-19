"use client";

import { useEffect, useState } from "react";

/**
 * Returns a `Date` that ticks once per second.
 * Used by the editorial bulletin masthead to render a live clock.
 */
export function useTicker(): Date {
  const [now, setNow] = useState<Date>(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  return now;
}
