const SAO_PAULO_OFFSET_MINUTES = -3 * 60;

/**
 * Convert a YYYY-MM-DD string from <input type="date"> into an ISO string
 * anchored at end-of-day in America/Sao_Paulo.
 *
 * Why: `new Date("2026-04-20").toISOString()` parses as UTC midnight,
 * which in São Paulo (UTC-3) is already 2026-04-19 21:00 local. An
 * invoice "due on the 20th" would be flagged overdue on the 20th instead
 * of the 21st. End-of-day 23:59:59 keeps the selected day the due day.
 *
 * @param yyyyMmDd - e.g. "2026-04-20"
 * @returns ISO string like "2026-04-21T02:59:59.999Z"
 */
export function endOfDayIsoInSaoPaulo(yyyyMmDd: string): string {
  const [year, month, day] = yyyyMmDd.split("-").map(Number);
  if (!year || !month || !day) {
    return new Date(yyyyMmDd).toISOString();
  }
  // Midnight in São Paulo (UTC-3) = 03:00 UTC. End of day = 23:59:59.999 local = 02:59:59.999 UTC next day.
  const utcMs = Date.UTC(year, month - 1, day, 23, 59, 59, 999);
  const shifted = utcMs - SAO_PAULO_OFFSET_MINUTES * 60 * 1000;
  return new Date(shifted).toISOString();
}
