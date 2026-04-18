import { authFetch } from "./auth-fetch";
import { unwrapEnvelope } from "@/lib/api-envelope";
import { CACHE_TAGS, CACHE_TIMES } from "@/lib/cache-config";
import type {
  AdminAppointment,
  AdminCalendarConfig,
  AdminChat,
  AdminChatMessage,
  AdminUserPublic,
  UpdateCalendarConfigPayload,
  UserDashboardSummary,
} from "./interfaces/admin-types";
import type {
  CreateAdminUserPayload,
  IAdminUserService,
  SeedHolidaysPayload,
  UpdateAdminUserPayload,
} from "./interfaces/admin-user-service";

class AdminUserService implements IAdminUserService {
  async create(payload: CreateAdminUserPayload): Promise<AdminUserPublic> {
    const response = await authFetch("/admin/users", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return unwrapEnvelope<AdminUserPublic>(response);
  }

  async list(): Promise<readonly AdminUserPublic[]> {
    const response = await authFetch("/admin/users", {
      revalidate: CACHE_TIMES.adminUsers,
      tags: [CACHE_TAGS.adminUsers],
    });
    return unwrapEnvelope<readonly AdminUserPublic[]>(response);
  }

  async getById(id: string): Promise<AdminUserPublic> {
    const response = await authFetch(
      `/admin/users/${encodeURIComponent(id)}`,
      {
        revalidate: CACHE_TIMES.adminUsers,
        tags: [CACHE_TAGS.adminUsers, CACHE_TAGS.adminUserDetail],
      },
    );
    return unwrapEnvelope<AdminUserPublic>(response);
  }

  async update(
    id: string,
    payload: UpdateAdminUserPayload,
  ): Promise<AdminUserPublic> {
    const response = await authFetch(
      `/admin/users/${encodeURIComponent(id)}`,
      {
        method: "PATCH",
        body: JSON.stringify(payload),
      },
    );
    return unwrapEnvelope<AdminUserPublic>(response);
  }

  async seedHolidays(payload?: SeedHolidaysPayload): Promise<unknown> {
    const response = await authFetch("/admin/users/seed-holidays", {
      method: "POST",
      body: JSON.stringify(payload ?? {}),
    });
    return unwrapEnvelope<unknown>(response);
  }

  async getDashboard(id: string): Promise<UserDashboardSummary> {
    const response = await authFetch(
      `/admin/users/${encodeURIComponent(id)}/dashboard`,
      {
        revalidate: CACHE_TIMES.adminUserDetail,
        tags: [CACHE_TAGS.adminUserDetail],
      },
    );
    return unwrapEnvelope<UserDashboardSummary>(response);
  }

  async getAppointments(id: string): Promise<readonly AdminAppointment[]> {
    const response = await authFetch(
      `/admin/users/${encodeURIComponent(id)}/appointments`,
      {
        revalidate: CACHE_TIMES.adminUserDetail,
        tags: [CACHE_TAGS.adminUserDetail],
      },
    );
    return unwrapEnvelope<readonly AdminAppointment[]>(response);
  }

  async getChats(id: string): Promise<readonly AdminChat[]> {
    const response = await authFetch(
      `/admin/users/${encodeURIComponent(id)}/chats`,
      {
        revalidate: CACHE_TIMES.adminUserDetail,
        tags: [CACHE_TAGS.adminUserDetail],
      },
    );
    return unwrapEnvelope<readonly AdminChat[]>(response);
  }

  async getChatMessages(
    id: string,
    sessionId: string,
  ): Promise<readonly AdminChatMessage[]> {
    // Messages stay uncached: admins expect the freshest thread when they
    // click into a chat, and stale messages undermine moderation reviews.
    const response = await authFetch(
      `/admin/users/${encodeURIComponent(id)}/chats/${encodeURIComponent(sessionId)}/messages`,
      { cache: "no-store" },
    );
    return unwrapEnvelope<readonly AdminChatMessage[]>(response);
  }

  async getCalendarConfig(id: string): Promise<AdminCalendarConfig | null> {
    const response = await authFetch(
      `/admin/users/${encodeURIComponent(id)}/calendar-config`,
      {
        revalidate: CACHE_TIMES.adminUserDetail,
        tags: [CACHE_TAGS.adminUserDetail],
      },
    );
    return unwrapNullable<AdminCalendarConfig>(response);
  }

  async updateCalendarConfig(
    id: string,
    payload: UpdateCalendarConfigPayload,
  ): Promise<AdminCalendarConfig> {
    const response = await authFetch(
      `/admin/users/${encodeURIComponent(id)}/calendar-config`,
      {
        method: "PUT",
        body: JSON.stringify(payload),
      },
    );
    return unwrapEnvelope<AdminCalendarConfig>(response);
  }
}

async function unwrapNullable<T>(response: Response): Promise<T | null> {
  const envelope: {
    success: boolean;
    data: T | null;
    error: { code: string; message: string } | null;
  } = await response.json();
  if (!envelope.success) {
    throw new Error(envelope.error?.message ?? "UNKNOWN_ERROR");
  }
  return envelope.data;
}

export const adminUserService = new AdminUserService();
