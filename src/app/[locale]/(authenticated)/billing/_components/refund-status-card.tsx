"use client";

import { useTranslations } from "next-intl";
import { CheckCircle, Clock, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export type RefundStatusKind = "pending" | "approved" | "rejected";

interface RefundStatusCardProps {
  readonly kind: RefundStatusKind;
  readonly reason?: string;
}

const CONFIG: Record<
  RefundStatusKind,
  {
    readonly bg: string;
    readonly icon: React.ComponentType<{ className?: string }>;
  }
> = {
  pending: { bg: "bg-amber-500/10", icon: Clock },
  approved: { bg: "bg-emerald-500/10", icon: CheckCircle },
  rejected: { bg: "bg-danger/10", icon: XCircle },
};

export function RefundStatusCard({ kind, reason }: RefundStatusCardProps) {
  const t = useTranslations("billing.refundStatus");
  const { bg, icon: Icon } = CONFIG[kind];

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-xl px-5 py-4",
        bg,
      )}
    >
      <Icon className="mt-0.5 h-5 w-5 shrink-0 text-on-surface-variant" />
      <p className="text-sm leading-relaxed text-on-surface">
        {t(kind, kind === "rejected" ? { reason: reason ?? "" } : {})}
      </p>
    </div>
  );
}
