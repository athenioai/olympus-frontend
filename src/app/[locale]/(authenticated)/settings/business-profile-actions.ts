"use server";

import { revalidatePath } from "next/cache";
import { ApiError } from "@/lib/api-envelope";
import {
  businessProfileService,
  businessVerticalService,
} from "@/lib/services";
import { captureUnexpected } from "@/lib/observability/capture";
import type {
  BusinessProfileView,
  BusinessProfile,
  BusinessSocialLink,
  BusinessServiceArea,
  BusinessVertical,
  UpdateBusinessProfilePayload,
  UpdateAddressPayload,
  CreateSocialLinkPayload,
  CreateServiceAreaPayload,
  SocialPlatform,
} from "@/lib/services";

interface ActionResult<T = undefined> {
  readonly success: boolean;
  readonly error?: string;
  readonly data?: T;
}

function revalidate() {
  revalidatePath("/settings");
}

function describeError(err: unknown, fallback = "Unknown error"): string {
  if (err instanceof ApiError) {
    if (err.details.length > 0) {
      const [first] = err.details;
      return `${first.field}: ${first.message}`;
    }
    return `[${err.code}] ${err.message}`;
  }
  return err instanceof Error ? err.message : fallback;
}

/**
 * List the static catalog of business verticals (used by the required-fields
 * section to let the user pick a segment — backend marks businessVertical
 * required for canConnectChannel even though the onboarding wizard treats
 * it as optional).
 */
export async function listBusinessVerticals(): Promise<
  ActionResult<readonly BusinessVertical[]>
> {
  try {
    const verticals = await businessVerticalService.list();
    return { success: true, data: verticals };
  } catch (err) {
    captureUnexpected(err);
    const msg = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: msg };
  }
}

/**
 * Fetch the full business profile view.
 */
export async function fetchBusinessProfile(): Promise<ActionResult<BusinessProfileView>> {
  try {
    const data = await businessProfileService.getProfile();
    return { success: true, data };
  } catch (err) {
    captureUnexpected(err);
    const msg = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: msg };
  }
}

/**
 * Update the core business profile fields.
 */
export async function saveBusinessProfile(
  payload: UpdateBusinessProfilePayload,
): Promise<ActionResult<BusinessProfile>> {
  try {
    const data = await businessProfileService.updateProfile(payload);
    revalidate();
    return { success: true, data };
  } catch (err) {
    if (!(err instanceof ApiError)) {
      captureUnexpected(err);
    } else {
      // Surface payload + backend envelope in server logs so we can diagnose
      // "Dados inválidos" without asking the operator to reproduce with devtools.
      console.error("[saveBusinessProfile] rejected", {
        code: err.code,
        status: err.status,
        message: err.message,
        payload,
      });
    }
    return { success: false, error: describeError(err) };
  }
}

/**
 * Update or create the business address.
 */
export async function saveBusinessAddress(
  payload: UpdateAddressPayload,
): Promise<ActionResult<BusinessProfileView>> {
  try {
    const data = await businessProfileService.updateAddress(payload);
    revalidate();
    return { success: true, data };
  } catch (err) {
    captureUnexpected(err);
    const msg = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: msg };
  }
}

/**
 * Remove the business address.
 */
export async function removeBusinessAddress(): Promise<ActionResult> {
  try {
    await businessProfileService.deleteAddress();
    revalidate();
    return { success: true };
  } catch (err) {
    captureUnexpected(err);
    const msg = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: msg };
  }
}

/**
 * Add a social link.
 */
export async function addBusinessSocialLink(
  payload: CreateSocialLinkPayload,
): Promise<ActionResult<BusinessSocialLink>> {
  try {
    const data = await businessProfileService.addSocialLink(payload);
    revalidate();
    return { success: true, data };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    if (msg.includes("CONFLICT")) {
      return { success: false, error: "CONFLICT" };
    }
    captureUnexpected(err);
    return { success: false, error: msg };
  }
}

/**
 * Remove a social link by platform.
 */
export async function removeBusinessSocialLink(
  platform: SocialPlatform,
): Promise<ActionResult> {
  try {
    await businessProfileService.removeSocialLink(platform);
    revalidate();
    return { success: true };
  } catch (err) {
    captureUnexpected(err);
    const msg = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: msg };
  }
}

/**
 * Add a service area.
 */
export async function addBusinessServiceArea(
  payload: CreateServiceAreaPayload,
): Promise<ActionResult<BusinessServiceArea>> {
  try {
    const data = await businessProfileService.addServiceArea(payload);
    revalidate();
    return { success: true, data };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    if (msg.includes("CONFLICT")) {
      return { success: false, error: "CONFLICT" };
    }
    captureUnexpected(err);
    return { success: false, error: msg };
  }
}

/**
 * Remove a service area by ID.
 */
export async function removeBusinessServiceArea(
  id: string,
): Promise<ActionResult> {
  try {
    await businessProfileService.removeServiceArea(id);
    revalidate();
    return { success: true };
  } catch (err) {
    captureUnexpected(err);
    const msg = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: msg };
  }
}
