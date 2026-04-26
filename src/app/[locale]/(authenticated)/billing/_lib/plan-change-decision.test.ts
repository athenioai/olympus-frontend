import { describe, it, expect } from "vitest";
import { getPlanChangeAction } from "./plan-change-decision";

describe("getPlanChangeAction", () => {
  it("'current' when costs are equal", () => {
    expect(getPlanChangeAction(797, 797)).toBe("current");
  });
  it("'upgrade' when target is more expensive", () => {
    expect(getPlanChangeAction(797, 1597)).toBe("upgrade");
  });
  it("'downgrade' when target is cheaper", () => {
    expect(getPlanChangeAction(1597, 797)).toBe("downgrade");
  });
});
