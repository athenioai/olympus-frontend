import { describe, it, expect } from "vitest";
import type { BusinessProfile } from "@/lib/services";
import { resolveCurrentStep } from "@/app/[locale]/onboarding/[slug]/_lib/resume-heuristic";

function buildProfile(overrides: Partial<BusinessProfile> = {}): BusinessProfile {
  return {
    userId: "user-1",
    businessName: "Acme",
    businessDescription: "A business",
    workType: "services",
    serviceModality: "presencial",
    paymentPolicy: "Accept pix",
    cancellationPolicy: "Up to 24h",
    differentials: null,
    cnpj: null,
    legalName: null,
    foundedYear: null,
    businessVertical: "barbearia",
    createdAt: "2026-04-17T00:00:00Z",
    updatedAt: "2026-04-17T00:00:00Z",
    ...overrides,
  };
}

describe("resolveCurrentStep", () => {
  it("returns step 2 when profile does not exist yet", () => {
    expect(resolveCurrentStep(null)).toBe(2);
  });

  it("returns step 3 when businessName is empty", () => {
    const profile = buildProfile({ businessName: "" });
    expect(resolveCurrentStep(profile)).toBe(3);
  });

  it("returns step 3 when businessDescription is empty", () => {
    const profile = buildProfile({ businessDescription: "" });
    expect(resolveCurrentStep(profile)).toBe(3);
  });

  it("returns step 4 when businessVertical is not set", () => {
    const profile = buildProfile({ businessVertical: null });
    expect(resolveCurrentStep(profile)).toBe(4);
  });

  it("returns step 5 when serviceModality is empty", () => {
    const profile = buildProfile({
      serviceModality: "" as BusinessProfile["serviceModality"],
    });
    expect(resolveCurrentStep(profile)).toBe(5);
  });

  it("returns step 6 when paymentPolicy is empty", () => {
    const profile = buildProfile({ paymentPolicy: "" });
    expect(resolveCurrentStep(profile)).toBe(6);
  });

  it("returns step 6 when cancellationPolicy is empty", () => {
    const profile = buildProfile({ cancellationPolicy: "" });
    expect(resolveCurrentStep(profile)).toBe(6);
  });

  it("returns step 7 when all required fields are filled", () => {
    const profile = buildProfile();
    expect(resolveCurrentStep(profile)).toBe(7);
  });
});
