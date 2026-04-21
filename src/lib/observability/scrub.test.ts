import { describe, expect, it } from "vitest";
import { scrubString, scrubValue } from "./scrub";

describe("scrubString", () => {
  it("redacts email addresses", () => {
    expect(scrubString("contact admin@athenio.ai now")).toBe(
      "contact [REDACTED_EMAIL] now",
    );
  });

  it("redacts JWT bearer tokens", () => {
    const jwt =
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhYmMiLCJpYXQiOjE1MTYyMzkwMjJ9.abc_DEF-123";
    expect(scrubString(`Authorization: Bearer ${jwt}`)).toBe(
      "Authorization: Bearer [REDACTED]",
    );
  });

  it("redacts raw JWTs without bearer prefix", () => {
    const jwt =
      "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJhYmMifQ.signature_part_here";
    expect(scrubString(jwt)).toBe("[REDACTED_JWT]");
  });

  it("redacts masked CPF", () => {
    expect(scrubString("CPF 123.456.789-00")).toBe("CPF [REDACTED_CPF]");
  });

  it("redacts bare 11-digit CPF", () => {
    expect(scrubString("user 12345678901 is")).toBe("user [REDACTED_ID] is");
  });

  it("redacts Brazilian phone numbers", () => {
    expect(scrubString("call (11) 98765-4321 today")).toBe(
      "call [REDACTED_PHONE] today",
    );
  });

  it("does not touch harmless text", () => {
    expect(scrubString("lead created successfully")).toBe(
      "lead created successfully",
    );
  });
});

describe("scrubValue", () => {
  it("leaves primitives untouched", () => {
    expect(scrubValue(42)).toBe(42);
    expect(scrubValue(true)).toBe(true);
    expect(scrubValue(null)).toBe(null);
  });

  it("recursively scrubs objects and arrays", () => {
    const input = {
      level: "info",
      user: { email: "foo@bar.com", id: "123.456.789-00" },
      tags: ["ok", "reach me at a@b.co"],
    };
    expect(scrubValue(input)).toEqual({
      level: "info",
      user: { email: "[REDACTED_EMAIL]", id: "[REDACTED_CPF]" },
      tags: ["ok", "reach me at [REDACTED_EMAIL]"],
    });
  });
});
