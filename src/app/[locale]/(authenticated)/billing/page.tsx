import { getTranslations } from "next-intl/server";
import { ApiError } from "@/lib/api-envelope";
import { captureUnexpected } from "@/lib/observability/capture";
import { subscriptionsService } from "@/lib/services";
import { getPlanOptions } from "@/lib/services/plan-options-source";
import { PlanGrid } from "./_components/plan-grid";
import { SubscriptionOverview } from "./_components/subscription-overview";

/**
 * /billing -- server component branching on whether the caller has a sub.
 *  - 404 from /subscriptions/me  -> render <PlanGrid> (Case A).
 *  - 200                         -> render <SubscriptionOverview> (Case B).
 *  - any other failure           -> render the loadFailed message.
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

  if (!subscription) {
    const plans = await getPlanOptions();
    return (
      <div className="mx-auto max-w-5xl">
        <PlanGrid plans={plans} />
      </div>
    );
  }

  // Case B -- load payments concurrently with the plan catalog (used by change modal).
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
