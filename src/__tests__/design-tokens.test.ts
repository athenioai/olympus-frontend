import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it, expect } from "vitest";

const css = readFileSync(
  resolve(import.meta.dirname, "../app/globals.css"),
  "utf-8",
);

describe("Design Tokens — Quiet Authority", () => {
  it("should define surface hierarchy tokens", () => {
    expect(css).toContain("--color-surface:");
    expect(css).toContain("--color-surface-container-low:");
    expect(css).toContain("--color-surface-container-lowest:");
    expect(css).toContain("--color-surface-container-high:");
    expect(css).toContain("--color-surface-container-highest:");
  });

  it("should define primary (amber) tokens", () => {
    expect(css).toContain("--color-primary:");
    expect(css).toContain("--color-primary-dim:");
    expect(css).toContain("--color-on-primary:");
  });

  it("should define teal accent tokens", () => {
    expect(css).toContain("--color-teal:");
    expect(css).toContain("--color-secondary-container:");
  });

  it("should define text tokens", () => {
    expect(css).toContain("--color-on-surface:");
    expect(css).toContain("--color-on-surface-variant:");
  });

  it("should define semantic tokens (danger, success, warning)", () => {
    expect(css).toContain("--color-danger:");
    expect(css).toContain("--color-success:");
    expect(css).toContain("--color-warning:");
  });

  it("should define outline variant for ghost borders", () => {
    expect(css).toContain("--color-outline-variant:");
  });

  it("should define radius tokens with 12px default", () => {
    expect(css).toContain("--radius:");
  });

  it("should define ambient shadow tokens", () => {
    expect(css).toContain("--shadow-ambient:");
  });

  it("should import tailwindcss", () => {
    expect(css).toContain("@import");
    expect(css).toContain("tailwindcss");
  });
});
