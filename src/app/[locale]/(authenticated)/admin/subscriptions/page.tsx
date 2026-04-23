import { getTranslations } from "next-intl/server";
import {
  adminPlanService,
  adminSubscriptionService,
  adminUserService,
} from "@/lib/services";
import type {
  AdminUserOption,
  ListAdminSubscriptionsParams,
  PaginatedAdminSubscriptions,
  PlanOption,
  SubscriptionStatus,
} from "@/lib/services";
import { SubscriptionsView } from "./_components/subscriptions-view";

const DEFAULT_LIMIT = 20;

interface AdminSubscriptionsSearchParams {
  readonly page?: string;
  readonly status?: string;
  readonly planId?: string;
  readonly userId?: string;
  readonly billingDay?: string;
}

export default async function AdminSubscriptionsPage({
  searchParams,
}: {
  readonly searchParams: Promise<AdminSubscriptionsSearchParams>;
}) {
  const tc = await getTranslations("admin.common");
  const rawParams = await searchParams;
  const parsed = parseSearchParams(rawParams);

  let subscriptionsPage: PaginatedAdminSubscriptions = {
    items: [],
    total: 0,
    page: parsed.page ?? 1,
    limit: DEFAULT_LIMIT,
  };
  let users: readonly AdminUserOption[] = [];
  let plans: readonly PlanOption[] = [];
  let errorMessage: string | null = null;

  try {
    [subscriptionsPage, users, plans] = await Promise.all([
      adminSubscriptionService.list({ ...parsed, limit: DEFAULT_LIMIT }),
      adminUserService.listOptions(),
      adminPlanService.listOptions(),
    ]);
  } catch (err) {
    errorMessage = err instanceof Error ? err.message : tc("loadError");
  }

  return (
    <SubscriptionsView
      errorMessage={errorMessage}
      filters={{
        status: parsed.status ?? "",
        planId: parsed.planId ?? "",
        userId: parsed.userId ?? "",
        billingDay:
          parsed.billingDay !== undefined ? String(parsed.billingDay) : "",
      }}
      initialPage={subscriptionsPage}
      initialPlans={plans}
      initialUsers={users}
    />
  );
}

function parseSearchParams(
  raw: AdminSubscriptionsSearchParams,
): ListAdminSubscriptionsParams {
  const page = Math.max(1, Number.parseInt(raw.page ?? "1", 10) || 1);
  const status: SubscriptionStatus | undefined =
    raw.status === "active" ||
    raw.status === "suspended" ||
    raw.status === "cancelled"
      ? raw.status
      : undefined;
  const planId = raw.planId?.trim();
  const userId = raw.userId?.trim();
  const dayParsed = raw.billingDay
    ? Number.parseInt(raw.billingDay, 10)
    : Number.NaN;
  const billingDay =
    Number.isFinite(dayParsed) && dayParsed >= 1 && dayParsed <= 28
      ? dayParsed
      : undefined;

  return {
    page,
    ...(status ? { status } : {}),
    ...(planId ? { planId } : {}),
    ...(userId ? { userId } : {}),
    ...(billingDay !== undefined ? { billingDay } : {}),
  };
}
