"use server";

import { cookies } from "next/headers";
import { updateTag } from "next/cache";
import { z } from "zod";
import { ApiError } from "@/lib/api-envelope";
import { captureUnexpected } from "@/lib/observability/capture";
import { counter } from "@/lib/observability/sentry-metrics";
import { isValidCNPJ } from "@/lib/format";
import { CACHE_TAGS } from "@/lib/cache-config";
import {
  businessProfileService,
  businessVerticalService,
  onboardingService,
  userService,
  type BusinessProfileView,
  type BusinessVertical,
  type ServiceModality,
  type SetPasswordResponse,
  type UpdateBusinessProfilePayload,
  type WorkType,
} from "@/lib/services";

const ACCESS_TOKEN_MAX_AGE = 60 * 60;
const REFRESH_TOKEN_MAX_AGE = 60 * 60 * 24 * 7;

type OnboardingStep =
  | "password"
  | "work_type"
  | "vertical"
  | "business_info"
  | "service_modality"
  | "policies"
  | "extras";

function emitStepCompleted(
  step: OnboardingStep,
  result: "success" | "error",
): void {
  counter("onboarding.step_completed", 1, { attributes: { step, result } });
}

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
    emitStepCompleted("password", "error");
    return { success: false, error: "INVALID_INPUT" };
  }

  let response: SetPasswordResponse;
  try {
    response = await onboardingService.setPassword(slug, parsed.data);
  } catch (err) {
    emitStepCompleted("password", "error");
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
  } catch (err) {
    // Profile may legitimately not exist yet; client falls back to defaults.
    // Only backend bugs (5xx) surface in Sentry; 4xx are treated as expected.
    captureUnexpected(err);
    profileView = undefined;
  }

  emitStepCompleted("password", "success");
  return {
    success: true,
    user: response.user,
    profileView,
  };
}

function mapSetPasswordError(err: unknown): StepErrorCode {
  captureUnexpected(err);
  if (err instanceof ApiError) {
    if (err.status === 404) return "INVALID_SLUG";
    if (err.status === 410) return "SLUG_CONSUMED";
    if (err.status === 400) return "PASSWORD_WEAK";
  }
  return "GENERIC";
}

const workTypeSchema = z.enum(["services", "sales", "hybrid"]);

export interface SetWorkTypeResult {
  readonly success: boolean;
  readonly error?: StepErrorCode;
  readonly workType?: WorkType;
}

/**
 * Step 2 action: set the user's work mode via PATCH /users/me.
 */
export async function setWorkTypeAction(
  rawWorkType: string,
): Promise<SetWorkTypeResult> {
  const parsed = workTypeSchema.safeParse(rawWorkType);
  if (!parsed.success) {
    emitStepCompleted("work_type", "error");
    return { success: false, error: "INVALID_INPUT" };
  }

  try {
    const updated = await userService.updateMe({ workType: parsed.data });
    emitStepCompleted("work_type", "success");
    return { success: true, workType: updated.workType };
  } catch (err) {
    emitStepCompleted("work_type", "error");
    return { success: false, error: mapAuthedError(err) };
  }
}

function mapAuthedError(err: unknown): StepErrorCode {
  if (err instanceof Error && err.message === "NOT_AUTHENTICATED") {
    return "NOT_AUTHENTICATED";
  }
  captureUnexpected(err);
  if (err instanceof ApiError && err.status === 400) {
    return "INVALID_INPUT";
  }
  return "GENERIC";
}

export interface ListVerticalsResult {
  readonly success: boolean;
  readonly verticals?: readonly BusinessVertical[];
  readonly error?: StepErrorCode;
}

export async function listVerticalsAction(): Promise<ListVerticalsResult> {
  try {
    const verticals = await businessVerticalService.list();
    return { success: true, verticals };
  } catch (err) {
    return { success: false, error: mapAuthedError(err) };
  }
}

export interface SetVerticalResult {
  readonly success: boolean;
  readonly error?: StepErrorCode;
  readonly profileView?: BusinessProfileView;
  readonly vertical?: BusinessVertical;
}

/**
 * Step 3 action: assign the selected business vertical and refresh the
 * profile view (PUT /business-profile seeds tags/fields/FAQs server-side,
 * so we need a fresh GET to show the new score and confirm state).
 */
export async function setVerticalAction(
  verticalId: string,
): Promise<SetVerticalResult> {
  if (typeof verticalId !== "string" || verticalId.trim() === "") {
    emitStepCompleted("vertical", "error");
    return { success: false, error: "INVALID_INPUT" };
  }

  try {
    await businessProfileService.updateProfile({ businessVertical: verticalId });
    updateTag(CACHE_TAGS.businessProfile);
    updateTag(CACHE_TAGS.businessScore);
    const [profileView, verticals] = await Promise.all([
      businessProfileService.getProfile(),
      businessVerticalService.list(),
    ]);
    const vertical = verticals.find((v) => v.id === verticalId);
    emitStepCompleted("vertical", "success");
    return { success: true, profileView, vertical };
  } catch (err) {
    emitStepCompleted("vertical", "error");
    return { success: false, error: mapAuthedError(err) };
  }
}

export interface UpdateProfileResult {
  readonly success: boolean;
  readonly error?: StepErrorCode;
  readonly profileView?: BusinessProfileView;
}

const businessInfoSchema = z.object({
  businessName: z.string().trim().min(2).max(120),
  businessDescription: z.string().trim().min(10).max(2000),
});

const modalitySchema = z.enum([
  "presencial",
  "remoto",
  "domicilio",
  "hibrido",
]) satisfies z.ZodType<ServiceModality>;

