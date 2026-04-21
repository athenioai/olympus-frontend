"use server";

import { cookies } from "next/headers";
import { z } from "zod";
import { ApiError } from "@/lib/api-envelope";
import { signupService } from "@/lib/services";
import { captureUnexpected } from "@/lib/observability/capture";
import { counter } from "@/lib/observability/sentry-metrics";
import { PENDING_EMAIL_COOKIE, PENDING_EMAIL_MAX_AGE } from "./constants";

export type SignupErrorCode =
  | "EMAIL_REQUIRED"
  | "EMAIL_INVALID"
  | "EMAIL_EXISTS"
  | "GENERIC";

export interface SignupActionResult {
  readonly success: boolean;
  readonly error?: SignupErrorCode;
}

const emailSchema = z.object({
  email: z.string().trim().email(),
});

/**
 * Start signup with a pending-email cookie that persists the email across
 * the /signup → /signup/success transition and powers the resend button.
 */
type SignupResult =
  | "success"
  | "email_invalid"
  | "email_exists"
  | "error";

function codeToResult(code: SignupErrorCode | "SUCCESS"): SignupResult {
  switch (code) {
    case "SUCCESS":
      return "success";
    case "EMAIL_INVALID":
    case "EMAIL_REQUIRED":
      return "email_invalid";
    case "EMAIL_EXISTS":
      return "email_exists";
    case "GENERIC":
    default:
      return "error";
  }
}

function emitSignupStarted(code: SignupErrorCode | "SUCCESS"): void {
  counter("auth.signup_started", 1, {
    attributes: { result: codeToResult(code) },
  });
}

export async function signupAction(
  formData: FormData,
): Promise<SignupActionResult> {
  const rawEmail = formData.get("email");
  if (typeof rawEmail !== "string" || rawEmail.trim() === "") {
    emitSignupStarted("EMAIL_REQUIRED");
    return { success: false, error: "EMAIL_REQUIRED" };
  }

  const parsed = emailSchema.safeParse({ email: rawEmail });
  if (!parsed.success) {
    emitSignupStarted("EMAIL_INVALID");
    return { success: false, error: "EMAIL_INVALID" };
  }

  try {
    await signupService.begin({ email: parsed.data.email });
  } catch (err) {
    const code = mapSignupError(err);
    captureUnexpected(err);
    emitSignupStarted(code);
    return { success: false, error: code };
  }

  const cookieStore = await cookies();
  cookieStore.set(PENDING_EMAIL_COOKIE, parsed.data.email, {
    maxAge: PENDING_EMAIL_MAX_AGE,
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
  });

  emitSignupStarted("SUCCESS");
  return { success: true };
}

export async function resendSignupAction(): Promise<SignupActionResult> {
  const cookieStore = await cookies();
  const email = cookieStore.get(PENDING_EMAIL_COOKIE)?.value;
  if (!email) {
    return { success: false, error: "EMAIL_REQUIRED" };
  }

  try {
    await signupService.begin({ email });
    return { success: true };
  } catch (err) {
    captureUnexpected(err);
    return { success: false, error: mapSignupError(err) };
  }
}

function mapSignupError(err: unknown): SignupErrorCode {
  if (err instanceof ApiError) {
    if (err.status === 409) return "EMAIL_EXISTS";
    if (err.status === 400) return "EMAIL_INVALID";
  }
  return "GENERIC";
}
