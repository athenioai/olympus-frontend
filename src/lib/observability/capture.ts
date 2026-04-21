import * as Sentry from "@sentry/nextjs";
import { ApiError } from "@/lib/api-envelope";

export interface CaptureOptions {
  /**
   * Plain `Error.message` values that represent expected, already-handled
   * failure modes. Matches are skipped (not sent to Sentry).
   */
  readonly expectedMessages?: readonly string[];
  /**
   * Extra HTTP statuses from `ApiError.status` treated as expected.
   * 4xx responses are already skipped by default — use this only to extend
   * the default list.
   */
  readonly expectedStatuses?: readonly number[];
  /**
   * Backend error codes from `ApiError.code` treated as expected failures.
   */
  readonly expectedCodes?: readonly string[];
  /**
   * When true, every `ApiError` is captured regardless of status. Use only
   * when the action has a narrow expected-code list and wants to capture
   * any other 4xx as a bug signal. Default: false.
   */
  readonly captureClientErrors?: boolean;
}

const ALWAYS_IGNORED_MESSAGES = new Set<string>([
  "NOT_AUTHENTICATED",
]);

function isClientError(status: number): boolean {
  return status >= 400 && status < 500;
}

/**
 * Capture an unexpected server-side error to Sentry while leaving the
 * caller's try/catch flow untouched. The Sentry issue feed is kept lean:
 *
 * Skipped by default (treated as expected business-rule failures):
 * - Errors with message `NOT_AUTHENTICATED` (session expired)
 * - Any `ApiError` with 4xx status (validation, conflict, not-found, etc.)
 *
 * Reported by default:
 * - Any `ApiError` with 5xx status (backend bug / outage)
 * - Any `Error` not whitelisted (TypeErrors, thrown strings, fetch failures)
 *
 * Pass `captureClientErrors: true` to also report 4xx, or `expectedMessages`
 * to add specific `Error.message` values to the skip list.
 */
export function captureUnexpected(
  err: unknown,
  options: CaptureOptions = {},
): void {
  if (err instanceof Error && ALWAYS_IGNORED_MESSAGES.has(err.message)) return;

  if (err instanceof ApiError) {
    if (options.expectedStatuses?.includes(err.status)) return;
    if (options.expectedCodes?.includes(err.code)) return;
    if (!options.captureClientErrors && isClientError(err.status)) return;
  }

  if (
    err instanceof Error &&
    options.expectedMessages?.includes(err.message)
  ) {
    return;
  }

  try {
    Sentry.captureException(err);
  } catch {
    // Never let observability crash the request.
  }
}
