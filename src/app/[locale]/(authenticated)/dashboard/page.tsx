import { financeService } from "@/lib/services";
import type { FinanceDashboard } from "@/lib/services";
import { DashboardView } from "./_components/dashboard-view";

/**
 * Dashboard page — Server Component that fetches finance metrics
 * and delegates rendering to the client DashboardView.
 */
export default async function DashboardPage() {
  let data: FinanceDashboard;

  try {
    data = await financeService.getFinanceDashboard();
  } catch {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-sm text-on-surface-variant">
          Failed to load dashboard data. Please try again later.
        </p>
      </div>
    );
  }

  return <DashboardView data={data} />;
}
