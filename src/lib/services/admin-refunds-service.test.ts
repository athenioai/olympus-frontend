// src/lib/services/admin-refunds-service.test.ts
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

vi.mock("next/headers", () => ({
  cookies: async () => ({ get: () => ({ value: "fake-jwt" }) }),
}));

vi.mock("@/lib/env", () => ({
  API_URL: "https://api.test",
  IS_PRODUCTION: false,
}));

import { adminRefundsService } from "./admin-refunds-service";

const successEnvelope = (data: unknown) =>
  new Response(
    JSON.stringify({
      success: true, data, error: null, meta: { requestId: "r1" },
    }),
    { status: 200, headers: { "content-type": "application/json" } },
  );

describe("adminRefundsService", () => {
  let fetchMock: ReturnType<typeof vi.fn>;
  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
  });
  afterEach(() => vi.unstubAllGlobals());

  it("list builds /admin/refunds with status filter", async () => {
    fetchMock.mockResolvedValueOnce(successEnvelope([]));
    await adminRefundsService.list({ status: "pending" });
    expect(String(fetchMock.mock.calls[0][0])).toBe(
      "https://api.test/admin/refunds?status=pending",
    );
  });

  it("approve sends optional notes", async () => {
    fetchMock.mockResolvedValueOnce(successEnvelope({ ok: true }));
    await adminRefundsService.approve("rid1", "tudo certo");
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toBe("https://api.test/admin/refunds/rid1/approve");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body)).toEqual({ notes: "tudo certo" });
  });

  it("approve without notes sends empty body", async () => {
    fetchMock.mockResolvedValueOnce(successEnvelope({ ok: true }));
    await adminRefundsService.approve("rid1");
    const [, init] = fetchMock.mock.calls[0];
    expect(JSON.parse(init.body)).toEqual({});
  });

  it("reject requires notes (sent verbatim)", async () => {
    fetchMock.mockResolvedValueOnce(successEnvelope({ ok: true }));
    await adminRefundsService.reject("rid1", "fora da política");
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toBe("https://api.test/admin/refunds/rid1/reject");
    expect(JSON.parse(init.body)).toEqual({ notes: "fora da política" });
  });
});
