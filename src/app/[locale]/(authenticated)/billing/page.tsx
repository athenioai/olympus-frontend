import { getTranslations } from "next-intl/server";
import { ApiError } from "@/lib/api-envelope";
import { captureUnexpected } from "@/lib/observability/capture";
import { subscriptionsService } from "@/lib/services";
import type { SubscriptionStatus } from "@/lib/services";
import { getPlanOptions } from "@/lib/services/plan-options-source";
import { PlanGrid } from "./_components/plan-grid";
import { SubscriptionOverview } from "./_components/subscription-overview";

/**
 * Statuses where the user has no live subscription and can re-subscribe.
 * Backend keeps the historical record (so /me returns 200) but the user
 * should see the plan grid, not an overview of a dead subscription.
 *
 * `cancelled` is intentionally NOT terminal: the user still has access
 * until `currentPeriodEnd`, after which the backend transitions them to
 * `ended`.
 */
const TERMINAL_STATUSES: ReadonlySet<SubscriptionStatus> = new Set([
  "ended",
  "refunded",
]);

/**
 * /billing -- server component branching on subscription state.
 *  - 404 from /subscriptions/me           -> <PlanGrid> (Case A).
 *  - 200 with terminal status (ended /
 *    refunded)                            -> <PlanGrid> (re-subscribe flow).
 *  - 200 with live status (active /
 *    past_due / suspended / cancelled)    -> <SubscriptionOverview> (Case B).
 *  - any other failure                    -> loadFailed message.
 */
export default async function BillingPage() {
  const t = await getTranslations("billing");

  let subscription: Awaited<
    ReturnType<typeof subscriptionsService.getMe>
  > | null = null;
  try {
    subscription = await subscriptionsService.getMe();
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      // Case A -- render plan grid below
    } else {
      captureUnexpected(err);
      return (
        <div className="flex min-h-[400px] items-center justify-center">
          <p className="text-sm text-on-surface-variant">
            {t("loadFailed")}
          </p>
        </div>
      );
    }
  }

  const isTerminal =
    subscription !== null && TERMINAL_STATUSES.has(subscription.status);

  if (subscription === null || isTerminal) {
    const plans = await getPlanOptions();
    return (
      <div className="mx-auto max-w-5xl">
        <PlanGrid plans={plans} />
      </div>
    );
  }

  // Live subscription -- load payments and plan catalog concurrently.
  const [paymentsResult, plansResult] = await Promise.allSettled([
    subscriptionsService.listMyPayments(),
    getPlanOptions(),
  ]);

  const payments =
    paymentsResult.status === "fulfilled" ? paymentsResult.value : [];
  const plans =
    plansResult.status === "fulfilled" ? plansResult.value : [];
  if (paymentsResult.status === "rejected") {
    captureUnexpected(paymentsResult.reason);
  }
  if (plansResult.status === "rejected") {
    captureUnexpected(plansResult.reason);
  }

  return (
    <div className="mx-auto max-w-5xl">
      <SubscriptionOverview
        payments={payments}
        plans={plans}
        subscription={subscription}
      />
    </div>
  );
}
