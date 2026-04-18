import { authFetch } from "./auth-fetch";
import { unwrapEnvelope } from "@/lib/api-envelope";
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
    const response = await authFetch("/admin/users", { cache: "no-store" });
    return unwrapEnvelope<readonly AdminUserPublic[]>(response);
  }

  async getById(id: string): Promise<AdminUserPublic> {
    const response = await authFetch(
      `/admin/users/${encodeURIComponent(id)}`,
      { cache: "no-store" },
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
      { cache: "no-store" },
    );
    return unwrapEnvelope<UserDashboardSummary>(response);
  }

  async getAppointments(id: string): Promise<readonly AdminAppointment[]> {
    const response = await authFetch(
      `/admin/users/${encodeURIComponent(id)}/appointments`,
      { cache: "no-store" },
    );
    return unwrapEnvelope<readonly AdminAppointment[]>(response);
  }

  async getChats(id: string): Promise<readonly AdminChat[]> {
    const response = await authFetch(
      `/admin/users/${encodeURIComponent(id)}/chats`,
      { cache: "no-store" },
    );
    return unwrapEnvelope<readonly AdminChat[]>(response);
  }

  async getChatMessages(
    id: string,
    sessionId: string,
  ): Promise<readonly AdminChatMessage[]> {
    const response = await authFetch(
      `/admin/users/${encodeURIComponent(id)}/chats/${encodeURIComponent(sessionId)}/messages`,
      { cache: "no-store" },
    );
    return unwrapEnvelope<readonly AdminChatMessage[]>(response);
  }

  async getCalendarConfig(id: string): Promise<AdminCalendarConfig | null> {
    const response = await authFetch(
      `/admin/users/${encodeURIComponent(id)}/calendar-config`,
      { cache: "no-store" },
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
