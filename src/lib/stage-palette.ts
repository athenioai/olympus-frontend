import type { LeadStatus } from "@/lib/services/interfaces/lead-service";

/**
 * Quiet Authority stage palette.
 *
 * The 5 funnel colors live here once so every pill/indicator in the app
 * shares the same semantic hue per stage.
 *
 * Usage convention:
 * - `dot`: colored dot used on top of a neutral pill (past / inactive).
 * - `pastPill`: neutral background + default text, paired with a dot prefix.
 *   This is the default for LIST contexts and HISTORY contexts where many
 *   pills live on the same screen — keeps the UI quiet.
 * - `currentPill`: solid colored background + white text. Reserved for the
 *   ONE moment that deserves emphasis (the lead's current status on the
 *   detail page, the last pill of a timeline transition).
 */

export const STAGE_HEX: Record<LeadStatus, string> = {
  new: "#3b82f6",
  contacted: "#8b5cf6",
  qualified: "#f59e0b",
  converted: "#16a34a",
  lost: "#94a3b8",
};

export const STAGE_DOT: Record<LeadStatus, string> = {
  new: "bg-[#3b82f6]",
  contacted: "bg-[#8b5cf6]",
  qualified: "bg-[#f59e0b]",
  converted: "bg-[#16a34a]",
  lost: "bg-[#94a3b8]",
};

/** Neutral pill + colored dot. Used for past states and list rows. */
export const STAGE_PAST_PILL =
  "bg-surface-container-high text-on-surface-variant";

export const STAGE_CURRENT_PILL: Record<LeadStatus, string> = {
  new: "bg-[#3b82f6] text-white",
  contacted: "bg-[#8b5cf6] text-white",
  qualified: "bg-[#f59e0b] text-white",
  converted: "bg-[#16a34a] text-white",
  lost: "bg-[#94a3b8] text-white",
};

export const STAGE_CURRENT_FALLBACK = "bg-primary text-on-primary";
export const STAGE_DOT_FALLBACK = "bg-on-surface-variant/40";

/**
 * Return the Tailwind classname for a colored dot, falling back to a
 * muted neutral if the status is unknown.
 */
export function stageDotClass(status: string): string {
  return STAGE_DOT[status as LeadStatus] ?? STAGE_DOT_FALLBACK;
}

/**
 * Return the current-pill classname (solid colored) for a status.
 * Falls back to the primary token when unknown.
 */
export function stageCurrentClass(status: string): string {
  return STAGE_CURRENT_PILL[status as LeadStatus] ?? STAGE_CURRENT_FALLBACK;
}
