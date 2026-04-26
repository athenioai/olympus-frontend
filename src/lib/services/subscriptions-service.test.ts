// src/lib/services/subscriptions-service.test.ts
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

vi.mock("next/headers", () => ({
  cookies: async () => ({ get: () => ({ value: "fake-jwt" }) }),
}));

vi.mock("@/lib/env", () => ({
  API_URL: "https://api.test",
  IS_PRODUCTION: false,
}));

import { subscriptionsService } from "./subscriptions-service";

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

const errorEnvelope = (status: number, code: string) =>
  new Response(
    JSON.stringify({
      success: false,
      data: null,
      error: { code, message: code },
      meta: { requestId: "r1" },
    }),
    { status, headers: { "content-type": "application/json" } },
  );

describe("subscriptionsService", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("getMe hits /subscriptions/me and unwraps the envelope", async () => {
    fetchMock.mockResolvedValueOnce(
      successEnvelope({
        subscriptionId: "s1",
        plan: { id: "p1", name: "Fundador", cost: 797 },
        status: "active",
        currentPeriodEnd: "2026-05-25T00:00:00Z",
        nextPaymentAt: "2026-05-22T00:00:00Z",
        refundEligibleUntil: "2026-05-10T00:00:00Z",
        pendingChange: null,
        cancelAtPeriodEnd: false,
      }),
    );
    const result = await subscriptionsService.getMe();
    const [url] = fetchMock.mock.calls[0];
    expect(String(url)).toBe("https://api.test/subscriptions/me");
    expect(result.plan.name).toBe("Fundador");
  });

  it("getMe propagates SUB_NOT_FOUND_001 as ApiError(404)", async () => {
    fetchMock.mockResolvedValueOnce(errorEnvelope(404, "SUB_NOT_FOUND_001"));
    await expect(subscriptionsService.getMe()).rejects.toMatchObject({
      code: "SUB_NOT_FOUND_001",
      status: 404,
    });
  });

  it("subscribe POSTs planId and returns asaasInvoiceUrl", async () => {
    fetchMock.mockResolvedValueOnce(
      successEnvelope({
        subscriptionId: "s1",
        asaasInvoiceUrl: "https://asaas/invoice/abc",
      }),
    );
    const result = await subscriptionsService.subscribe("p1");
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toBe("https://api.test/subscriptions/subscribe");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body)).toEqual({ planId: "p1" });
    expect(result.asaasInvoiceUrl).toBe("https://asaas/invoice/abc");
  });

  it("upgrade and downgrade POST to dedicated endpoints", async () => {
    fetchMock.mockResolvedValueOnce(successEnvelope({ ok: true }));
    await subscriptionsService.upgrade("p2");
    expect(String(fetchMock.mock.calls[0][0])).toBe(
      "https://api.test/subscriptions/upgrade",
    );

    fetchMock.mockResolvedValueOnce(successEnvelope({ ok: true }));
    await subscriptionsService.downgrade("p3");
    expect(String(fetchMock.mock.calls[1][0])).toBe(
      "https://api.test/subscriptions/downgrade",
    );
  });

  it("cancel sends optional reason", async () => {
    fetchMock.mockResolvedValueOnce(successEnvelope({ ok: true }));
    await subscriptionsService.cancel("teste");
    const [, init] = fetchMock.mock.calls[0];
    expect(JSON.parse(init.body)).toEqual({ reason: "teste" });
  });

  it("cancel without reason omits the field", async () => {
    fetchMock.mockResolvedValueOnce(successEnvelope({ ok: true }));
    await subscriptionsService.cancel();
    const [, init] = fetchMock.mock.calls[0];
    expect(JSON.parse(init.body)).toEqual({});
  });

  it("refundRequest sends required reason", async () => {
    fetchMock.mockResolvedValueOnce(successEnvelope({ ok: true }));
    await subscriptionsService.refundRequest("Não consegui usar");
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toBe(
      "https://api.test/subscriptions/refund-request",
    );
    expect(JSON.parse(init.body)).toEqual({ reason: "Não consegui usar" });
  });

  it("listMyPayments returns the array directly", async () => {
    fetchMock.mockResolvedValueOnce(
      successEnvelope([
        {
          id: "pay1",
          amount: 797,
          status: "confirmed",
          dueDate: "2026-04-28",
          paidAt: "2026-04-27T10:00:00Z",
          refundedAt: null,
          invoiceUrl: "https://invoice/x",
        },
      ]),
    );
    const result = await subscriptionsService.listMyPayments();
    expect(result).toHaveLength(1);
    expect(result[0].status).toBe("confirmed");
  });
});
