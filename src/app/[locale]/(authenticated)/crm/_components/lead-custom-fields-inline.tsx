"use client";

import { pickRenderableFields } from "@/lib/custom-field";
import type { LeadCustomFieldValue } from "@/lib/services/interfaces/lead-service";

const MAX_INLINE = 2;

/**
 * Inline custom fields: up to 2 first fields that have a rendered value,
 * formatted per type. Separated by a middle dot.
 *
 * Example: "Convênio: Unimed · Idade: 34"
 */
export function LeadCustomFieldsInline({
  fields,
}: {
  readonly fields: ReadonlyArray<LeadCustomFieldValue>;
}) {
  const picked = pickRenderableFields(fields, MAX_INLINE);
  if (picked.length === 0) return null;

  return (
    <p className="truncate text-[11px] text-on-surface-variant">
      {picked.map(({ field, formatted }, idx) => (
        <span key={field.fieldId}>
          {idx > 0 && (
            <span className="mx-1 text-on-surface-variant/50">·</span>
          )}
          <span className="font-medium">{field.name}:</span> {formatted}
        </span>
      ))}
    </p>
  );
}
