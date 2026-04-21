"use server";

import { z } from "zod";
import { authService } from "@/lib/services/auth-service";
import { captureUnexpected } from "@/lib/observability/capture";

interface ForgotPasswordResult {
  readonly success: boolean;
  readonly error?: string;
}

const RequestSchema = z.object({
  email: z.string().email(),
});

/**
 * Server action for the password recovery request.
 *
 * Wires to `authService.requestPasswordReset` which POSTs to
 * `/auth/password/forgot`. Backend contract:
 *   - Always 204 regardless of email existence (prevents account enumeration)
 *   - Rate-limit per IP (5/min) and per email (3/hour)
 *   - Async email dispatch with a single-use 30-min token
 *
 * We surface a generic "success" to the UI even when the fetch fails at the
 * network layer — the enumeration-safe behavior is the same contract.
 * Logging of real failures belongs in backend observability, not here.
 */
export async function requestPasswordResetAction(
  formData: FormData,
): Promise<ForgotPasswordResult> {
  const raw = formData.get("email");

  const parsed = RequestSchema.safeParse({ email: raw });
  if (!parsed.success) {
    return {
      success: false,
      error:
        typeof raw === "string" && raw.trim().length === 0
          ? "EMAIL_REQUIRED"
          : "EMAIL_INVALID",
    };
  }

  try {
    await authService.requestPasswordReset(parsed.data.email);
  } catch (err) {
    // Swallow for the UI (enumeration-safe), but still log real technical
    // failures (5xx, network) so they surface in Sentry.
    captureUnexpected(err);
  }

  return { success: true };
}
