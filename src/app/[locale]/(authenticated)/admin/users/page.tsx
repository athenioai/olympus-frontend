import { getTranslations } from "next-intl/server";
import { adminPlanService, adminUserService } from "@/lib/services";
import type {
  ListAdminUsersParams,
  OnboardingStatus,
  PaginatedAdminUsers,
  PlanOption,
} from "@/lib/services";
import { UsersView } from "./_components/users-view";

const DEFAULT_LIMIT = 20;

interface AdminUsersSearchParams {
  readonly page?: string;
  readonly search?: string;
  readonly planId?: string;
  readonly onboardingStatus?: string;
}

export default async function AdminUsersPage({
  searchParams,
}: {
  readonly searchParams: Promise<AdminUsersSearchParams>;
}) {
  const tc = await getTranslations("admin.common");
  const rawParams = await searchParams;
  const parsed = parseSearchParams(rawParams);

  let usersPage: PaginatedAdminUsers = {
    items: [],
    total: 0,
    page: parsed.page ?? 1,
    limit: DEFAULT_LIMIT,
  };
  let plans: readonly PlanOption[] = [];
  let errorMessage: string | null = null;

  try {
    const [usersResult, plansResult] = await Promise.all([
      adminUserService.list({ ...parsed, limit: DEFAULT_LIMIT }),
      adminPlanService.listOptions(),
    ]);
    usersPage = usersResult;
    plans = plansResult;
  } catch (err) {
    errorMessage = err instanceof Error ? err.message : tc("loadError");
  }

  return (
    <UsersView
      errorMessage={errorMessage}
      filters={{
        search: parsed.search ?? "",
        planId: parsed.planId ?? "",
        onboardingStatus: parsed.onboardingStatus ?? "",
      }}
      initialPage={usersPage}
      initialPlans={plans}
    />
  );
}

function parseSearchParams(
  raw: AdminUsersSearchParams,
): ListAdminUsersParams {
  const page = Math.max(1, Number.parseInt(raw.page ?? "1", 10) || 1);
  const search = raw.search?.trim();
  const planId = raw.planId?.trim();
  const onboardingStatus: OnboardingStatus | undefined =
    raw.onboardingStatus === "pending" || raw.onboardingStatus === "completed"
      ? raw.onboardingStatus
      : undefined;

  return {
    page,
    ...(search ? { search } : {}),
    ...(planId ? { planId } : {}),
    ...(onboardingStatus ? { onboardingStatus } : {}),
  };
}
