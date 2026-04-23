import { authFetch } from "./auth-fetch";
import { unwrapEnvelope } from "@/lib/api-envelope";
import type {
  BusinessProfile,
  BusinessProfileView,
  BusinessServiceArea,
  BusinessSocialLink,
  CreateServiceAreaPayload,
  CreateSocialLinkPayload,
  IBusinessProfileService,
  ScoreResult,
  SocialPlatform,
  UpdateAddressPayload,
  UpdateBusinessProfilePayload,
} from "./interfaces/business-profile-service";

/**
 * Settings reads bypass the Next 16 Data Cache. `revalidateTag` on legacy
 * tagged fetches does not reliably invalidate here, so edits to the profile,
 * FAQs, exceptions, agent config, etc. looked like no-ops until the TTL
 * expired. `cache: "no-store"` is cheap on these tiny payloads and keeps the
 * edit → reload loop honest.
 */
class BusinessProfileService implements IBusinessProfileService {
  async getProfile(): Promise<BusinessProfileView> {
    const response = await authFetch("/business-profile", {
      cache: "no-store",
    });
    return unwrapEnvelope<BusinessProfileView>(response);
  }

  async getScore(): Promise<ScoreResult> {
    const response = await authFetch("/business-profile/score", {
      cache: "no-store",
    });
    return unwrapEnvelope<ScoreResult>(response);
  }

  async updateProfile(payload: UpdateBusinessProfilePayload): Promise<BusinessProfile> {
    const response = await authFetch("/business-profile", {
      method: "PUT",
      body: JSON.stringify(payload),
    });
    return unwrapEnvelope<BusinessProfile>(response);
  }

  async updateAddress(payload: UpdateAddressPayload): Promise<BusinessProfileView> {
    const response = await authFetch("/business-profile/address", {
      method: "PUT",
      body: JSON.stringify(payload),
    });
    return unwrapEnvelope<BusinessProfileView>(response);
  }

  async deleteAddress(): Promise<void> {
    const response = await authFetch("/business-profile/address", {
      method: "DELETE",
    });
    await unwrapEnvelope<unknown>(response);
  }

  async addSocialLink(payload: CreateSocialLinkPayload): Promise<BusinessSocialLink> {
    const response = await authFetch("/business-profile/social-links", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return unwrapEnvelope<BusinessSocialLink>(response);
  }

  async removeSocialLink(platform: SocialPlatform): Promise<void> {
    const response = await authFetch(`/business-profile/social-links/${platform}`, {
      method: "DELETE",
    });
    await unwrapEnvelope<unknown>(response);
  }

  async addServiceArea(payload: CreateServiceAreaPayload): Promise<BusinessServiceArea> {
    const response = await authFetch("/business-profile/service-areas", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return unwrapEnvelope<BusinessServiceArea>(response);
  }

  async removeServiceArea(id: string): Promise<void> {
    const response = await authFetch(`/business-profile/service-areas/${id}`, {
      method: "DELETE",
    });
    await unwrapEnvelope<unknown>(response);
  }
}

export const businessProfileService = new BusinessProfileService();
