import type { PlatformMetrics } from "./admin-types";

export interface IAdminDashboardService {
  getMetrics(): Promise<PlatformMetrics>;
}
