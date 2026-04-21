"use server";

import { z } from "zod";
import { authService } from "@/lib/services/auth-service";
import { captureUnexpected } from "@/lib/observability/capture";
import { meetsBackendPolicy } from "@/lib/auth/password-strength";

export interface TokenValidationResult {
  readonly valid: boolean;
  readonly maskedEmail?: string;
}

export interface ResetPasswordResult {
  readonly success: boolean;
  readonly error?: string;
}

const ResetSchema = z.object({
  token: z.string().min(10),
  password: z.string(),
});

/**
 * Validates the recovery token via the backend. Called server-side from the
 * page so the user lands directly on the right state (form / invalid).
 *
 * Backend contract: GET /auth/password/reset/validate?token=... returns
 *   { valid: boolean, maskedEmail?: string } without consuming the token.
 */
export async function validateResetTokenAction(
  token: string,
): Promise<TokenValidationResult> {
  if (!token || token.length < 10) {
    return { valid: false };
  }
  try {
    return await authService.validateResetToken(token);
  } catch (err) {
    captureUnexpected(err);
    return { valid: false };
  }
}

/**
 * Submits the new password.
 *
 * Backend contract: POST /auth/password/reset { token, password }
 *   - 204 on success
 *   - 400/410 with code TOKEN_INVALID | TOKEN_EXPIRED | PASSWORD_WEAK
 *   - On success, invalidate ALL active refresh tokens for the user
 */
export async function resetPasswordAction(
  formData: FormData,
): Promise<ResetPasswordResult> {
  const parsed = ResetSchema.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { success: false, error: "TOKEN_INVALID" };
  }

  if (!meetsBackendPolicy(parsed.data.password)) {
    return { success: false, error: "PASSWORD_WEAK" };
  }

  try {
    await authService.resetPassword(parsed.data.token, parsed.data.password);
    return { success: true };
  } catch (err) {
    captureUnexpected(err, {
      expectedMessages: ["TOKEN_INVALID", "TOKEN_EXPIRED", "PASSWORD_WEAK"],
    });
    const code = err instanceof Error ? err.message : "PASSWORD_RESET_FAILED";
    return { success: false, error: code };
  }
}
