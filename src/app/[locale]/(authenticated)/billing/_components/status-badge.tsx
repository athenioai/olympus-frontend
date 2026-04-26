"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import type { SubscriptionStatus } from "@/lib/services";

interface StatusBadgeProps {
  readonly status: SubscriptionStatus;
  readonly currentPeriodEnd?: string;
  readonly refundedAt?: string | null;
}

const COLOR_BY_STATUS: Record<SubscriptionStatus, string> = {
  active: "bg-emerald-500/10 text-emerald-500",
  past_due: "bg-amber-500/10 text-amber-500",
  suspended: "bg-danger/10 text-danger",
  cancelled: "bg-on-surface-variant/10 text-on-surface-variant",
  ended: "bg-on-surface-variant/20 text-on-surface-variant",
  refunded: "bg-purple-500/10 text-purple-500",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function StatusBadge({
  status,
  currentPeriodEnd,
  refundedAt,
}: StatusBadgeProps) {
  const t = useTranslations("billing.status");
  const params: Record<string, string> = {};
  if (currentPeriodEnd) params.date = formatDate(currentPeriodEnd);
  if (refundedAt) params.date = formatDate(refundedAt);
  return (
    <span
      className={cn(
        "inline-flex h-7 items-center rounded-full px-3 text-[13px] font-medium",
        COLOR_BY_STATUS[status],
      )}
    >
      {t(status, params)}
    </span>
  );
}
