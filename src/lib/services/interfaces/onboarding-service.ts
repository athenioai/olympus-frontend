import type { AuthUser } from "./auth-service";

export interface OnboardingInfo {
  readonly email: string;
}

export interface SetPasswordPayload {
  readonly name: string;
  readonly password: string;
}

export interface SetPasswordResponse {
  readonly user: AuthUser;
  readonly accessToken: string;
  readonly refreshToken: string;
}

export interface IOnboardingService {
  getInfo(slug: string): Promise<OnboardingInfo>;
  setPassword(
    slug: string,
    payload: SetPasswordPayload,
  ): Promise<SetPasswordResponse>;
}
