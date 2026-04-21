import { scrubValue } from "./scrub";

/**
 * Shared Sentry.init options for client, server and edge runtimes.
 * Reads DSN from NEXT_PUBLIC_SENTRY_DSN; when absent, the caller should skip
 * init entirely so the SDK stays disabled (no-op) and dev/preview builds
 * never crash due to a missing secret.
 */
export const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL;

export const TRACE_PROPAGATION_TARGETS: ReadonlyArray<string | RegExp> = [
  /^\//,
  ...(BACKEND_URL ? [BACKEND_URL] : []),
];

export const IGNORE_ERRORS: ReadonlyArray<string | RegExp> = [
  /^AUTH_/,
  /_NOT_FOUND_/,
  /^VALIDATION_/,
  "NOT_AUTHENTICATED",
];

export const RELEASE =
  process.env.VERCEL_GIT_COMMIT_SHA ??
  process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA ??
  undefined;

export const ENVIRONMENT = process.env.NODE_ENV ?? "development";

export const TRACES_SAMPLE_RATE = 0.2;

/**
 * Scrub PII (emails, phones, CPFs, JWTs, bearer tokens) from a Sentry event
 * or transaction payload before it leaves the process. Generic over any
 * event shape so we don't need to import the SDK's internal type surface.
 */
export function scrubEvent<T>(event: T): T {
  return scrubValue(event);
}
