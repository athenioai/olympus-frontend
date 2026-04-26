import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

vi.mock("next/headers", () => ({
  cookies: async () => ({ get: () => ({ value: "fake-jwt" }) }),
}));

vi.mock("@/lib/env", () => ({
  API_URL: "https://api.test",
  IS_PRODUCTION: false,
}));

import { adsService } from "./ads-service";

const successEnvelope = (data: unknown) =>
  new Response(
    JSON.stringify({
      success: true,
      data,
      error: null,
      meta: { requestId: "r1" },
    }),
    { status: 200, headers: { "content-type": "application/json" } },
  );

describe("adsService", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("listAds builds /ads with pagination + search and unwraps the array", async () => {
    fetchMock.mockResolvedValueOnce(successEnvelope([]));
    const result = await adsService.listAds({ page: 2, limit: 10, search: "promo" });
    const [url] = fetchMock.mock.calls[0];
    expect(String(url)).toBe(
      "https://api.test/ads?page=2&limit=10&search=promo",
    );
    expect(result).toEqual([]);
  });

  it("createAd serializes JSON body with items", async () => {
    fetchMock.mockResolvedValueOnce(
      successEnvelope({
        id: "a1",
        name: "Promo",
        content: "30% off",
        active: true,
        platform: "instagram",
        items: [],
        validFrom: null,
        validTo: null,
        createdAt: "2026-04-25T00:00:00Z",
        updatedAt: "2026-04-25T00:00:00Z",
      }),
    );
    await adsService.createAd({
      name: "Promo",
      content: "30% off",
      platform: "instagram",
      items: [{ type: "service", id: "uuid-1" }],
    });
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toBe("https://api.test/ads");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body)).toEqual({
      name: "Promo",
      content: "30% off",
      platform: "instagram",
      items: [{ type: "service", id: "uuid-1" }],
    });
  });

  it("updateAd omits `items` when payload field is absent", async () => {
    fetchMock.mockResolvedValueOnce(
      successEnvelope({
        id: "a1", name: "x", content: "x", active: true, platform: "instagram",
        items: [], validFrom: null, validTo: null,
        createdAt: "2026-04-25T00:00:00Z", updatedAt: "2026-04-25T00:00:00Z",
      }),
    );
    await adsService.updateAd("a1", { name: "Renamed" });
    const [, init] = fetchMock.mock.calls[0];
    expect(JSON.parse(init.body)).toEqual({ name: "Renamed" });
  });

  it("updateAd sends `items: []` when explicitly clearing", async () => {
    fetchMock.mockResolvedValueOnce(
      successEnvelope({
        id: "a1", name: "x", content: "x", active: true, platform: "instagram",
        items: [], validFrom: null, validTo: null,
        createdAt: "2026-04-25T00:00:00Z", updatedAt: "2026-04-25T00:00:00Z",
      }),
    );
    await adsService.updateAd("a1", { items: [] });
    const [, init] = fetchMock.mock.calls[0];
    expect(JSON.parse(init.body)).toEqual({ items: [] });
  });
});
