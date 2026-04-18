import { getTranslations } from "next-intl/server";
import {
  adminInvoiceService,
  adminSubscriptionService,
  adminUserService,
} from "@/lib/services";
import type {
  AdminInvoicePublic,
  AdminInvoiceSummary,
  AdminUserPublic,
  SubscriptionPublic,
} from "@/lib/services";
import { InvoicesView } from "./_components/invoices-view";

export default async function AdminInvoicesPage() {
  const tc = await getTranslations("admin.common");

  let invoices: readonly AdminInvoicePublic[] = [];
  let summary: AdminInvoiceSummary | null = null;
  let users: readonly AdminUserPublic[] = [];
  let subscriptions: readonly SubscriptionPublic[] = [];
  let errorMessage: string | null = null;

  try {
    [invoices, summary, users, subscriptions] = await Promise.all([
      adminInvoiceService.list(),
      adminInvoiceService.getDashboard(),
      adminUserService.list(),
      adminSubscriptionService.list(),
    ]);
  } catch (err) {
    errorMessage = err instanceof Error ? err.message : tc("loadError");
  }

  return (
    <InvoicesView
      errorMessage={errorMessage}
      initialInvoices={invoices}
      initialSubscriptions={subscriptions}
      initialSummary={summary}
      initialUsers={users}
    />
  );
}
