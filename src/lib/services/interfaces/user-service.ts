import type { AuthUser } from "./auth-service";

export type WorkType = "services" | "sales" | "hybrid";

export interface UpdateUserPayload {
  readonly name?: string;
  readonly workType?: WorkType;
}

export interface IUserService {
  getMe(): Promise<AuthUser>;
  updateMe(payload: UpdateUserPayload): Promise<AuthUser>;
}
