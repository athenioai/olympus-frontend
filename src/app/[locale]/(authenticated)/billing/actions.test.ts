// src/app/[locale]/(authenticated)/billing/actions.test.ts
import { describe, it, expect, beforeEach, vi } from "vitest";

const subscriptionsServiceMock = vi.hoisted(() => ({
  subscribe: vi.fn(),
  upgrade: vi.fn(),
  downgrade: vi.fn(),
  cancel: vi.fn(),
  refundRequest: vi.fn(),
}));

vi.mock("@/lib/services", () => ({
  subscriptionsService: subscriptionsServiceMock,
}));
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  updateTag: vi.fn(),
}));
vi.mock("@/lib/observability/capture", () => ({
  captureUnexpected: vi.fn(),
}));

import { ApiError } from "@/lib/api-envelope";
import {
  cancelSubscription,
  changePlan,
  requestRefund,
  subscribePlan,
} from "./actions";

function fd(entries: Record<string, string>): FormData {
  const f = new FormData();
  for (const [k, v] of Object.entries(entries)) f.append(k, v);
  return f;
}

describe("billing actions", () => {
  beforeEach(() => {
    Object.values(subscriptionsServiceMock).forEach((m) => m.mockReset());
  });

  it("subscribePlan rejects bad UUID", async () => {
    const res = await subscribePlan("not-uuid", "12345678901");
    expect(res.success).toBe(false);
    expect(subscriptionsServiceMock.subscribe).not.toHaveBeenCalled();
  });

  it("subscribePlan rejects empty cpfCnpj", async () => {
    const res = await subscribePlan(
      "11111111-1111-1111-1111-111111111111",
      "",
    );
    expect(res.success).toBe(false);
    expect(res.error).toMatch(/CPF/i);
    expect(subscriptionsServiceMock.subscribe).not.toHaveBeenCalled();
  });

  it("subscribePlan rejects cpfCnpj with wrong digit count", async () => {
    const res = await subscribePlan(
      "11111111-1111-1111-1111-111111111111",
      "123",
    );
    expect(res.success).toBe(false);
    expect(res.error).toMatch(/CPF/i);
    expect(subscriptionsServiceMock.subscribe).not.toHaveBeenCalled();
  });

  it("subscribePlan strips mask and forwards 11-digit CPF", async () => {
    subscriptionsServiceMock.subscribe.mockResolvedValueOnce({
      subscriptionId: "s1",
      asaasInvoiceUrl: "https://asaas/x",
    });
    const res = await subscribePlan(
      "11111111-1111-1111-1111-111111111111",
      "123.456.789-01",
    );
    expect(res.success).toBe(true);
    expect(subscriptionsServiceMock.subscribe).toHaveBeenCalledWith(
      "11111111-1111-1111-1111-111111111111",
      "12345678901",
    );
  });

  it("subscribePlan accepts unmasked 14-digit CNPJ", async () => {
    subscriptionsServiceMock.subscribe.mockResolvedValueOnce({
      subscriptionId: "s1",
      asaasInvoiceUrl: "https://asaas/x",
    });
    await subscribePlan(
      "11111111-1111-1111-1111-111111111111",
      "12345678000190",
    );
    expect(subscriptionsServiceMock.subscribe).toHaveBeenCalledWith(
      "11111111-1111-1111-1111-111111111111",
      "12345678000190",
    );
  });

  it("subscribePlan returns asaasInvoiceUrl on success", async () => {
    subscriptionsServiceMock.subscribe.mockResolvedValueOnce({
      subscriptionId: "s1",
      asaasInvoiceUrl: "https://asaas/x",
    });
    const res = await subscribePlan(
      "11111111-1111-1111-1111-111111111111",
      "12345678901",
    );
    expect(res).toMatchObject({
      success: true,
      data: { asaasInvoiceUrl: "https://asaas/x" },
    });
  });

  it("subscribePlan maps SUB_ACTIVE_001 to friendly Portuguese", async () => {
    subscriptionsServiceMock.subscribe.mockRejectedValueOnce(
      new ApiError("active", "SUB_ACTIVE_001", 409),
    );
    const res = await subscribePlan(
      "11111111-1111-1111-1111-111111111111",
      "12345678901",
    );
    expect(res).toEqual({
      success: false,
      error: "Você já possui uma assinatura ativa.",
    });
  });

  it("changePlan(upgrade) calls upgrade endpoint", async () => {
    subscriptionsServiceMock.upgrade.mockResolvedValueOnce({ ok: true });
    await changePlan("upgrade", "11111111-1111-1111-1111-111111111111");
    expect(subscriptionsServiceMock.upgrade).toHaveBeenCalledWith(
      "11111111-1111-1111-1111-111111111111",
    );
  });

  it("changePlan(downgrade) calls downgrade endpoint", async () => {
    subscriptionsServiceMock.downgrade.mockResolvedValueOnce({ ok: true });
    await changePlan("downgrade", "11111111-1111-1111-1111-111111111111");
    expect(subscriptionsServiceMock.downgrade).toHaveBeenCalled();
  });

  it("cancelSubscription forwards optional reason", async () => {
    subscriptionsServiceMock.cancel.mockResolvedValueOnce({ ok: true });
    await cancelSubscription(fd({ reason: "teste" }));
    expect(subscriptionsServiceMock.cancel).toHaveBeenCalledWith("teste");
  });

  it("cancelSubscription with empty reason calls without arg", async () => {
    subscriptionsServiceMock.cancel.mockResolvedValueOnce({ ok: true });
    await cancelSubscription(fd({}));
    expect(subscriptionsServiceMock.cancel).toHaveBeenCalledWith(undefined);
  });

  it("requestRefund rejects reason shorter than 10 chars", async () => {
    const res = await requestRefund(fd({ reason: "curto" }));
    expect(res.success).toBe(false);
    expect(subscriptionsServiceMock.refundRequest).not.toHaveBeenCalled();
  });

  it("requestRefund maps REFUND_WINDOW_EXPIRED_001", async () => {
    subscriptionsServiceMock.refundRequest.mockRejectedValueOnce(
      new ApiError("expired", "REFUND_WINDOW_EXPIRED_001", 410),
    );
    const res = await requestRefund(fd({ reason: "motivo bem completo aqui" }));
    expect(res.error).toMatch(/15 dias/);
  });
});
