import { authFetch } from "./auth-fetch";
import { unwrapEnvelope } from "@/lib/api-envelope";
import type { PlatformMetrics } from "./interfaces/admin-types";
import type { IAdminDashboardService } from "./interfaces/admin-dashboard-service";

class AdminDashboardService implements IAdminDashboardService {
  async getMetrics(): Promise<PlatformMetrics> {
    const response = await authFetch("/admin/dashboard", { cache: "no-store" });
    return unwrapEnvelope<PlatformMetrics>(response);
  }
}

export const adminDashboardService = new AdminDashboardService();
