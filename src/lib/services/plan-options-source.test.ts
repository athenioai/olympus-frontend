// src/lib/services/plan-options-source.test.ts
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

vi.mock("next/headers", () => ({
  cookies: async () => ({ get: () => ({ value: "fake-jwt" }) }),
}));

vi.mock("@/lib/env", () => ({
  API_URL: "https://api.test",
  IS_PRODUCTION: false,
}));

import { getPlanOptions } from "./plan-options-source";

describe("getPlanOptions", () => {
  let fetchMock: ReturnType<typeof vi.fn>;
  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
  });
  afterEach(() => vi.unstubAllGlobals());

  it("returns the live response when /plans/options succeeds", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          success: true,
          data: [
            { id: "u1", name: "Solo", cost: 697, slug: "solo" },
          ],
          error: null,
          meta: { requestId: "r1" },
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      ),
    );
    const result = await getPlanOptions();
    expect(result).toEqual([
      { id: "u1", name: "Solo", cost: 697, slug: "solo" },
    ]);
  });

  it("falls back to the hardcoded catalog when the endpoint 404s", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          success: false,
          data: null,
          error: { code: "ROUTE_NOT_FOUND_001", message: "" },
          meta: { requestId: "r1" },
        }),
        { status: 404, headers: { "content-type": "application/json" } },
      ),
    );
    const result = await getPlanOptions();
    expect(result.map((p) => p.slug)).toEqual([
      "solo",
      "fundador",
      "essencial",
      "operador",
      "estrategico",
    ]);
    expect(result.every((p) => p.id === null)).toBe(true);
  });
});
