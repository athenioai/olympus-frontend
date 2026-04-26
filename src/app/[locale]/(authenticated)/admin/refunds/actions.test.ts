import { describe, it, expect, beforeEach, vi } from "vitest";

const adminRefundsServiceMock = vi.hoisted(() => ({
  approve: vi.fn(),
  reject: vi.fn(),
}));

vi.mock("@/lib/services", () => ({
  adminRefundsService: adminRefundsServiceMock,
}));
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  updateTag: vi.fn(),
}));
vi.mock("@/lib/observability/capture", () => ({
  captureUnexpected: vi.fn(),
}));
vi.mock("@/lib/auth/require-admin", () => ({
  requireAdmin: vi.fn().mockResolvedValue({ ok: true, user: { role: "admin" } }),
}));

import { ApiError } from "@/lib/api-envelope";
import { approveRefund, rejectRefund } from "./actions";

function fd(entries: Record<string, string>): FormData {
  const f = new FormData();
  for (const [k, v] of Object.entries(entries)) f.append(k, v);
  return f;
}

describe("admin refunds actions", () => {
  beforeEach(() => {
    Object.values(adminRefundsServiceMock).forEach((m) => m.mockReset());
  });

  it("approveRefund forwards optional notes", async () => {
    adminRefundsServiceMock.approve.mockResolvedValueOnce({});
    await approveRefund(
      "11111111-1111-1111-1111-111111111111",
      fd({ notes: "ok" }),
    );
    expect(adminRefundsServiceMock.approve).toHaveBeenCalledWith(
      "11111111-1111-1111-1111-111111111111",
      "ok",
    );
  });

  it("rejectRefund rejects empty notes", async () => {
    const res = await rejectRefund(
      "11111111-1111-1111-1111-111111111111",
      fd({ notes: "" }),
    );
    expect(res.success).toBe(false);
    expect(adminRefundsServiceMock.reject).not.toHaveBeenCalled();
  });

  it("approve maps REFUND_REQUEST_PENDING_001 to friendly message", async () => {
    adminRefundsServiceMock.approve.mockRejectedValueOnce(
      new ApiError("p", "REFUND_REQUEST_PENDING_001", 409),
    );
    const res = await approveRefund(
      "11111111-1111-1111-1111-111111111111",
      fd({}),
    );
    expect(res.error).toMatch(/pendente/);
  });
});
