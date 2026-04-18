import { describe, expect, it } from "vitest";
import { truncate } from "@/lib/truncate";

describe("truncate", () => {
  it("returns the original string when shorter than max", () => {
    expect(truncate("short", 10)).toBe("short");
    expect(truncate("exact", 5)).toBe("exact");
  });

  it("cuts and appends ellipsis when longer than max", () => {
    expect(truncate("hello world", 5)).toBe("hello…");
  });

  it("trims trailing whitespace before ellipsis", () => {
    expect(truncate("hello      world", 7)).toBe("hello…");
  });

  it("handles empty input", () => {
    expect(truncate("", 5)).toBe("");
  });
});
