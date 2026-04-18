import { describe, expect, it } from "vitest";
import {
  formatCustomFieldValue,
  pickRenderableFields,
} from "@/lib/custom-field";
import type { LeadCustomFieldValue } from "@/lib/services/interfaces/lead-service";

function field(overrides: Partial<LeadCustomFieldValue>): LeadCustomFieldValue {
  return {
    fieldId: "f1",
    name: "Campo",
    fieldType: "text",
    value: null,
    ...overrides,
  };
}

describe("formatCustomFieldValue", () => {
  it("returns null for null or empty value", () => {
    expect(formatCustomFieldValue(field({ value: null }))).toBeNull();
    expect(formatCustomFieldValue(field({ value: "" }))).toBeNull();
  });

  it("formats date ISO to DD/MM/YYYY", () => {
    expect(
      formatCustomFieldValue(field({ fieldType: "date", value: "2026-04-17" })),
    ).toBe("17/04/2026");
    expect(
      formatCustomFieldValue(
        field({ fieldType: "date", value: "2026-04-17T14:30:00Z" }),
      ),
    ).toBe("17/04/2026");
  });

  it("returns null for invalid date format", () => {
    expect(
      formatCustomFieldValue(field({ fieldType: "date", value: "17-04-2026" })),
    ).toBeNull();
  });

  it("maps boolean 'true'/'false' to 'Sim'/'Não'", () => {
    expect(
      formatCustomFieldValue(field({ fieldType: "boolean", value: "true" })),
    ).toBe("Sim");
    expect(
      formatCustomFieldValue(field({ fieldType: "boolean", value: "false" })),
    ).toBe("Não");
  });

  it("passes number/text/select values through unchanged", () => {
    expect(
      formatCustomFieldValue(field({ fieldType: "number", value: "34" })),
    ).toBe("34");
    expect(
      formatCustomFieldValue(field({ fieldType: "text", value: "Unimed" })),
    ).toBe("Unimed");
    expect(
      formatCustomFieldValue(field({ fieldType: "select", value: "Premium" })),
    ).toBe("Premium");
  });
});

describe("pickRenderableFields", () => {
  it("returns up to `max` fields with non-empty formatted values", () => {
    const fields = [
      field({ fieldType: "text", value: "a" }),
      field({ fieldType: "text", value: null }),
      field({ fieldType: "text", value: "b" }),
      field({ fieldType: "text", value: "c" }),
    ];
    const result = pickRenderableFields(fields, 2);
    expect(result).toHaveLength(2);
    expect(result.map((r) => r.formatted)).toEqual(["a", "b"]);
  });

  it("skips fields with null/empty/invalid values", () => {
    const fields = [
      field({ fieldType: "date", value: "bad" }), // invalid → skipped
      field({ fieldType: "text", value: null }), // null → skipped
      field({ fieldType: "text", value: "ok" }),
    ];
    const result = pickRenderableFields(fields, 5);
    expect(result.map((r) => r.formatted)).toEqual(["ok"]);
  });

  it("returns empty array when all fields are null", () => {
    expect(
      pickRenderableFields(
        [field({ value: null }), field({ value: null })],
        2,
      ),
    ).toHaveLength(0);
  });
});
