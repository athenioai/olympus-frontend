const EMAIL_RE = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi;
const CPF_MASKED_RE = /\d{3}\.\d{3}\.\d{3}-\d{2}/g;
const CPF_DIGITS_RE = /(?<![\d.])\d{11}(?![\d.])/g;
const PHONE_BR_RE =
  /(?:\+?55[\s-]?)?\(?\d{2}\)?[\s-]?9?\d{4}[\s-]?\d{4}/g;
const JWT_RE = /eyJ[A-Za-z0-9_-]{5,}\.[A-Za-z0-9_-]{5,}\.[A-Za-z0-9_-]{5,}/g;
const BEARER_RE = /Bearer\s+[A-Za-z0-9._\-~+/=]+/gi;

const PATTERNS: ReadonlyArray<readonly [RegExp, string]> = [
  [BEARER_RE, "Bearer [REDACTED]"],
  [JWT_RE, "[REDACTED_JWT]"],
  [EMAIL_RE, "[REDACTED_EMAIL]"],
  [CPF_MASKED_RE, "[REDACTED_CPF]"],
  [CPF_DIGITS_RE, "[REDACTED_ID]"],
  [PHONE_BR_RE, "[REDACTED_PHONE]"],
];

/**
 * Scrub PII patterns (emails, phones, CPFs, JWTs, bearer tokens) from a
 * string. Pure function; safe to call on arbitrary strings.
 */
export function scrubString(input: string): string {
  let out = input;
  for (const [re, repl] of PATTERNS) {
    out = out.replace(re, repl);
  }
  return out;
}

/**
 * Recursively scrub PII from any JSON-like value. Leaves numbers/booleans/null
 * untouched; only string values are transformed.
 */
export function scrubValue<T>(value: T): T {
  if (typeof value === "string") {
    return scrubString(value) as unknown as T;
  }
  if (Array.isArray(value)) {
    return value.map((item) => scrubValue(item)) as unknown as T;
  }
  if (value !== null && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = scrubValue(v);
    }
    return out as unknown as T;
  }
  return value;
}
