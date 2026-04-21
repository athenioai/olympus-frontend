"use server";

import { z } from "zod";
import { authService } from "@/lib/services/auth-service";
import { captureUnexpected } from "@/lib/observability/capture";
import { meetsBackendPolicy } from "@/lib/auth/password-strength";

export interface TokenValidationResult {
  readonly valid: boolean;
  readonly maskedEmail?: string;
}

export type ResetPasswordErrorCode =
  | "TOKEN_INVALID"
  | "TOKEN_EXPIRED"
  | "PASSWORD_WEAK"
  | "PASSWORD_MISMATCH"
  | "PASSWORD_RESET_FAILED";

export interface ResetPasswordState {
  readonly success: boolean;
  readonly error?: ResetPasswordErrorCode;
}

const ResetSchema = z.object({
  token: z.string().min(10),
  password: z.string(),
  confirm: z.string(),
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
/**
 * Server action for submitting the new password (useActionState signature).
 * Validates the password matches the confirmation server-side so the flow
 * works even before client hydration.
 */
export async function resetPasswordAction(
  _prevState: ResetPasswordState | null,
  formData: FormData,
): Promise<ResetPasswordState> {
  const parsed = ResetSchema.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
    confirm: formData.get("confirm"),
  });

  if (!parsed.success) {
    return { success: false, error: "TOKEN_INVALID" };
  }

  if (parsed.data.password !== parsed.data.confirm) {
    return { success: false, error: "PASSWORD_MISMATCH" };
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
    const code =
      err instanceof Error &&
      (err.message === "TOKEN_INVALID" ||
        err.message === "TOKEN_EXPIRED" ||
        err.message === "PASSWORD_WEAK")
        ? (err.message as ResetPasswordErrorCode)
        : "PASSWORD_RESET_FAILED";
    return { success: false, error: code };
  }
}
