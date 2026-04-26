"use client";

import { useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  AlertTriangle,
  Ban,
  ChevronLeft,
  ChevronRight,
  Shield,
} from "lucide-react";
import { toast } from "sonner";
import { SearchableSelect } from "@/components/ui/searchable-select";
import type {
  AdminUserOption,
  PaginatedAdminSubscriptions,
  PlanOption,
  SubscriptionPublic,
  SubscriptionStatus,
} from "@/lib/services";
import { AdminHeader } from "../../_components/admin-header";
import { Modal } from "../../_components/modal";
import { formatDate } from "../../_lib/format";
import { cancelUserAction, forceStatusAction } from "../actions";

interface SubscriptionsViewFilters {
  readonly status: string;
  readonly planId: string;
  readonly userId: string;
}

interface SubscriptionsViewProps {
  readonly initialPage: PaginatedAdminSubscriptions;
  readonly initialUsers: readonly AdminUserOption[];
  readonly initialPlans: readonly PlanOption[];
  readonly filters: SubscriptionsViewFilters;
  readonly errorMessage: string | null;
}

const ALL_STATUSES: readonly SubscriptionStatus[] = [
  "active",
  "past_due",
  "suspended",
  "cancelled",
  "ended",
  "refunded",
];

export function SubscriptionsView({
  initialPage,
  initialUsers,
  initialPlans,
  filters,
  errorMessage,
}: SubscriptionsViewProps) {
  const t = useTranslations("admin.subscriptions");
  const tc = useTranslations("common");
  const tCommon = useTranslations("admin.common");

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [forceStatusTarget, setForceStatusTarget] =
    useState<SubscriptionPublic | null>(null);
  const [forceStatusValue, setForceStatusValue] =
    useState<SubscriptionStatus>("active");
  const [cancelTarget, setCancelTarget] =
    useState<SubscriptionPublic | null>(null);

  const [isMutating, startMutation] = useTransition();
  const [isRefreshing, startRefresh] = useTransition();

  function pushParams(mutate: (p: URLSearchParams) => void) {
    const next = new URLSearchParams(searchParams.toString());
    mutate(next);
    const qs = next.toString();
    startRefresh(() => {
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    });
  }

  function handleFilterChange(
    key: keyof SubscriptionsViewFilters,
    value: string,
  ) {
    pushParams((p) => {
      if (value) p.set(key, value);
      else p.delete(key);
      p.delete("page");
    });
  }

  function goToPage(n: number) {
    pushParams((p) => {
      if (n <= 1) p.delete("page");
      else p.set("page", String(n));
    });
  }

  function openForceStatus(sub: SubscriptionPublic) {
    setForceStatusValue(sub.status);
    setForceStatusTarget(sub);
  }

  function handleForceStatusSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!forceStatusTarget) return;
    startMutation(async () => {
      const result = await forceStatusAction(
        forceStatusTarget.id,
        forceStatusValue,
      );
      if (!result.success) {
        toast.error(result.error ?? tCommon("loadError"));
        return;
      }
      toast.success(t("updated"));
      setForceStatusTarget(null);
      router.refresh();
    });
  }

  function handleCancel(sub: SubscriptionPublic) {
    setCancelTarget(sub);
  }

  function confirmCancel() {
    if (!cancelTarget) return;
    startMutation(async () => {
      const result = await cancelUserAction(cancelTarget.userId);
      if (!result.success) {
        toast.error(result.error ?? tCommon("loadError"));
        return;
      }
      toast.success(t("updated"));
      setCancelTarget(null);
      router.refresh();
    });
  }

  const subscriptions = initialPage.items;
  const totalPages = Math.max(
    1,
    Math.ceil(initialPage.total / initialPage.limit),
  );
  const currentPage = Math.min(Math.max(1, initialPage.page), totalPages);
  const canPrev = currentPage > 1;
  const canNext = currentPage < totalPages;
  const rangeStart =
    subscriptions.length === 0
      ? 0
      : (currentPage - 1) * initialPage.limit + 1;
  const rangeEnd =
    rangeStart +
    subscriptions.length -
    (subscriptions.length === 0 ? 0 : 1);
  const hasActiveFilters = Boolean(
    filters.status || filters.planId || filters.userId,
  );

  const isPending = isMutating || isRefreshing;

  return (
    <div className="space-y-6">
      <AdminHeader subtitle={t("subtitle")} title={t("title")} />

      {errorMessage && (
        <div className="rounded-xl bg-danger-muted px-4 py-3 text-sm text-danger">
          {errorMessage}
        </div>
      )}

      <div className="grid gap-3 rounded-xl bg-surface-container-lowest p-4 sm:grid-cols-2 lg:grid-cols-3">
        <SearchableSelect
          allowClear
          clearLabel={t("filters.allUsers")}
          onChange={(v) => handleFilterChange("userId", v)}
          options={initialUsers.map((u) => ({
            value: u.id,
            label: u.name ?? u.email,
            hint: u.name ? u.email : undefined,
          }))}
          placeholder={t("filters.allUsers")}
          value={filters.userId}
        />
        <SearchableSelect
          allowClear
          clearLabel={t("filters.allPlans")}
          onChange={(v) => handleFilterChange("planId", v)}
          options={initialPlans.map((p) => ({ value: p.id, label: p.name }))}
          placeholder={t("filters.allPlans")}
          value={filters.planId}
        />
        <select
          className={INPUT_CLASS}
          onChange={(e) => handleFilterChange("status", e.target.value)}
          value={filters.status}
        >
          <option value="">{t("filters.allStatuses")}</option>
          {ALL_STATUSES.map((s) => (
            <option key={s} value={s}>
              {t(`statusLabels.${s}`)}
            </option>
          ))}
        </select>
      </div>

      {subscriptions.length === 0 ? (
        <div className="rounded-xl bg-surface-container-lowest p-8 text-center text-sm text-on-surface-variant">
          {hasActiveFilters ? t("emptyFiltered") : t("empty")}
        </div>
      ) : (
        <div
          aria-busy={isRefreshing}
          className="overflow-hidden rounded-xl bg-surface-container-lowest shadow-ambient transition-opacity"
          style={{ opacity: isRefreshing ? 0.6 : 1 }}
        >
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs font-semibold uppercase tracking-widest text-on-surface-variant">
                <th className="px-5 py-3">{t("table.user")}</th>
                <th className="px-5 py-3">{t("table.plan")}</th>
                <th className="px-5 py-3">{t("table.status")}</th>
                <th className="px-5 py-3">
                  {t("columns.currentPeriodEnd")}
                </th>
                <th className="px-5 py-3">
                  {t("columns.asaasSubscriptionId")}
                </th>
                <th className="px-5 py-3">{t("table.createdAt")}</th>
                <th className="px-5 py-3">{t("table.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {subscriptions.map((sub) => (
                <tr
                  className="border-t border-surface-container-high"
                  key={sub.id}
                >
                  <td className="px-5 py-3 font-medium text-on-surface">
                    {sub.userName ?? sub.userEmail ?? "—"}
                  </td>
                  <td className="px-5 py-3 text-on-surface-variant">
                    {sub.planName ?? "—"}
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${STATUS_STYLE[sub.status]}`}
                    >
                      {t(`statusLabels.${sub.status}`)}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-on-surface-variant">
                    {formatDate(sub.currentPeriodEnd)}
                  </td>
                  <td className="px-5 py-3 text-on-surface-variant">
                    <AsaasIdCell value={sub.asaasSubscriptionId} />
                  </td>
                  <td className="px-5 py-3 text-on-surface-variant">
                    {formatDate(sub.createdAt)}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      {sub.status === "active" && (
                        <button
                          className="text-on-surface-variant hover:text-danger"
                          disabled={isPending}
                          onClick={() => handleCancel(sub)}
                          title={t("actions.cancel")}
                          type="button"
                        >
                          <Ban className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        className="text-on-surface-variant hover:text-on-surface"
                        disabled={isPending}
                        onClick={() => openForceStatus(sub)}
                        title={t("actions.forceStatus")}
                        type="button"
                      >
                        <Shield className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {initialPage.total > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-on-surface-variant">
          <span>
            {t("pagination.showing", {
              from: rangeStart,
              to: rangeEnd,
              total: initialPage.total,
            })}
          </span>
          <div className="flex items-center gap-2">
            <button
              aria-label={t("pagination.previous")}
              className="flex size-9 items-center justify-center rounded-lg bg-surface-container-high text-on-surface-variant transition-opacity hover:opacity-80 disabled:opacity-40"
              disabled={!canPrev || isRefreshing}
              onClick={() => goToPage(currentPage - 1)}
              type="button"
            >
              <ChevronLeft className="size-4" />
            </button>
            <span className="min-w-[5rem] text-center font-mono text-xs uppercase tracking-widest">
              {t("pagination.pageOf", {
                page: currentPage,
                total: totalPages,
              })}
            </span>
            <button
              aria-label={t("pagination.next")}
              className="flex size-9 items-center justify-center rounded-lg bg-surface-container-high text-on-surface-variant transition-opacity hover:opacity-80 disabled:opacity-40"
              disabled={!canNext || isRefreshing}
              onClick={() => goToPage(currentPage + 1)}
              type="button"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
      )}

      {/* Force-status modal */}
      <Modal
        onClose={() => setForceStatusTarget(null)}
        open={forceStatusTarget !== null}
        title={t("forceStatusModal.title")}
      >
        <form className="space-y-4" onSubmit={handleForceStatusSubmit}>
          <div className="flex items-start gap-3 rounded-lg bg-amber-500/10 px-4 py-3 text-sm text-amber-700">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>{t("forceStatusModal.body")}</p>
          </div>
          <Field label={t("forceStatusModal.statusLabel")}>
            <select
              className={INPUT_CLASS}
              onChange={(e) =>
                setForceStatusValue(e.target.value as SubscriptionStatus)
              }
              value={forceStatusValue}
            >
              {ALL_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {t(`statusLabels.${s}`)}
                </option>
              ))}
            </select>
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <button
              className="h-10 rounded-xl px-4 text-sm font-semibold text-on-surface-variant hover:text-on-surface"
              onClick={() => setForceStatusTarget(null)}
              type="button"
            >
              {tc("cancel")}
            </button>
            <button
              className="h-10 rounded-xl bg-gradient-to-br from-primary to-primary-dim px-5 text-sm font-bold text-on-primary shadow-lg shadow-primary/10 disabled:opacity-60"
              disabled={isMutating}
              type="submit"
            >
              {t("forceStatusModal.confirm")}
            </button>
          </div>
        </form>
      </Modal>

      {/* Cancel confirmation modal */}
      <Modal
        onClose={() => setCancelTarget(null)}
        open={cancelTarget !== null}
        title={t("actions.cancel")}
      >
        <div className="space-y-4">
          <p className="text-sm text-on-surface-variant">
            {cancelTarget
              ? `${t("actions.cancel")}: ${cancelTarget.userName ?? cancelTarget.userEmail ?? cancelTarget.userId}`
              : ""}
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <button
              className="h-10 rounded-xl px-4 text-sm font-semibold text-on-surface-variant hover:text-on-surface"
              onClick={() => setCancelTarget(null)}
              type="button"
            >
              {tc("cancel")}
            </button>
            <button
              className="h-10 rounded-xl bg-danger px-5 text-sm font-bold text-white shadow-lg disabled:opacity-60"
              disabled={isMutating}
              onClick={confirmCancel}
              type="button"
            >
              {t("actions.cancel")}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

const INPUT_CLASS =
  "h-10 w-full rounded-lg bg-surface-container-high px-3 text-sm text-on-surface outline-none focus:bg-surface-container-lowest focus:ring-1 focus:ring-primary/30";

const STATUS_STYLE: Record<SubscriptionStatus, string> = {
  active: "bg-emerald-500/10 text-emerald-600",
  past_due: "bg-orange-500/10 text-orange-600",
  suspended: "bg-amber-500/10 text-amber-600",
  cancelled: "bg-rose-500/10 text-rose-600",
  ended: "bg-stone-500/10 text-stone-500",
  refunded: "bg-sky-500/10 text-sky-600",
};

function Field({
  label,
  children,
}: {
  readonly label: string;
  readonly children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1">
      <span className="font-display text-xs font-semibold text-on-surface">
        {label}
      </span>
      {children}
    </label>
  );
}

function AsaasIdCell({ value }: { readonly value: string | null }) {
  if (!value) return <span>{"—"}</span>;
  return (
    <span className="font-mono text-xs" title={value}>
      {value.slice(0, 8)}
    </span>
  );
}
