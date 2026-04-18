import { ApiError, unwrapEnvelope } from "@/lib/api-envelope";
import type {
  IOnboardingService,
  OnboardingInfo,
  SetPasswordPayload,
  SetPasswordResponse,
} from "./interfaces/onboarding-service";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

class OnboardingService implements IOnboardingService {
  /**
   * Fetch the email linked to an onboarding slug.
   * @throws ApiError with status 404 if slug does not exist
   * @throws ApiError with status 410 if slug was already consumed
   */
  async getInfo(slug: string): Promise<OnboardingInfo> {
    const response = await fetch(
      `${API_URL}/onboarding/${encodeURIComponent(slug)}/info`,
      { cache: "no-store" },
    );
    return readOrThrow<OnboardingInfo>(response);
  }

  /**
   * Finalize the onboarding password step.
   * @throws ApiError with status 400 if password does not meet strength rules
   * @throws ApiError with status 404/410 for invalid/consumed slugs
   */
  async setPassword(
    slug: string,
    payload: SetPasswordPayload,
  ): Promise<SetPasswordResponse> {
    const response = await fetch(
      `${API_URL}/onboarding/${encodeURIComponent(slug)}/set-password`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );
    return readOrThrow<SetPasswordResponse>(response);
  }
}

async function readOrThrow<T>(response: Response): Promise<T> {
  if (response.ok) {
    return unwrapEnvelope<T>(response);
  }
  const envelope = await response.json().catch(() => null);
  const message = envelope?.error?.message;
  const errorText = Array.isArray(message) ? message[0] : message;
  throw new ApiError(
    errorText ?? "ONBOARDING_FAILED",
    envelope?.error?.code ?? "ONBOARDING_FAILED",
    response.status,
  );
}

export const onboardingService = new OnboardingService();
