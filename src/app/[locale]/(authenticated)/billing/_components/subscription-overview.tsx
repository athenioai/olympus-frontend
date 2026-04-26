"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { motion } from "motion/react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { formatBRL } from "@/lib/format";
import { fadeInUp, staggerContainer } from "@/lib/motion";
import { isWithinRefundWindow } from "../_lib/refund-window";
import { StatusBadge } from "./status-badge";
import { PaymentsTable } from "./payments-table";
import { ChangePlanModal } from "./change-plan-modal";
import { CancelModal } from "./cancel-modal";
import { RefundRequestModal } from "./refund-request-modal";
import { setSuspended } from "@/lib/subscription-banner-store";
import type { MyPayment, MySubscription } from "@/lib/services";
import type { PlanOption } from "@/lib/services/plan-options-source";

interface SubscriptionOverviewProps {
  readonly subscription: MySubscription;
  readonly payments: readonly MyPayment[];
  readonly plans: readonly PlanOption[];
}

type ModalKind = "change" | "cancel" | "refund";

const DISABLED_STATUSES = new Set([
  "cancelled",
  "ended",
  "refunded",
  "suspended",
]);

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(iso));
}

export function SubscriptionOverview({
  subscription,
  payments,
  plans,
}: SubscriptionOverviewProps) {
  const t = useTranslations("billing");
  const tc = useTranslations("common");
  const router = useRouter();
  const [openModal, setOpenModal] = useState<ModalKind | null>(null);

  const actionsDisabled = DISABLED_STATUSES.has(subscription.status);
  const cancelDisabled =
    actionsDisabled || subscription.cancelAtPeriodEnd;
  const canRequestRefund =
    isWithinRefundWindow(subscription.refundEligibleUntil) &&
    subscription.pendingRefundRequest === null &&
    (subscription.status === "active" ||
      subscription.status === "past_due" ||
      subscription.status === "cancelled");

  // Reconcile the global suspended banner with /me data on first paint,
  // regardless of whether a 402 or WS event has fired yet.
  useEffect(() => {
    setSuspended(subscription.status === "suspended");
  }, [subscription.status]);

  function handleChangeConfirmed() {
    setOpenModal(null);
    toast.success(t("toasts.planUpdated"));
    router.refresh();
  }

  function handleCancelConfirmed() {
    setOpenModal(null);
    toast.success(
      t("toasts.subscriptionCancelled", {
        date: formatDate(subscription.currentPeriodEnd),
      }),
    );
    router.refresh();
  }

  function handleRefundConfirmed() {
    setOpenModal(null);
    toast.success(t("toasts.refundRequested"));
    router.refresh();
  }

  return (
    <motion.div
      animate="visible"
      className="space-y-6"
      initial="hidden"
      variants={staggerContainer}
    >
      {/* Page header */}
      <motion.div variants={fadeInUp}>
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-on-surface">
          {t("title")}
        </h1>
        <p className="mt-1 text-sm text-on-surface-variant">
          {t("subtitle")}
        </p>
      </motion.div>

      {/* Subscription header card */}
      <motion.div
        className="rounded-xl bg-surface-container-lowest p-6"
        variants={fadeInUp}
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-lg font-bold tracking-tight text-on-surface">
              {subscription.plan.name}
            </h2>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="font-display text-2xl font-extrabold text-on-surface">
                {formatBRL(subscription.plan.cost)}
              </span>
              <span className="text-sm text-on-surface-variant">
                {t("monthly")}
              </span>
            </div>
          </div>
          <StatusBadge
            currentPeriodEnd={subscription.currentPeriodEnd}
            status={subscription.status}
          />
        </div>
        <p className="mt-3 text-sm text-on-surface-variant">
          {subscription.nextPaymentAt
            ? t("nextPaymentAt", {
                date: formatDate(subscription.nextPaymentAt),
              })
            : t("noNextPayment")}
        </p>
      </motion.div>

      {/* Banners */}
      {subscription.pendingChange && (
        <motion.div
          className="rounded-xl bg-amber-500/10 px-5 py-3 text-sm text-amber-700"
          variants={fadeInUp}
        >
          {t("banners.pendingChange", {
            planName: subscription.pendingChange.toPlanName,
            date: formatDate(subscription.pendingChange.effectiveAt),
          })}
        </motion.div>
      )}

      {subscription.cancelAtPeriodEnd && (
        <motion.div
          className="rounded-xl bg-on-surface-variant/10 px-5 py-3 text-sm text-on-surface-variant"
          variants={fadeInUp}
        >
          {t("banners.cancelAtPeriodEnd", {
            date: formatDate(subscription.currentPeriodEnd),
          })}
        </motion.div>
      )}

      {canRequestRefund && (
        <motion.div
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-emerald-500/10 px-5 py-3"
          variants={fadeInUp}
        >
          <span className="text-sm text-emerald-700">
            {t("banners.refundEligible", {
              date: formatDate(subscription.refundEligibleUntil),
            })}
          </span>
          <button
            className="inline-flex h-8 items-center rounded-lg bg-emerald-600 px-3 text-[13px] font-bold text-white transition-opacity hover:opacity-90"
            onClick={() => setOpenModal("refund")}
            type="button"
          >
            {t("actions.requestRefund")}
          </button>
        </motion.div>
      )}

      {/* Pending refund request — in analysis */}
      {subscription.pendingRefundRequest !== null && (
        <motion.div
          className="rounded-xl bg-amber-500/10 p-4"
          variants={fadeInUp}
        >
          <p className="font-display text-sm font-bold text-amber-700">
            {t("refundPending.title")}
          </p>
          <p className="mt-1 text-[13px] text-on-surface">
            {t("refundPending.requestedAt", {
              date: formatDateTime(subscription.pendingRefundRequest.requestedAt),
            })}
          </p>
          <p className="mt-0.5 text-[13px] text-on-surface">
            {t("refundPending.reason", {
              reason: subscription.pendingRefundRequest.reason,
            })}
          </p>
          <p className="mt-2 text-[13px] text-on-surface-variant">
            {t("refundPending.body")}
          </p>
        </motion.div>
      )}

      {/* Payments table */}
      <motion.div variants={fadeInUp}>
        <PaymentsTable payments={payments} />
      </motion.div>

      {/* Action buttons */}
      <motion.div className="flex flex-wrap gap-3" variants={fadeInUp}>
        <button
          className={cn(
            "flex h-10 items-center gap-2 rounded-xl px-5 text-sm font-bold transition-opacity",
            actionsDisabled
              ? "cursor-not-allowed bg-surface-container-high text-on-surface-variant/50"
              : "bg-primary text-on-primary hover:opacity-90",
          )}
          disabled={actionsDisabled}
          onClick={() => setOpenModal("change")}
          type="button"
        >
          {t("actions.changePlan")}
        </button>
        <button
          className={cn(
            "flex h-10 items-center gap-2 rounded-xl px-5 text-sm font-bold transition-opacity",
            cancelDisabled
              ? "cursor-not-allowed bg-surface-container-high text-on-surface-variant/50"
              : "bg-surface-container-high text-danger hover:bg-danger-muted",
          )}
          disabled={cancelDisabled}
          onClick={() => setOpenModal("cancel")}
          type="button"
        >
          {t("actions.cancel")}
        </button>
      </motion.div>

      {/* Modals */}
      {openModal === "change" && (
        <ChangePlanModal
          currentPeriodEnd={subscription.currentPeriodEnd}
          currentPlan={{
            id: subscription.plan.id,
            cost: subscription.plan.cost,
          }}
          onClose={() => setOpenModal(null)}
          onConfirmed={handleChangeConfirmed}
          plans={plans}
        />
      )}
      {openModal === "cancel" && (
        <CancelModal
          currentPeriodEnd={subscription.currentPeriodEnd}
          onClose={() => setOpenModal(null)}
          onConfirmed={handleCancelConfirmed}
        />
      )}
      {openModal === "refund" && (
        <RefundRequestModal
          onClose={() => setOpenModal(null)}
          onConfirmed={handleRefundConfirmed}
        />
      )}
    </motion.div>
  );
}
