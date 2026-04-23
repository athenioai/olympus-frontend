import type { AuthUser } from "./auth-service";

export interface UpdateUserPayload {
  readonly name?: string;
  readonly email?: string;
}

export interface IUserService {
  getMe(): Promise<AuthUser>;
  updateMe(payload: UpdateUserPayload): Promise<AuthUser>;
}