const policiesSchema = z.object({
  paymentPolicy: z.string().trim().min(1).max(2000),
  cancellationPolicy: z.string().trim().min(1).max(2000),
});

/**
 * Step 4 action: persist business name + description.
 */
export async function updateBusinessInfoAction(
  formData: FormData,
): Promise<UpdateProfileResult> {
  const parsed = businessInfoSchema.safeParse({
    businessName: formData.get("businessName"),
    businessDescription: formData.get("businessDescription"),
  });
  if (!parsed.success) {
    emitStepCompleted("business_info", "error");
    return { success: false, error: "INVALID_INPUT" };
  }
  const result = await persistProfile(parsed.data);
  emitStepCompleted("business_info", result.success ? "success" : "error");
  return result;
}

/**
 * Step 5 action: persist service modality.
 */
export async function updateServiceModalityAction(
  rawModality: string,
): Promise<UpdateProfileResult> {
  const parsed = modalitySchema.safeParse(rawModality);
  if (!parsed.success) {
    emitStepCompleted("service_modality", "error");
    return { success: false, error: "INVALID_INPUT" };
  }
  const result = await persistProfile({ serviceModality: parsed.data });
  emitStepCompleted("service_modality", result.success ? "success" : "error");
  return result;
}

/**
 * Step 6 action: persist payment + cancellation policies.
 */
export async function updatePoliciesAction(
  formData: FormData,
): Promise<UpdateProfileResult> {
  const parsed = policiesSchema.safeParse({
    paymentPolicy: formData.get("paymentPolicy"),
    cancellationPolicy: formData.get("cancellationPolicy"),
  });
  if (!parsed.success) {
    emitStepCompleted("policies", "error");
    return { success: false, error: "INVALID_INPUT" };
  }
  const result = await persistProfile(parsed.data);
  emitStepCompleted("policies", result.success ? "success" : "error");
  return result;
}

async function persistProfile(
  payload: UpdateBusinessProfilePayload,
): Promise<UpdateProfileResult> {
  try {
    await businessProfileService.updateProfile(payload);
    updateTag(CACHE_TAGS.businessProfile);
    updateTag(CACHE_TAGS.businessScore);
    const profileView = await businessProfileService.getProfile();
    return { success: true, profileView };
  } catch (err) {
    return { success: false, error: mapAuthedError(err) };
  }
}

const brazilianStateSchema = z
  .string()
  .trim()
  .length(2)
  .regex(/^[A-Za-z]{2}$/);

const addressSchema = z.object({
  street: z.string().trim().min(1).max(200),
  neighborhood: z.string().trim().max(100).optional(),
  city: z.string().trim().min(1).max(100),
  state: brazilianStateSchema,
});

const socialLinkSchema = z.object({
  platform: z.enum([
    "website",
    "instagram",
    "google_reviews",
    "facebook",
    "linkedin",
    "youtube",
    "tiktok",
  ]),
  url: z.string().trim().url().max(500),
});

const serviceAreaSchema = z.object({ name: z.string().trim().min(1).max(100) });

const companySchema = z.object({
  cnpj: z
    .string()
    .trim()
    .max(32)
    .nullish()
    .refine(
      (value) => !value || isValidCNPJ(value),
      { message: "CNPJ_INVALID" },
    ),
  legalName: z.string().trim().max(200).nullish(),
  foundedYear: z
    .number()
    .int()
    .min(1800)
    .max(new Date().getFullYear())
    .nullish(),
  differentials: z.string().trim().max(2000).nullish(),
});

const extrasSchema = z.object({
  address: addressSchema.optional(),
  socialLinks: z.array(socialLinkSchema).optional(),
  serviceAreas: z.array(serviceAreaSchema).optional(),
  company: companySchema.optional(),
});

export type SaveExtrasInput = z.infer<typeof extrasSchema>;

/**
 * Step 7 action: persists any combination of address, social links,
 * service areas and company fields. All sub-writes are best-effort —
 * one failing section does not abort the others, but any failure
 * degrades the result to success=false so the UI can warn the user.
 */
export async function saveExtrasAction(
  input: SaveExtrasInput,
): Promise<UpdateProfileResult> {
  const parsed = extrasSchema.safeParse(input);
  if (!parsed.success) {
    emitStepCompleted("extras", "error");
    return { success: false, error: "INVALID_INPUT" };
  }

  const { address, socialLinks, serviceAreas, company } = parsed.data;
  let hadError = false;

  try {
    if (address) {
      await businessProfileService.updateAddress(address);
    }
    if (socialLinks?.length) {
      await Promise.all(
        socialLinks.map((link) => businessProfileService.addSocialLink(link)),
      );
    }
    if (serviceAreas?.length) {
      await Promise.all(
        serviceAreas.map((area) => businessProfileService.addServiceArea(area)),
      );
    }
    if (company && Object.values(company).some((v) => v !== null && v !== undefined)) {
      await businessProfileService.updateProfile(company);
    }
  } catch (err) {
    if (err instanceof Error && err.message === "NOT_AUTHENTICATED") {
      emitStepCompleted("extras", "error");
      return { success: false, error: "NOT_AUTHENTICATED" };
    }
    captureUnexpected(err);
    hadError = true;
  }

  updateTag(CACHE_TAGS.businessProfile);
  updateTag(CACHE_TAGS.businessScore);

  try {
    const profileView = await businessProfileService.getProfile();
    emitStepCompleted("extras", hadError ? "error" : "success");
    return { success: !hadError, profileView, error: hadError ? "GENERIC" : undefined };
  } catch (err) {
    emitStepCompleted("extras", "error");
    return { success: false, error: mapAuthedError(err) };
  }
}
