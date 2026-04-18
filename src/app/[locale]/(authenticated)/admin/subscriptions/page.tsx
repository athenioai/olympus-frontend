import { getTranslations } from "next-intl/server";
import {
  adminPlanService,
  adminSubscriptionService,
  adminUserService,
} from "@/lib/services";
import type {
  AdminUserPublic,
  PlanPublic,
  SubscriptionPublic,
} from "@/lib/services";
import { SubscriptionsView } from "./_components/subscriptions-view";

export default async function AdminSubscriptionsPage() {
  const tc = await getTranslations("admin.common");

  let subscriptions: readonly SubscriptionPublic[] = [];
  let users: readonly AdminUserPublic[] = [];
  let plans: readonly PlanPublic[] = [];
  let errorMessage: string | null = null;

  try {
    [subscriptions, users, plans] = await Promise.all([
      adminSubscriptionService.list(),
      adminUserService.list(),
      adminPlanService.list(),
    ]);
  } catch (err) {
    errorMessage = err instanceof Error ? err.message : tc("loadError");
  }

  return (
    <SubscriptionsView
      errorMessage={errorMessage}
      initialPlans={plans}
      initialSubscriptions={subscriptions}
      initialUsers={users}
    />
  );
}
