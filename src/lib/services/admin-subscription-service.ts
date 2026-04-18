import { authFetch } from "./auth-fetch";
import { unwrapEnvelope } from "@/lib/api-envelope";
import type { SubscriptionPublic } from "./interfaces/admin-types";
import type {
  CreateSubscriptionPayload,
  IAdminSubscriptionService,
  UpdateSubscriptionPayload,
} from "./interfaces/admin-subscription-service";

class AdminSubscriptionService implements IAdminSubscriptionService {
  async create(
    payload: CreateSubscriptionPayload,
  ): Promise<SubscriptionPublic> {
    const response = await authFetch("/admin/subscriptions", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return unwrapEnvelope<SubscriptionPublic>(response);
  }

  async list(): Promise<readonly SubscriptionPublic[]> {
    const response = await authFetch("/admin/subscriptions", {
      cache: "no-store",
    });
    return unwrapEnvelope<readonly SubscriptionPublic[]>(response);
  }

  async getById(id: string): Promise<SubscriptionPublic> {
    const response = await authFetch(
      `/admin/subscriptions/${encodeURIComponent(id)}`,
      { cache: "no-store" },
    );
    return unwrapEnvelope<SubscriptionPublic>(response);
  }

  async update(
    id: string,
    payload: UpdateSubscriptionPayload,
  ): Promise<SubscriptionPublic> {
    const response = await authFetch(
      `/admin/subscriptions/${encodeURIComponent(id)}`,
      {
        method: "PATCH",
        body: JSON.stringify(payload),
      },
    );
    return unwrapEnvelope<SubscriptionPublic>(response);
  }
}

export const adminSubscriptionService = new AdminSubscriptionService();
