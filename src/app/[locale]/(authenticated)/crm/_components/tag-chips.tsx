"use client";

import { Tooltip } from "@/components/ui/tooltip";
import type { LeadTag } from "@/lib/services/interfaces/lead-service";

const MAX_VISIBLE = 3;

/**
 * Up to 3 tag chips. If there are more, the remainder collapses into a gray
 * `+N` chip that reveals the hidden tag names in a tooltip.
 *
 * Chips use `tag.color` at 15% opacity as background and the solid color as
 * text, per design spec.
 */
export function TagChips({ tags }: { readonly tags: ReadonlyArray<LeadTag> }) {
  if (tags.length === 0) return null;

  const visible = tags.slice(0, MAX_VISIBLE);
  const overflow = tags.slice(MAX_VISIBLE);

  return (
    <div className="flex flex-wrap items-center gap-1">
      {visible.map((tag) => (
        <span
          className="inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-semibold"
          key={tag.id}
          style={{
            backgroundColor: withAlpha(tag.color, 0.15),
            color: tag.color,
          }}
          title={tag.name}
        >
          {tag.name}
        </span>
      ))}
      {overflow.length > 0 && (
        <Tooltip
          content={
            <ul className="flex flex-col gap-0.5">
              {overflow.map((t) => (
                <li key={t.id}>{t.name}</li>
              ))}
            </ul>
          }
        >
          <span className="inline-flex items-center rounded-md bg-surface-container-high px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-on-surface-variant">
            +{overflow.length}
          </span>
        </Tooltip>
      )}
    </div>
  );
}

function withAlpha(hex: string, alpha: number): string {
  // Accepts #RGB, #RRGGBB. Returns rgba(...)
  const normalized = hex.trim().replace(/^#/, "");
  const full =
    normalized.length === 3
      ? normalized
          .split("")
          .map((c) => c + c)
          .join("")
      : normalized;
  if (!/^[0-9a-f]{6}$/i.test(full)) {
    return hex; // fall back to original if not a valid hex
  }
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
