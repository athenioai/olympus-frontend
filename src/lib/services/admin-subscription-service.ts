import { authFetch } from "./auth-fetch";
import { unwrapEnvelope } from "@/lib/api-envelope";
import { CACHE_TAGS, CACHE_TIMES } from "@/lib/cache-config";
import type { SubscriptionPublic } from "./interfaces/admin-types";
import type {
  CreateSubscriptionPayload,
  IAdminSubscriptionService,
  ListAdminSubscriptionsParams,
  PaginatedAdminSubscriptions,
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

  async list(
    params?: ListAdminSubscriptionsParams,
  ): Promise<PaginatedAdminSubscriptions> {
    const query = new URLSearchParams();
    if (params?.page !== undefined) query.set("page", String(params.page));
    if (params?.limit !== undefined) query.set("limit", String(params.limit));
    if (params?.status) query.set("status", params.status);
    if (params?.planId) query.set("planId", params.planId);
    if (params?.userId) query.set("userId", params.userId);
    if (params?.billingDay !== undefined) {
      query.set("billingDay", String(params.billingDay));
    }
    const qs = query.toString();
    const response = await authFetch(
      qs ? `/admin/subscriptions?${qs}` : "/admin/subscriptions",
      {
        revalidate: CACHE_TIMES.adminSubscriptions,
        tags: [CACHE_TAGS.adminSubscriptions],
      },
    );
    return unwrapEnvelope<PaginatedAdminSubscriptions>(response);
  }

  async getById(id: string): Promise<SubscriptionPublic> {
    const response = await authFetch(
      `/admin/subscriptions/${encodeURIComponent(id)}`,
      {
        revalidate: CACHE_TIMES.adminSubscriptions,
        tags: [CACHE_TAGS.adminSubscriptions],
      },
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
