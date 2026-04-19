"use server";

import { z } from "zod";

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
 * TODO(backend): wire to `POST /auth/password/forgot { email }`.
 * The endpoint must:
 *   - always return 204 regardless of whether the email exists (avoid
 *     account enumeration);
 *   - rate-limit per IP and per email (the 60s client cooldown is UX-only);
 *   - dispatch the email asynchronously with a single-use 30-min token.
 *
 * For now this stub validates the email shape and returns success after a
 * brief delay so the UI flows correctly.
 */
export async function requestPasswordResetAction(
  formData: FormData,
): Promise<ForgotPasswordResult> {
  const raw = formData.get("email");

  const parsed = RequestSchema.safeParse({ email: raw });
  if (!parsed.success) {
    return {
      success: false,
      error: typeof raw === "string" && raw.trim().length === 0
        ? "EMAIL_REQUIRED"
        : "EMAIL_INVALID",
    };
  }

  await new Promise<void>((resolve) => setTimeout(resolve, 400));

  return { success: true };
}
