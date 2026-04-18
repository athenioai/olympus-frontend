/**
 * URL safety utilities for rendering external references that originate
 * from backend data. Blocks `javascript:`, `data:`, `vbscript:`, etc.,
 * which would execute inline if rendered as `href` or `src`.
 */

const SAFE_PROTOCOLS = new Set(["http:", "https:"]);

/**
 * Returns the input URL if it uses a safe protocol, otherwise null.
 * Relative URLs (starting with `/`) are considered safe since they stay
 * on the same origin.
 */
export function safeUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (trimmed === "") return null;

  if (trimmed.startsWith("/") && !trimmed.startsWith("//")) {
    return trimmed;
  }

  try {
    const parsed = new URL(trimmed);
    if (!SAFE_PROTOCOLS.has(parsed.protocol)) return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

export function isSafeUrl(url: string | null | undefined): boolean {
  return safeUrl(url) !== null;
}
