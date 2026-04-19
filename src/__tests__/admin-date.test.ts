import { describe, it, expect } from "vitest";
import { endOfDayIsoInSaoPaulo } from "@/app/[locale]/(authenticated)/admin/_lib/date";

describe("endOfDayIsoInSaoPaulo", () => {
  it("anchors due date at end of day local, not UTC midnight", () => {
    // Naive: new Date("2026-04-20").toISOString() → 2026-04-20T00:00:00Z,
    // which is 2026-04-19 21:00 in São Paulo. That's wrong.
    // Our helper returns end-of-day local → 02:59:59.999 UTC on the next day,
    // which in São Paulo is still 2026-04-20 23:59:59.999.
    const iso = endOfDayIsoInSaoPaulo("2026-04-20");
    expect(iso).toBe("2026-04-21T02:59:59.999Z");
  });

  it("handles leap day", () => {
    const iso = endOfDayIsoInSaoPaulo("2028-02-29");
    expect(iso).toBe("2028-03-01T02:59:59.999Z");
  });
});
