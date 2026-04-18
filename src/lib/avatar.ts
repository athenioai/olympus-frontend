/**
 * 8 neutral-saturated hues chosen to work on both light and dark surfaces.
 * Ordered by hash output, not palette grouping.
 */
const AVATAR_PALETTE: readonly string[] = [
  "#3b82f6", // blue
  "#8b5cf6", // violet
  "#f59e0b", // amber
  "#16a34a", // green
  "#e11d48", // rose
  "#06b6d4", // cyan
  "#7c3aed", // purple
  "#ea580c", // orange
];

/**
 * Extract up to two display initials from a name.
 *
 * - Empty / whitespace-only names resolve to `"?"`.
 * - Single-word names use the first 2 letters of that word.
 * - Otherwise uses first letter of the first word + first letter of the last word.
 *
 * @example
 * initialsOf("Lucas Couto")       // "LC"
 * initialsOf("Luna")              // "LU"
 * initialsOf("  João da Silva ")  // "JS"
 * initialsOf("")                  // "?"
 */
export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  const first = parts[0]![0]!;
  const last = parts[parts.length - 1]![0]!;
  return (first + last).toUpperCase();
}

/**
 * Deterministic color from an identifier using a small FNV-1a hash.
 * Same id always maps to the same color; different ids spread across
 * the palette evenly.
 *
 * @example
 * avatarColorFromId("9bd8656e-...") // "#8b5cf6" (always)
 */
export function avatarColorFromId(id: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < id.length; i++) {
    hash ^= id.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  const index = Math.abs(hash) % AVATAR_PALETTE.length;
  return AVATAR_PALETTE[index]!;
}
