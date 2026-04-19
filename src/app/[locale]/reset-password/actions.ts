"use server";

import { z } from "zod";
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
 * Validates the recovery token. Called server-side from the page so the user
 * lands directly on the right state (form / invalid).
 *
 * TODO(backend): wire to `GET /auth/password/reset/validate?token=...`
 *   Response: { valid: boolean, maskedEmail?: string }
 *   The endpoint must NOT consume the token — only check existence + expiry.
 *
 * Mock rule: any non-empty token >= 10 chars is considered valid.
 */
export async function validateResetTokenAction(
  token: string,
): Promise<TokenValidationResult> {
  if (!token || token.length < 10) {
    return { valid: false };
  }
  return { valid: true, maskedEmail: "ra\u2022\u2022\u2022\u2022@studioapice.com.br" };
}

/**
 * Submits the new password.
 *
 * TODO(backend): wire to `POST /auth/password/reset { token, password }`.
 *   - validate token + consume (single-use)
 *   - enforce password policy server-side
 *   - return 204 on success; 400 with code on failure (TOKEN_INVALID,
 *     TOKEN_EXPIRED, PASSWORD_WEAK)
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

  await new Promise<void>((resolve) => setTimeout(resolve, 500));

  return { success: true };
}
