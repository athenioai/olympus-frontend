import { cookies } from "next/headers";
import { ApiError, unwrapEnvelope } from "@/lib/api-envelope";
import { CACHE_TAGS, CACHE_TIMES } from "@/lib/cache-config";
import { API_URL } from "@/lib/env";
import { authFetch } from "./auth-fetch";
import type { AgentAvatarAdmin } from "./interfaces/admin-types";
import type {
  CreateAgentAvatarPayload,
  IAdminAgentAvatarService,
  ListAdminAgentAvatarsParams,
} from "./interfaces/admin-agent-avatar-service";

class AdminAgentAvatarService implements IAdminAgentAvatarService {
  /**
   * Upload a new avatar. Backend expects multipart/form-data — we
   * build the FormData here because authFetch relies on the caller
   * for body serialization and multipart precludes JSON headers.
   */
  async create(payload: CreateAgentAvatarPayload): Promise<AgentAvatarAdmin> {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get("access_token")?.value;
    if (!accessToken) {
      throw new ApiError("NOT_AUTHENTICATED", "AUTH_TOKEN_003", 401);
    }

    const formData = new FormData();
    formData.append("file", payload.file);
    if (payload.sortOrder !== undefined) {
      formData.append("sortOrder", String(payload.sortOrder));
    }

    const response = await fetch(`${API_URL}/admin/agent-avatars`, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
      body: formData,
    });
    return unwrapEnvelope<AgentAvatarAdmin>(response);
  }

  async list(
    params?: ListAdminAgentAvatarsParams,
  ): Promise<readonly AgentAvatarAdmin[]> {
    const query = new URLSearchParams();
    if (params?.includeDeleted !== undefined) {
      query.set("includeDeleted", String(params.includeDeleted));
    }
    const qs = query.toString();
    const response = await authFetch(
      qs ? `/admin/agent-avatars?${qs}` : "/admin/agent-avatars",
      {
        revalidate: CACHE_TIMES.adminAvatars,
        tags: [CACHE_TAGS.adminAvatars],
      },
    );
    return unwrapEnvelope<readonly AgentAvatarAdmin[]>(response);
  }

  async remove(id: string): Promise<void> {
    const response = await authFetch(
      `/admin/agent-avatars/${encodeURIComponent(id)}`,
      { method: "DELETE" },
    );
    await unwrapEnvelope<unknown>(response);
  }
}

export const adminAgentAvatarService = new AdminAgentAvatarService();
