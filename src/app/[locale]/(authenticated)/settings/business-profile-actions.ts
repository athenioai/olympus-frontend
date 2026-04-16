"use server";

import { revalidatePath } from "next/cache";
import {
  businessProfileService,
} from "@/lib/services";
import type {
  BusinessProfileView,
  BusinessProfile,
  BusinessSocialLink,
  BusinessServiceArea,
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

/**
 * Fetch the full business profile view.
 */
export async function fetchBusinessProfile(): Promise<ActionResult<BusinessProfileView>> {
  try {
    const data = await businessProfileService.getProfile();
    return { success: true, data };
  } catch (err) {
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
    const msg = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: msg };
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
    const msg = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: msg };
  }
}
