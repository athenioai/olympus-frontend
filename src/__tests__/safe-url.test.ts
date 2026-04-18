import { describe, it, expect } from "vitest";
import { isSafeUrl, safeUrl } from "@/lib/safe-url";

describe("safeUrl", () => {
  it("accepts https URLs", () => {
    expect(safeUrl("https://example.com/page")).toBe("https://example.com/page");
  });

  it("accepts http URLs", () => {
    expect(safeUrl("http://localhost:3000")).toBe("http://localhost:3000/");
  });

  it("accepts relative paths", () => {
    expect(safeUrl("/dashboard")).toBe("/dashboard");
  });

  it("rejects javascript: URLs", () => {
    expect(safeUrl("javascript:alert(1)")).toBeNull();
  });

  it("rejects data: URLs", () => {
    expect(safeUrl("data:text/html,<script>alert(1)</script>")).toBeNull();
  });

  it("rejects vbscript: URLs", () => {
    expect(safeUrl("vbscript:msgbox(1)")).toBeNull();
  });

  it("rejects protocol-relative //evil.com", () => {
    expect(safeUrl("//evil.com/steal")).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(safeUrl("")).toBeNull();
  });

  it("returns null for null/undefined", () => {
    expect(safeUrl(null)).toBeNull();
    expect(safeUrl(undefined)).toBeNull();
  });

  it("trims whitespace", () => {
    expect(safeUrl("  https://example.com  ")).toBe("https://example.com/");
  });
});

describe("isSafeUrl", () => {
  it("true for safe URL", () => {
    expect(isSafeUrl("https://example.com")).toBe(true);
  });

  it("false for dangerous URL", () => {
    expect(isSafeUrl("javascript:alert(1)")).toBe(false);
  });
});
