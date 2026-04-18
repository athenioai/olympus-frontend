import { cookies } from "next/headers";
import { ApiError, unwrapEnvelope } from "@/lib/api-envelope";
import { CACHE_TAGS, CACHE_TIMES } from "@/lib/cache-config";
import { authFetch } from "./auth-fetch";
import type { AgentAvatarAdmin } from "./interfaces/admin-types";
import type {
  CreateAgentAvatarPayload,
  IAdminAgentAvatarService,
  UpdateAgentAvatarPayload,
} from "./interfaces/admin-agent-avatar-service";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

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
    formData.append("name", payload.name);
    if (payload.sortOrder !== undefined) {
      formData.append("sortOrder", String(payload.sortOrder));
    }
    if (payload.isActive !== undefined) {
      formData.append("isActive", String(payload.isActive));
    }

    const response = await fetch(`${API_URL}/admin/agent-avatars`, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
      body: formData,
    });
    return unwrapEnvelope<AgentAvatarAdmin>(response);
  }

  async list(): Promise<readonly AgentAvatarAdmin[]> {
    const response = await authFetch("/admin/agent-avatars", {
      revalidate: CACHE_TIMES.adminAvatars,
      tags: [CACHE_TAGS.adminAvatars],
    });
    return unwrapEnvelope<readonly AgentAvatarAdmin[]>(response);
  }

  async update(
    id: string,
    payload: UpdateAgentAvatarPayload,
  ): Promise<AgentAvatarAdmin> {
    const response = await authFetch(
      `/admin/agent-avatars/${encodeURIComponent(id)}`,
      {
        method: "PATCH",
        body: JSON.stringify(payload),
      },
    );
    return unwrapEnvelope<AgentAvatarAdmin>(response);
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
