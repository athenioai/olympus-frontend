import { describe, it, expect } from "vitest";
import ptBR from "../../messages/pt-BR.json";
import enUS from "../../messages/en-US.json";
import es from "../../messages/es.json";

type Messages = Record<string, unknown>;

/**
 * Flatten a nested translation object to dot-path keys.
 * { a: { b: "x" } } -> ["a.b"]
 */
function flattenKeys(obj: Messages, prefix = ""): string[] {
  return Object.entries(obj).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value !== null && typeof value === "object" && !Array.isArray(value)) {
      return flattenKeys(value as Messages, path);
    }
    return [path];
  });
}

/**
 * Top-level sections whose keys must stay in parity across locales.
 * Legacy sections (dashboard/crm/conversations/sidebar/catalog/settings/auth/common)
 * have pre-existing drift documented in HANDOFF; they're excluded here
 * so we fail only on NEW drift in actively maintained areas.
 */
const TRACKED_PREFIXES = ["admin.", "signup.", "onboarding."];

function tracked(keys: Iterable<string>): string[] {
  return [...keys].filter((k) => TRACKED_PREFIXES.some((p) => k.startsWith(p)));
}

describe("i18n parity (tracked sections)", () => {
  const ptKeys = new Set(tracked(flattenKeys(ptBR as Messages)));
  const enKeys = new Set(tracked(flattenKeys(enUS as Messages)));
  const esKeys = new Set(tracked(flattenKeys(es as Messages)));

  it("pt-BR and en-US expose the same admin/signup/onboarding keys", () => {
    const missingInEn = [...ptKeys].filter((k) => !enKeys.has(k));
    const missingInPt = [...enKeys].filter((k) => !ptKeys.has(k));
    expect({ missingInEn, missingInPt }).toEqual({
      missingInEn: [],
      missingInPt: [],
    });
  });

  it("pt-BR and es expose the same admin/signup/onboarding keys", () => {
    const missingInEs = [...ptKeys].filter((k) => !esKeys.has(k));
    const missingInPt = [...esKeys].filter((k) => !ptKeys.has(k));
    expect({ missingInEs, missingInPt }).toEqual({
      missingInEs: [],
      missingInPt: [],
    });
  });
});
