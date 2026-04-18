import type { LeadCustomFieldValue } from "@/lib/services/interfaces/lead-service";

/**
 * Format a custom field raw value for inline display on the board card.
 *
 * - `date`: ISO string (YYYY-MM-DD or full ISO) → "DD/MM/YYYY".
 * - `boolean`: "true" → "Sim", "false" → "Não".
 * - `number`: passthrough (backend already formats decimals if needed).
 * - `text` / `select`: passthrough.
 *
 * Returns `null` when the value is absent or unparseable, so the caller can
 * decide whether to skip rendering.
 */
export function formatCustomFieldValue(
  field: LeadCustomFieldValue,
): string | null {
  if (field.value === null || field.value === "") return null;

  switch (field.fieldType) {
    case "date":
      return formatDateValue(field.value);
    case "boolean":
      return field.value === "true" ? "Sim" : "Não";
    case "number":
    case "text":
    case "select":
      return field.value;
    default:
      return field.value;
  }
}

function formatDateValue(raw: string): string | null {
  // Accepts "2026-04-17" and full ISO "2026-04-17T14:30:00Z".
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(raw);
  if (!match) return null;
  const [, year, month, day] = match;
  return `${day}/${month}/${year}`;
}

/**
 * Return the first N fields that have a renderable value. Used to cap the
 * inline preview on the board card.
 */
export function pickRenderableFields(
  fields: ReadonlyArray<LeadCustomFieldValue>,
  max: number,
): ReadonlyArray<{ field: LeadCustomFieldValue; formatted: string }> {
  const out: Array<{ field: LeadCustomFieldValue; formatted: string }> = [];
  for (const field of fields) {
    if (out.length >= max) break;
    const formatted = formatCustomFieldValue(field);
    if (formatted === null) continue;
    out.push({ field, formatted });
  }
  return out;
}
