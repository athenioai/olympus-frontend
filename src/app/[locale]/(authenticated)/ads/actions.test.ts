import { describe, it, expect, beforeEach, vi } from "vitest";

const { adsServiceMock } = vi.hoisted(() => ({
  adsServiceMock: {
    createAd: vi.fn(),
    updateAd: vi.fn(),
    deleteAd: vi.fn(),
  },
}));

vi.mock("@/lib/services", () => ({ adsService: adsServiceMock }));
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  updateTag: vi.fn(),
}));
vi.mock("@/lib/observability/capture", () => ({
  captureUnexpected: vi.fn(),
}));

import { ApiError } from "@/lib/api-envelope";
import { createAd, updateAd } from "./actions";

function buildFormData(entries: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(entries)) fd.append(k, v);
  return fd;
}

describe("ads actions — createAd validation", () => {
  beforeEach(() => {
    Object.values(adsServiceMock).forEach((m) => m.mockReset());
  });

  it("rejects empty name with friendly Portuguese message", async () => {
    const fd = buildFormData({
      name: "",
      content: "ok",
      platform: "instagram",
      items: "[]",
    });
    const res = await createAd(fd);
    expect(res).toMatchObject({
      success: false,
      error: expect.stringContaining("Nome"),
    });
    expect(adsServiceMock.createAd).not.toHaveBeenCalled();
  });

  it("rejects more than 50 items", async () => {
    const items = Array.from({ length: 51 }, (_, i) => ({
      type: "service" as const,
      id: `00000000-0000-0000-0000-${String(i).padStart(12, "0")}`,
    }));
    const fd = buildFormData({
      name: "Promo",
      content: "ok",
      platform: "instagram",
      items: JSON.stringify(items),
    });
    const res = await createAd(fd);
    expect(res.success).toBe(false);
    expect(res.error).toMatch(/50/);
    expect(adsServiceMock.createAd).not.toHaveBeenCalled();
  });

  it("forwards parsed items to adsService.createAd", async () => {
    adsServiceMock.createAd.mockResolvedValueOnce({
      id: "a1",
      name: "Promo",
      content: "ok",
      active: true,
      platform: "instagram",
      items: [],
      validFrom: null,
      validTo: null,
      createdAt: "2026-04-25T00:00:00Z",
      updatedAt: "2026-04-25T00:00:00Z",
    });
    const fd = buildFormData({
      name: "Promo",
      content: "ok",
      platform: "instagram",
      items: JSON.stringify([
        { type: "service", id: "11111111-1111-1111-1111-111111111111" },
      ]),
    });
    const res = await createAd(fd);
    expect(res.success).toBe(true);
    expect(adsServiceMock.createAd).toHaveBeenCalledWith(
      expect.objectContaining({
        items: [
          { type: "service", id: "11111111-1111-1111-1111-111111111111" },
        ],
      }),
    );
  });

  it("maps AD_ITEM_NOT_FOUND_001 to friendly message", async () => {
    adsServiceMock.createAd.mockRejectedValueOnce(
      new ApiError("not found", "AD_ITEM_NOT_FOUND_001", 404),
    );
    const fd = buildFormData({
      name: "Promo",
      content: "ok",
      platform: "instagram",
      items: JSON.stringify([
        { type: "service", id: "11111111-1111-1111-1111-111111111111" },
      ]),
    });
    const res = await createAd(fd);
    expect(res).toEqual({
      success: false,
      error: "Item não encontrado ou não pertence à sua conta.",
    });
  });
});

describe("ads actions — updateAd replace-strategy", () => {
  beforeEach(() => {
    Object.values(adsServiceMock).forEach((m) => m.mockReset());
    adsServiceMock.updateAd.mockResolvedValue({
      id: "a1",
      name: "x",
      content: "x",
      active: true,
      platform: "instagram",
      items: [],
      validFrom: null,
      validTo: null,
      createdAt: "2026-04-25T00:00:00Z",
      updatedAt: "2026-04-25T00:00:00Z",
    });
  });

  it("omits items from payload when itemsState=preserve", async () => {
    const fd = buildFormData({
      name: "Renamed",
      content: "ok",
      platform: "instagram",
      itemsState: "preserve",
    });
    await updateAd("11111111-1111-1111-1111-111111111111", fd);
    const [, payload] = adsServiceMock.updateAd.mock.calls[0];
    expect("items" in payload).toBe(false);
  });

  it("sends items: [] when itemsState=replace and items=[]", async () => {
    const fd = buildFormData({
      name: "Renamed",
      content: "ok",
      platform: "instagram",
      itemsState: "replace",
      items: "[]",
    });
    await updateAd("11111111-1111-1111-1111-111111111111", fd);
    const [, payload] = adsServiceMock.updateAd.mock.calls[0];
    expect(payload.items).toEqual([]);
  });

  it("sends parsed items array when itemsState=replace with refs", async () => {
    const fd = buildFormData({
      name: "Renamed",
      content: "ok",
      platform: "instagram",
      itemsState: "replace",
      items: JSON.stringify([
        { type: "product", id: "22222222-2222-2222-2222-222222222222" },
      ]),
    });
    await updateAd("11111111-1111-1111-1111-111111111111", fd);
    const [, payload] = adsServiceMock.updateAd.mock.calls[0];
    expect(payload.items).toEqual([
      { type: "product", id: "22222222-2222-2222-2222-222222222222" },
    ]);
  });
});
