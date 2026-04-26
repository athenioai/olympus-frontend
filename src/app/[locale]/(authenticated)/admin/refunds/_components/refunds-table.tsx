"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Check, RotateCcw, X } from "lucide-react";
import { toast } from "sonner";
import { Tooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type {
  RefundRequestPublic,
  RefundRequestStatus,
} from "@/lib/services";
import { AdminHeader } from "../../_components/admin-header";
import { formatDate, formatDateTime } from "../../_lib/format";
import { approveRefund, rejectRefund } from "../actions";
import { ApproveRefundModal } from "./approve-refund-modal";
import { RejectRefundModal } from "./reject-refund-modal";

interface RefundsTableProps {
  readonly requests: readonly RefundRequestPublic[];
  readonly currentFilter: RefundRequestStatus;
}

const REFUND_STATUS_COLOR: Record<RefundRequestStatus, string> = {
  pending: "bg-amber-500/10 text-amber-500",
  approved: "bg-emerald-500/10 text-emerald-500",
  rejected: "bg-danger/10 text-danger",
};

const STATUS_FILTERS: readonly RefundRequestStatus[] = [
  "pending",
  "approved",
  "rejected",
];

function truncate(s: string, n: number): string {
  if (s.length <= n) return s;
  return s.slice(0, n) + "…";
}

export function RefundsTable({
  requests,
  currentFilter,
}: RefundsTableProps) {
  const t = useTranslations("admin.refunds");
  const tc = useTranslations("common");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedForApprove, setSelectedForApprove] =
    useState<RefundRequestPublic | null>(null);
  const [selectedForReject, setSelectedForReject] =
    useState<RefundRequestPublic | null>(null);

  function handleApprove(formData: FormData) {
    if (!selectedForApprove) return;
    const target = selectedForApprove;
    startTransition(async () => {
      const result = await approveRefund(target.id, formData);
      if (result.success) {
        setSelectedForApprove(null);
        toast.success(t("toasts.approved"));
        router.refresh();
      } else {
        toast.error(result.error ?? tc("error"));
      }
    });
  }

  function handleReject(formData: FormData) {
    if (!selectedForReject) return;
    const target = selectedForReject;
    startTransition(async () => {
      const result = await rejectRefund(target.id, formData);
      if (result.success) {
        setSelectedForReject(null);
        toast.success(t("toasts.rejected"));
        router.refresh();
      } else {
        toast.error(result.error ?? tc("error"));
      }
    });
  }

  return (
    <div className="space-y-6">
      <AdminHeader
        subtitle={t("subtitle")}
        title={t("title")}
      />

      {/* Filter pills */}
      <div className="flex items-center gap-1 rounded-xl bg-surface-container-lowest p-1 shadow-[inset_0_0_0_1px_rgba(175,179,176,0.15)]">
        {STATUS_FILTERS.map((status) => (
          <button
            className={cn(
              "h-8 rounded-lg px-4 text-[13px] font-medium transition-all duration-200",
              currentFilter === status
                ? "bg-primary/10 text-primary shadow-sm"
                : "text-on-surface-variant hover:text-on-surface",
            )}
            key={status}
            onClick={() =>
              router.push(`/admin/refunds?status=${status}`)
            }
            type="button"
          >
            {t(`filters.${status}`)}
          </button>
        ))}
      </div>

      {requests.length === 0 ? (
        <div className="flex min-h-[320px] flex-col items-center justify-center rounded-xl bg-surface-container-lowest p-8">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-container-high">
            <RotateCcw className="h-7 w-7 text-on-surface-variant/40" />
          </div>
          <p className="font-display text-sm font-semibold text-on-surface-variant">
            {t("empty")}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl bg-surface-container-lowest shadow-ambient">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs font-semibold uppercase tracking-widest text-on-surface-variant">
                <th className="px-5 py-3">{t("columns.user")}</th>
                <th className="px-5 py-3">{t("columns.reason")}</th>
                <th className="px-5 py-3">{t("columns.createdAt")}</th>
                <th className="px-5 py-3">
                  {t("columns.statusLabel")}
                </th>
                <th className="px-5 py-3">{t("columns.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((req) => (
                <tr
                  className="border-t border-surface-container-high"
                  key={req.id}
                >
                  {/* User */}
                  <td className="px-5 py-3">
                    <div className="font-medium text-on-surface">
                      {req.userName}
                    </div>
                    <div className="text-xs text-on-surface-variant">
                      {req.userEmail}
                    </div>
                  </td>

                  {/* Reason */}
                  <td className="max-w-[260px] px-5 py-3 text-on-surface-variant">
                    {req.reason.length > 100 ? (
                      <Tooltip content={req.reason}>
                        <span className="cursor-help">
                          {truncate(req.reason, 100)}
                        </span>
                      </Tooltip>
                    ) : (
                      req.reason
                    )}
                  </td>

                  {/* Date */}
                  <td className="px-5 py-3 text-on-surface-variant">
                    {formatDate(req.createdAt)}
                  </td>

                  {/* Status badge */}
                  <td className="px-5 py-3">
                    {req.status === "pending" ? (
                      <span
                        className={cn(
                          "inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold",
                          REFUND_STATUS_COLOR[req.status],
                        )}
                      >
                        {t(`status.${req.status}`)}
                      </span>
                    ) : (
                      <Tooltip
                        content={
                          <div className="max-w-xs space-y-1">
                            {req.reviewerNotes && (
                              <p>{req.reviewerNotes}</p>
                            )}
                            {req.reviewedAt && (
                              <p className="opacity-70">
                                {formatDateTime(req.reviewedAt)}
                              </p>
                            )}
                          </div>
                        }
                      >
                        <span
                          className={cn(
                            "inline-block cursor-help rounded-full px-2.5 py-0.5 text-xs font-semibold",
                            REFUND_STATUS_COLOR[req.status],
                          )}
                        >
                          {t(`status.${req.status}`)}
                        </span>
                      </Tooltip>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="px-5 py-3">
                    {req.status === "pending" ? (
                      <div className="flex gap-2">
                        <button
                          className="flex h-8 items-center gap-1.5 rounded-lg bg-emerald-500/10 px-3 text-xs font-semibold text-emerald-600 transition-colors hover:bg-emerald-500/20 disabled:opacity-50"
                          disabled={isPending}
                          onClick={() => setSelectedForApprove(req)}
                          type="button"
                        >
                          <Check className="h-3.5 w-3.5" />
                          {t("actions.approve")}
                        </button>
                        <button
                          className="flex h-8 items-center gap-1.5 rounded-lg bg-danger/10 px-3 text-xs font-semibold text-danger transition-colors hover:bg-danger/20 disabled:opacity-50"
                          disabled={isPending}
                          onClick={() => setSelectedForReject(req)}
                          type="button"
                        >
                          <X className="h-3.5 w-3.5" />
                          {t("actions.reject")}
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-on-surface-variant">
                        —
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedForApprove !== null && (
        <ApproveRefundModal
          isPending={isPending}
          onClose={() => setSelectedForApprove(null)}
          onSubmit={handleApprove}
          userName={selectedForApprove.userName}
        />
      )}

      {selectedForReject !== null && (
        <RejectRefundModal
          isPending={isPending}
          onClose={() => setSelectedForReject(null)}
          onSubmit={handleReject}
          userName={selectedForReject.userName}
        />
      )}
    </div>
  );
}
