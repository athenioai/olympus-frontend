import { authFetch } from "./auth-fetch";
import { unwrapEnvelope } from "@/lib/api-envelope";
import type { AuthUser } from "./interfaces/auth-service";
import type {
  IUserService,
  UpdateUserPayload,
} from "./interfaces/user-service";

class UserService implements IUserService {
  async getMe(): Promise<AuthUser> {
    const response = await authFetch("/auth/me", { cache: "no-store" });
    return unwrapEnvelope<AuthUser>(response);
  }

  async updateMe(payload: UpdateUserPayload): Promise<AuthUser> {
    const response = await authFetch("/users/me", {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
    return unwrapEnvelope<AuthUser>(response);
  }
}

export const userService = new UserService();
