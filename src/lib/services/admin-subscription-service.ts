import { authFetch } from "./auth-fetch";
import { unwrapEnvelope } from "@/lib/api-envelope";
import { CACHE_TAGS, CACHE_TIMES } from "@/lib/cache-config";
import type { SubscriptionPublic } from "./interfaces/admin-types";
import type {
  IAdminSubscriptionService,
  ListAdminSubscriptionsParams,
  PaginatedAdminSubscriptions,
  UpdateSubscriptionStatusPayload,
} from "./interfaces/admin-subscription-service";

function buildQuery(params?: ListAdminSubscriptionsParams): string {
  const search = new URLSearchParams();
  if (params?.page) search.set("page", String(params.page));
  if (params?.limit) search.set("limit", String(params.limit));
  if (params?.status) search.set("status", params.status);
  if (params?.planId) search.set("planId", params.planId);
  if (params?.userId) search.set("userId", params.userId);
  return search.toString();
}

class AdminSubscriptionService implements IAdminSubscriptionService {
  async list(
    params?: ListAdminSubscriptionsParams,
  ): Promise<PaginatedAdminSubscriptions> {
    const query = buildQuery(params);
    const path = query
      ? `/admin/subscriptions?${query}`
      : "/admin/subscriptions";
    const response = await authFetch(path, {
      revalidate: CACHE_TIMES.adminSubscriptions,
      tags: [CACHE_TAGS.adminSubscriptions],
    });
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

  async updateStatus(
    id: string,
    payload: UpdateSubscriptionStatusPayload,
  ): Promise<SubscriptionPublic> {
    const response = await authFetch(
      `/admin/subscriptions/${encodeURIComponent(id)}`,
      { method: "PATCH", body: JSON.stringify(payload) },
    );
    return unwrapEnvelope<SubscriptionPublic>(response);
  }

  async subscribe(userId: string, planId: string, cpfCnpj: string): Promise<SubscriptionPublic> {
    const response = await authFetch(
      `/admin/subscriptions/${encodeURIComponent(userId)}/subscribe`,
      { method: "POST", body: JSON.stringify({ planId, cpfCnpj }) },
    );
    return unwrapEnvelope<SubscriptionPublic>(response);
  }

  async upgrade(userId: string, planId: string): Promise<SubscriptionPublic> {
    const response = await authFetch(
      `/admin/subscriptions/${encodeURIComponent(userId)}/upgrade`,
      { method: "POST", body: JSON.stringify({ planId }) },
    );
    return unwrapEnvelope<SubscriptionPublic>(response);
  }

  async downgrade(userId: string, planId: string): Promise<SubscriptionPublic> {
    const response = await authFetch(
      `/admin/subscriptions/${encodeURIComponent(userId)}/downgrade`,
      { method: "POST", body: JSON.stringify({ planId }) },
    );
    return unwrapEnvelope<SubscriptionPublic>(response);
  }

  async cancel(userId: string): Promise<SubscriptionPublic> {
    const response = await authFetch(
      `/admin/subscriptions/${encodeURIComponent(userId)}/cancel`,
      { method: "POST" },
    );
    return unwrapEnvelope<SubscriptionPublic>(response);
  }
}

export const adminSubscriptionService = new AdminSubscriptionService();
