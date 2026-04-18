import { ApiError, unwrapEnvelope } from "@/lib/api-envelope";
import { API_URL } from "@/lib/env";
import type {
  ISignupService,
  SignupBeginPayload,
  SignupBeginResponse,
} from "./interfaces/signup-service";

class SignupService implements ISignupService {
  /**
   * Start the self-service signup. Idempotent: re-sending with a
   * previously-used email resends the onboarding link.
   * @throws ApiError with status 409 if the email already has an active account
   * @throws ApiError with status 400 for invalid email payloads
   */
  async begin(payload: SignupBeginPayload): Promise<SignupBeginResponse> {
    const response = await fetch(`${API_URL}/signup/begin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok && response.status !== 200) {
      const envelope = await response.json().catch(() => null);
      const message = envelope?.error?.message;
      const errorText = Array.isArray(message) ? message[0] : message;
      throw new ApiError(
        errorText ?? "SIGNUP_FAILED",
        envelope?.error?.code ?? "SIGNUP_FAILED",
        response.status,
      );
    }

    return unwrapEnvelope<SignupBeginResponse>(response);
  }
}

export const signupService = new SignupService();
