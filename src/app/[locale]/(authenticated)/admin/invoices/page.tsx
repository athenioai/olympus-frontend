import { getTranslations } from "next-intl/server";
import {
  adminInvoiceService,
  adminSubscriptionService,
  adminUserService,
} from "@/lib/services";
import type {
  AdminInvoiceStatus,
  AdminInvoiceSummary,
  AdminUserOption,
  ListAdminInvoicesParams,
  PaginatedAdminInvoices,
  SubscriptionPublic,
} from "@/lib/services";
import { InvoicesView } from "./_components/invoices-view";

const DEFAULT_LIMIT = 20;
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

interface AdminInvoicesSearchParams {
  readonly page?: string;
  readonly status?: string;
  readonly userId?: string;
  readonly dueDateFrom?: string;
  readonly dueDateTo?: string;
}

export default async function AdminInvoicesPage({
  searchParams,
}: {
  readonly searchParams: Promise<AdminInvoicesSearchParams>;
}) {
  const tc = await getTranslations("admin.common");
  const rawParams = await searchParams;
  const parsed = parseSearchParams(rawParams);

  let invoicesPage: PaginatedAdminInvoices = {
    items: [],
    total: 0,
    page: parsed.page ?? 1,
    limit: DEFAULT_LIMIT,
  };
  let summary: AdminInvoiceSummary | null = null;
  let users: readonly AdminUserOption[] = [];
  let subscriptions: readonly SubscriptionPublic[] = [];
  let errorMessage: string | null = null;

  try {
    const [
      invoicesResult,
      summaryResult,
      usersResult,
      subscriptionsResult,
    ] = await Promise.all([
      adminInvoiceService.list({ ...parsed, limit: DEFAULT_LIMIT }),
      adminInvoiceService.getDashboard(),
      adminUserService.listOptions(),
      // TEMP: paginated list; invoice form dropdown filters active subs by
      // userId locally. Until a `/admin/subscriptions/options` endpoint
      // exists, fetch a ceiling of active ones.
      adminSubscriptionService.list({
        page: 1,
        limit: 100,
        status: "active",
      }),
    ]);
    invoicesPage = invoicesResult;
    summary = summaryResult;
    users = usersResult;
    subscriptions = subscriptionsResult.items;
  } catch (err) {
    errorMessage = err instanceof Error ? err.message : tc("loadError");
  }

  return (
    <InvoicesView
      errorMessage={errorMessage}
      filters={{
        status: parsed.status ?? "",
        userId: parsed.userId ?? "",
        dueDateFrom: parsed.dueDateFrom ?? "",
        dueDateTo: parsed.dueDateTo ?? "",
      }}
      initialPage={invoicesPage}
      initialSubscriptions={subscriptions}
      initialSummary={summary}
      initialUsers={users}
    />
  );
}

function parseSearchParams(
  raw: AdminInvoicesSearchParams,
): ListAdminInvoicesParams {
  const page = Math.max(1, Number.parseInt(raw.page ?? "1", 10) || 1);
  const status: AdminInvoiceStatus | undefined =
    raw.status === "pending" ||
    raw.status === "paid" ||
    raw.status === "overdue" ||
    raw.status === "cancelled"
      ? raw.status
      : undefined;
  const userId = raw.userId?.trim();
  const dueDateFrom =
    raw.dueDateFrom && ISO_DATE_RE.test(raw.dueDateFrom)
      ? raw.dueDateFrom
      : undefined;
  const dueDateTo =
    raw.dueDateTo && ISO_DATE_RE.test(raw.dueDateTo)
      ? raw.dueDateTo
      : undefined;

  return {
    page,
    ...(status ? { status } : {}),
    ...(userId ? { userId } : {}),
    ...(dueDateFrom ? { dueDateFrom } : {}),
    ...(dueDateTo ? { dueDateTo } : {}),
  };
}
