"use client";

export interface BulletinContext {
  readonly label: string;
  readonly window: string;
  readonly unit: string;
  readonly people: number;
  readonly revenue: number;
  readonly appts: number;
  readonly collected: number;
  readonly response: number;
}

/**
 * Returns time-aware copy + mocked counters for the editorial bulletin.
 * Buckets the day into 4 windows (madrugada, manhã, tarde, fim de dia).
 *
 * TODO(backend): replace counters with real "platform pulse" query results.
 */
export function useBulletinContext(now: Date): BulletinContext {
  const hour = now.getHours();

  if (hour < 6) {
    return {
      label: "Boletim da madrugada",
      window: "enquanto você dormiu",
      unit: "últimas 8h",
      people: 312,
      revenue: 14200,
      appts: 47,
      collected: 2840,
      response: 38,
    };
  }
  if (hour < 12) {
    return {
      label: "Boletim matutino",
      window: "desde que o dia começou",
      unit: "últimas 4h",
      people: 186,
      revenue: 8640,
      appts: 29,
      collected: 1920,
      response: 41,
    };
  }
  if (hour < 18) {
    return {
      label: "Boletim da tarde",
      window: "nas últimas 4 horas",
      unit: "últimas 4h",
      people: 224,
      revenue: 11430,
      appts: 38,
      collected: 2210,
      response: 44,
    };
  }
  return {
    label: "Boletim do fim de dia",
    window: "ao longo de hoje",
    unit: "24h",
    people: 647,
    revenue: 32810,
    appts: 94,
    collected: 5180,
    response: 42,
  };
}
