import { describe, it, expect } from "vitest";
import { isWithinRefundWindow } from "./refund-window";

describe("isWithinRefundWindow", () => {
  it("returns true when now is before refundEligibleUntil", () => {
    expect(
      isWithinRefundWindow("2026-05-10T00:00:00Z", new Date("2026-05-09T23:59:00Z")),
    ).toBe(true);
  });
  it("returns true at exact boundary", () => {
    expect(
      isWithinRefundWindow("2026-05-10T00:00:00Z", new Date("2026-05-10T00:00:00Z")),
    ).toBe(true);
  });
  it("returns false after the window closes", () => {
    expect(
      isWithinRefundWindow("2026-05-10T00:00:00Z", new Date("2026-05-10T00:00:01Z")),
    ).toBe(false);
  });
  it("returns false when the input is malformed", () => {
    expect(isWithinRefundWindow("not-a-date", new Date())).toBe(false);
  });
});
