"use server";

import { z } from "zod";
import { authService } from "@/lib/services/auth-service";
import { captureUnexpected } from "@/lib/observability/capture";

export type ForgotErrorCode = "EMAIL_REQUIRED" | "EMAIL_INVALID";

export interface ForgotPasswordState {
  readonly ok: boolean;
  readonly email?: string;
  readonly error?: ForgotErrorCode;
}

const RequestSchema = z.object({
  email: z.string().email(),
});

async function dispatchPasswordReset(email: string): Promise<void> {
  try {
    await authService.requestPasswordReset(email);
  } catch (err) {
    // Enumeration-safe: always return success to the UI. But still report
    // real technical failures (5xx, network) to Sentry for investigation.
    captureUnexpected(err);
  }
}

/**
 * Server action for the password recovery request (useActionState signature).
 *
 * Wires to `authService.requestPasswordReset` which POSTs to
 * `/auth/password/forgot`. Backend contract:
 *   - Always 204 regardless of email existence (prevents account enumeration)
 *   - Rate-limit per IP (5/min) and per email (3/hour)
 *   - Async email dispatch with a single-use 30-min token
 */
export async function requestPasswordResetAction(
  _prevState: ForgotPasswordState | null,
  formData: FormData,
): Promise<ForgotPasswordState> {
  const raw = formData.get("email");

  const parsed = RequestSchema.safeParse({ email: raw });
  if (!parsed.success) {
    return {
      ok: false,
      error:
        typeof raw === "string" && raw.trim().length === 0
          ? "EMAIL_REQUIRED"
          : "EMAIL_INVALID",
    };
  }

  await dispatchPasswordReset(parsed.data.email);
  return { ok: true, email: parsed.data.email };
}

/**
 * Imperative resend used by the "sent" stage button. Takes a plain email
 * string and re-triggers the same backend flow. Always resolves — errors
 * are swallowed for the UI and captured in Sentry.
 */
export async function resendPasswordResetAction(email: string): Promise<void> {
  const parsed = RequestSchema.safeParse({ email });
  if (!parsed.success) return;
  await dispatchPasswordReset(parsed.data.email);
}
