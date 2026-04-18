import { getTranslations } from "next-intl/server";
import { adminPlanService } from "@/lib/services";
import type { PlanPublic } from "@/lib/services";
import { PlansView } from "./_components/plans-view";

export default async function AdminPlansPage() {
  const tc = await getTranslations("admin.common");

  let plans: readonly PlanPublic[] = [];
  let errorMessage: string | null = null;

  try {
    plans = await adminPlanService.list();
  } catch (err) {
    errorMessage = err instanceof Error ? err.message : tc("loadError");
  }

  return <PlansView errorMessage={errorMessage} initialPlans={plans} />;
}
