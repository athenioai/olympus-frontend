"use client";

export type DayPart = "night" | "morning" | "afternoon" | "evening";
export type WindowUnit = "shortDay" | "shortHalfDay" | "fullDay";

export interface BulletinContext {
  readonly daypart: DayPart;
  readonly unit: WindowUnit;
  readonly people: number;
  readonly revenue: number;
  readonly appts: number;
  readonly collected: number;
  readonly response: number;
}

/**
 * Returns time-aware bucket + mocked counters for the editorial bulletin.
 * Buckets the day into 4 windows. Returns enum keys (not translated text)
 * so the component can resolve copy via i18n.
 *
 * TODO(backend): replace counters with real "platform pulse" query results.
 */
export function useBulletinContext(now: Date): BulletinContext {
  const hour = now.getHours();

  if (hour < 6) {
    return {
      daypart: "night",
      unit: "shortDay",
      people: 312,
      revenue: 14200,
      appts: 47,
      collected: 2840,
      response: 38,
    };
  }
  if (hour < 12) {
    return {
      daypart: "morning",
      unit: "shortHalfDay",
      people: 186,
      revenue: 8640,
      appts: 29,
      collected: 1920,
      response: 41,
    };
  }
  if (hour < 18) {
    return {
      daypart: "afternoon",
      unit: "shortHalfDay",
      people: 224,
      revenue: 11430,
      appts: 38,
      collected: 2210,
      response: 44,
    };
  }
  return {
    daypart: "evening",
    unit: "fullDay",
    people: 647,
    revenue: 32810,
    appts: 94,
    collected: 5180,
    response: 42,
  };
}
