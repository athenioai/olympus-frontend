import { authFetch } from "./auth-fetch";
import { unwrapEnvelope } from "@/lib/api-envelope";
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
    const response = await authFetch("/admin/plans", { cache: "no-store" });
    return unwrapEnvelope<readonly PlanPublic[]>(response);
  }

  async getById(id: string): Promise<PlanPublic> {
    const response = await authFetch(
      `/admin/plans/${encodeURIComponent(id)}`,
      { cache: "no-store" },
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
