import { describe, it, expect } from "vitest";
import {
  formatBRL,
  formatDate,
  formatDateTime,
} from "@/app/[locale]/(authenticated)/admin/_lib/format";

describe("formatBRL", () => {
  it("formats an integer as BRL with two decimals", () => {
    expect(formatBRL(149)).toContain("149,00");
  });

  it("formats a decimal preserving both places", () => {
    expect(formatBRL(149.9)).toContain("149,90");
  });

  it("formats zero", () => {
    expect(formatBRL(0)).toContain("0,00");
  });
});

describe("formatDate", () => {
  it("returns em-dash for null input", () => {
    expect(formatDate(null)).toBe("—");
  });

  it("returns em-dash for undefined input", () => {
    expect(formatDate(undefined)).toBe("—");
  });

  it("formats an ISO string as dd/mm/yyyy", () => {
    const formatted = formatDate("2026-04-17T14:30:00.000Z");
    expect(formatted).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
  });

  it("returns em-dash for an invalid date string", () => {
    expect(formatDate("not-a-date")).toBe("—");
  });
});

describe("formatDateTime", () => {
  it("returns em-dash for null input", () => {
    expect(formatDateTime(null)).toBe("—");
  });

  it("formats an ISO string with time", () => {
    const formatted = formatDateTime("2026-04-17T14:30:00.000Z");
    expect(formatted).toMatch(/\d{2}\/\d{2}\/\d{4}.*\d{2}:\d{2}/);
  });
});
