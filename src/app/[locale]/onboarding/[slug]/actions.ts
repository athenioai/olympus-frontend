"use server";

import { cookies } from "next/headers";
import { z } from "zod";
import { ApiError } from "@/lib/api-envelope";
import {
  businessProfileService,
  onboardingService,
  type BusinessProfileView,
  type SetPasswordResponse,
} from "@/lib/services";

const ACCESS_TOKEN_MAX_AGE = 60 * 60;
const REFRESH_TOKEN_MAX_AGE = 60 * 60 * 24 * 7;

export type StepErrorCode =
  | "INVALID_INPUT"
  | "INVALID_SLUG"
  | "SLUG_CONSUMED"
  | "PASSWORD_WEAK"
  | "NOT_AUTHENTICATED"
  | "GENERIC";

export interface SetPasswordStepResult {
  readonly success: boolean;
  readonly error?: StepErrorCode;
  readonly user?: SetPasswordResponse["user"];
  readonly profileView?: BusinessProfileView;
}

const passwordSchema = z.object({
  name: z.string().trim().min(2).max(120),
  password: z
    .string()
    .min(8)
    .regex(/[A-Za-z]/, "needs-letter")
    .regex(/\d/, "needs-number"),
});

/**
 * Step 1 action: finalize onboarding password.
 * Calls POST /onboarding/:slug/set-password, persists the returned JWT
 * pair in httpOnly cookies, and returns the initial BusinessProfileView.
 */
export async function setPasswordStepAction(
  slug: string,
  formData: FormData,
): Promise<SetPasswordStepResult> {
  const rawName = formData.get("name");
  const rawPassword = formData.get("password");

  const parsed = passwordSchema.safeParse({
    name: typeof rawName === "string" ? rawName : "",
    password: typeof rawPassword === "string" ? rawPassword : "",
  });

  if (!parsed.success) {
    return { success: false, error: "INVALID_INPUT" };
  }

  let response: SetPasswordResponse;
  try {
    response = await onboardingService.setPassword(slug, parsed.data);
  } catch (err) {
    return { success: false, error: mapSetPasswordError(err) };
  }

  const cookieStore = await cookies();
  const isProduction = process.env.NODE_ENV === "production";
  cookieStore.set("access_token", response.accessToken, {
    maxAge: ACCESS_TOKEN_MAX_AGE,
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: isProduction,
  });
  cookieStore.set("refresh_token", response.refreshToken, {
    maxAge: REFRESH_TOKEN_MAX_AGE,
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: isProduction,
  });

  let profileView: BusinessProfileView | undefined;
  try {
    profileView = await businessProfileService.getProfile();
  } catch {
    // Profile may legitimately not exist yet; client falls back to defaults.
    profileView = undefined;
  }

  return {
    success: true,
    user: response.user,
    profileView,
  };
}

function mapSetPasswordError(err: unknown): StepErrorCode {
  if (err instanceof ApiError) {
    if (err.status === 404) return "INVALID_SLUG";
    if (err.status === 410) return "SLUG_CONSUMED";
    if (err.status === 400) return "PASSWORD_WEAK";
  }
  return "GENERIC";
}
