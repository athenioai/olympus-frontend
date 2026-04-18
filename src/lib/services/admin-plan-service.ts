import { authFetch } from "./auth-fetch";
import { unwrapEnvelope } from "@/lib/api-envelope";
import { CACHE_TAGS, CACHE_TIMES } from "@/lib/cache-config";
import type { PlanPublic } from "./interfaces/admin-types";
import type {
  CreatePlanPayload,
  IAdminPlanService,
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

  async list(): Promise<readonly PlanPublic[]> {
    const response = await authFetch("/admin/plans", {
      revalidate: CACHE_TIMES.adminPlans,
      tags: [CACHE_TAGS.adminPlans],
    });
    return unwrapEnvelope<readonly PlanPublic[]>(response);
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
