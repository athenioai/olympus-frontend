import { describe, expect, it } from "vitest";
import { avatarColorFromId, initialsOf } from "@/lib/avatar";

describe("initialsOf", () => {
  it("returns '?' for empty or whitespace-only names", () => {
    expect(initialsOf("")).toBe("?");
    expect(initialsOf("   ")).toBe("?");
  });

  it("returns first two letters of a single-word name", () => {
    expect(initialsOf("Luna")).toBe("LU");
    expect(initialsOf("ana")).toBe("AN");
  });

  it("uses first letter of first and last words for multi-word names", () => {
    expect(initialsOf("Lucas Couto")).toBe("LC");
    expect(initialsOf("Maria da Silva")).toBe("MS");
    expect(initialsOf("  João da Silva ")).toBe("JS");
  });

  it("uppercases lowercase input", () => {
    expect(initialsOf("lucas couto")).toBe("LC");
  });
});

describe("avatarColorFromId", () => {
  it("returns the same color for the same id across calls", () => {
    const id = "9bd8656e-447a-4e25-8e94-e8d18f984967";
    expect(avatarColorFromId(id)).toBe(avatarColorFromId(id));
  });

  it("returns a hex color string from the palette", () => {
    const color = avatarColorFromId("any-id");
    expect(color).toMatch(/^#[0-9a-f]{6}$/i);
  });

  it("spreads different ids across the palette", () => {
    const colors = new Set<string>();
    for (let i = 0; i < 50; i++) {
      colors.add(avatarColorFromId(`lead-${i}`));
    }
    // With 50 ids and 8 colors, we expect most palette slots to be hit.
    expect(colors.size).toBeGreaterThanOrEqual(5);
  });
});
