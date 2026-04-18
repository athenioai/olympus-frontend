/**
 * Truncate a string at `max` chars, appending a horizontal ellipsis when
 * the original exceeds the limit. Safe with whitespace — leading/trailing
 * space is preserved in the source, only the tail is cut.
 */
export function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max).trimEnd()}…`;
}
