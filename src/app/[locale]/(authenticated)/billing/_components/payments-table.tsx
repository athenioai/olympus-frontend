"use client";

import { useTranslations } from "next-intl";
import { motion } from "motion/react";
import { ExternalLink, Receipt } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatBRL } from "@/lib/format";
import { fadeInUp, staggerContainer } from "@/lib/motion";
import type { MyPayment, PaymentStatus } from "@/lib/services";

interface PaymentsTableProps {
  readonly payments: readonly MyPayment[];
}

const STATUS_COLOR: Record<PaymentStatus, string> = {
  pending: "bg-amber-500/10 text-amber-500",
  confirmed: "bg-emerald-500/10 text-emerald-500",
  overdue: "bg-danger/10 text-danger",
  refunded: "bg-purple-500/10 text-purple-500",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function PaymentsTable({ payments }: PaymentsTableProps) {
  const t = useTranslations("billing.payments");

  if (payments.length === 0) {
    return (
      <div className="flex min-h-[200px] flex-col items-center justify-center rounded-xl bg-surface-container-lowest p-8">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-container-high">
          <Receipt className="h-7 w-7 text-on-surface-variant/40" />
        </div>
        <p className="font-display text-sm font-semibold text-on-surface-variant">
          {t("empty")}
        </p>
      </div>
    );
  }

  return (
    <motion.div animate="visible" initial="hidden" variants={staggerContainer}>
      <div className="mb-3">
        <h2 className="font-display text-lg font-bold tracking-tight text-on-surface">
          {t("title")}
        </h2>
      </div>

      {/* Header — hidden on mobile */}
      <div className="mb-1 hidden grid-cols-[1fr_1fr_1fr_1fr_auto] gap-4 px-5 sm:grid">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant/60">
          {t("dueDate")}
        </span>
        <span className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant/60">
          {t("amount")}
        </span>
        <span className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant/60">
          {t("statusLabel")}
        </span>
        <span className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant/60">
          {t("paidAt")}
        </span>
        <span className="w-24 text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant/60">
          {t("actions")}
        </span>
      </div>

      <motion.div className="space-y-2" variants={staggerContainer}>
        {payments.map((payment) => (
          <PaymentRow key={payment.id} payment={payment} />
        ))}
      </motion.div>
    </motion.div>
  );
}

interface PaymentRowProps {
  readonly payment: MyPayment;
}

function PaymentRow({ payment }: PaymentRowProps) {
  const t = useTranslations("billing.payments");

  return (
    <motion.div
      className="grid items-center gap-4 rounded-xl bg-surface-container-lowest px-5 py-4 transition-colors hover:bg-surface-container-low/50 sm:grid-cols-[1fr_1fr_1fr_1fr_auto]"
      variants={fadeInUp}
    >
      <div className="min-w-0">
        <span className="text-[13px] text-on-surface-variant sm:hidden">
          {t("dueDate")}:{" "}
        </span>
        <span className="text-sm font-medium text-on-surface">
          {formatDate(payment.dueDate)}
        </span>
      </div>

      <div className="min-w-0">
        <span className="text-[13px] text-on-surface-variant sm:hidden">
          {t("amount")}:{" "}
        </span>
        <span className="text-sm font-medium text-on-surface">
          {formatBRL(payment.amount)}
        </span>
      </div>

      <div>
        <span
          className={cn(
            "inline-flex h-6 items-center rounded-full px-2.5 text-[12px] font-medium",
            STATUS_COLOR[payment.status],
          )}
        >
          {t(`status.${payment.status}`)}
        </span>
      </div>

      <div className="text-sm text-on-surface-variant">
        {payment.paidAt ? formatDate(payment.paidAt) : "—"}
      </div>

      <div className="flex justify-end">
        {payment.invoiceUrl ? (
          <a
            className="inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-[13px] font-medium text-primary transition-colors hover:bg-primary/8"
            href={payment.invoiceUrl}
            rel="noopener noreferrer"
            target="_blank"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            {t("viewInvoice")}
          </a>
        ) : (
          <span className="inline-flex h-8 items-center px-3 text-[13px] text-on-surface-variant/40">
            {t("viewInvoice")}
          </span>
        )}
      </div>
    </motion.div>
  );
}
