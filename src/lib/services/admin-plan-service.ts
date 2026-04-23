import { authFetch } from "./auth-fetch";
import { unwrapEnvelope } from "@/lib/api-envelope";
import { CACHE_TAGS, CACHE_TIMES } from "@/lib/cache-config";
import type { PlanPublic } from "./interfaces/admin-types";
import type {
  CreatePlanPayload,
  IAdminPlanService,
  ListAdminPlansParams,
  PaginatedAdminPlans,
  PlanOption,
  UpdatePlanPayload,
} from "./interfaces/admin-plan-service";

class AdminPlanService implements IAdminPlanService {
  async create(payload: CreatePlanPayload): Promise<PlanPublic> {
    const response = await authFetch("/admin/plans", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return unwrapEnvelope<PlanPublic>(response);
  }

  async list(params?: ListAdminPlansParams): Promise<PaginatedAdminPlans> {
    const query = new URLSearchParams();
    if (params?.page !== undefined) query.set("page", String(params.page));
    if (params?.limit !== undefined) query.set("limit", String(params.limit));
    if (params?.search) query.set("search", params.search);
    const qs = query.toString();
    const response = await authFetch(qs ? `/admin/plans?${qs}` : "/admin/plans", {
      revalidate: CACHE_TIMES.adminPlans,
      tags: [CACHE_TAGS.adminPlans],
    });
    return unwrapEnvelope<PaginatedAdminPlans>(response);
  }

  async listOptions(): Promise<readonly PlanOption[]> {
    const response = await authFetch("/admin/plans/options", {
      revalidate: CACHE_TIMES.adminPlans,
      tags: [CACHE_TAGS.adminPlans],
    });
    return unwrapEnvelope<readonly PlanOption[]>(response);
  }

  async getById(id: string): Promise<PlanPublic> {
    const response = await authFetch(
      `/admin/plans/${encodeURIComponent(id)}`,
      {
        revalidate: CACHE_TIMES.adminPlans,
        tags: [CACHE_TAGS.adminPlans],
      },
    );
    return unwrapEnvelope<PlanPublic>(response);
  }

  async update(id: string, payload: UpdatePlanPayload): Promise<PlanPublic> {
    const response = await authFetch(
      `/admin/plans/${encodeURIComponent(id)}`,
      {
        method: "PATCH",
        body: JSON.stringify(payload),
      },
    );
    return unwrapEnvelope<PlanPublic>(response);
  }

  async remove(id: string): Promise<void> {
    const response = await authFetch(
      `/admin/plans/${encodeURIComponent(id)}`,
      { method: "DELETE" },
    );
    await unwrapEnvelope<unknown>(response);
  }
}

export const adminPlanService = new AdminPlanService();
