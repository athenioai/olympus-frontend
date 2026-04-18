import { getTranslations } from "next-intl/server";
import { adminPlanService, adminUserService } from "@/lib/services";
import type { AdminUserPublic, PlanPublic } from "@/lib/services";
import { UsersView } from "./_components/users-view";

export default async function AdminUsersPage() {
  const tc = await getTranslations("admin.common");

  let users: readonly AdminUserPublic[] = [];
  let plans: readonly PlanPublic[] = [];
  let errorMessage: string | null = null;

  try {
    [users, plans] = await Promise.all([
      adminUserService.list(),
      adminPlanService.list(),
    ]);
  } catch (err) {
    errorMessage = err instanceof Error ? err.message : tc("loadError");
  }

  return (
    <UsersView
      errorMessage={errorMessage}
      initialPlans={plans}
      initialUsers={users}
    />
  );
}
