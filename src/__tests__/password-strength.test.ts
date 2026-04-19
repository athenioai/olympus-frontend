import { describe, it, expect } from "vitest";
import {
  meetsBackendPolicy,
  scorePasswordStrength,
} from "@/lib/auth/password-strength";

describe("scorePasswordStrength", () => {
  it("rates short passwords as weak", () => {
    expect(scorePasswordStrength("ab12")).toBe("weak");
  });

  it("rates letters-only as weak even when long", () => {
    expect(scorePasswordStrength("abcdefghij")).toBe("weak");
  });

  it("rates numbers-only as weak even when long", () => {
    expect(scorePasswordStrength("1234567890")).toBe("weak");
  });

  it("rates 8-char letter+number as medium", () => {
    expect(scorePasswordStrength("abcd1234")).toBe("medium");
  });

  it("rates 12+ char letter+number as strong", () => {
    expect(scorePasswordStrength("abcdefghij12")).toBe("strong");
  });

  it("rates letter+number+symbol as strong", () => {
    expect(scorePasswordStrength("abcd1234!")).toBe("strong");
  });
});

describe("meetsBackendPolicy", () => {
  it("rejects passwords shorter than 8 chars", () => {
    expect(meetsBackendPolicy("ab12")).toBe(false);
  });

  it("rejects passwords without letters", () => {
    expect(meetsBackendPolicy("12345678")).toBe(false);
  });

  it("rejects passwords without numbers", () => {
    expect(meetsBackendPolicy("abcdefgh")).toBe(false);
  });

  it("accepts 8+ char mixed passwords", () => {
    expect(meetsBackendPolicy("abcd1234")).toBe(true);
  });
});
