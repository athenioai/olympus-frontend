"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight, Pencil, Plus } from "lucide-react";
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
import {
  createSubscriptionAction,
  updateSubscriptionAction,
} from "../actions";

const BILLING_DEBOUNCE_MS = 400;

interface SubscriptionsViewFilters {
  readonly status: string;
  readonly planId: string;
  readonly userId: string;
  readonly billingDay: string;
}

interface SubscriptionsViewProps {
  readonly initialPage: PaginatedAdminSubscriptions;
  readonly initialUsers: readonly AdminUserOption[];
  readonly initialPlans: readonly PlanOption[];
  readonly filters: SubscriptionsViewFilters;
  readonly errorMessage: string | null;
}

const STATUSES: readonly SubscriptionStatus[] = [
  "active",
  "suspended",
  "cancelled",
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

  const [formState, setFormState] = useState<
    { mode: "create" } | { mode: "edit"; subscription: SubscriptionPublic } | null
  >(null);

  const [userId, setUserId] = useState("");
  const [planId, setPlanId] = useState("");
  const [billingDay, setBillingDay] = useState("1");
  const [status, setStatus] = useState<SubscriptionStatus>("active");
  const [billingDayInput, setBillingDayInput] = useState(filters.billingDay);
  const [isMutating, startMutation] = useTransition();
  const [isRefreshing, startRefresh] = useTransition();

  const searchParamsRef = useRef(searchParams);
  searchParamsRef.current = searchParams;
  const billingTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (billingTimerRef.current !== null) {
        window.clearTimeout(billingTimerRef.current);
      }
    };
  }, []);

  function pushParams(mutate: (p: URLSearchParams) => void) {
    const next = new URLSearchParams(searchParamsRef.current.toString());
    mutate(next);
    const qs = next.toString();
    startRefresh(() => {
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    });
  }

  function commitBillingDay(value: string) {
    pushParams((p) => {
      const trimmed = value.trim();
      const parsed = Number.parseInt(trimmed, 10);
      const valid =
        Number.isFinite(parsed) && parsed >= 1 && parsed <= 28
          ? String(parsed)
          : "";
      if (valid) p.set("billingDay", valid);
      else p.delete("billingDay");
      p.delete("page");
    });
  }

  function handleBillingDayChange(value: string) {
    const cleaned = value.replace(/\D/g, "").slice(0, 2);
    setBillingDayInput(cleaned);
    if (billingTimerRef.current !== null) {
      window.clearTimeout(billingTimerRef.current);
    }
    billingTimerRef.current = window.setTimeout(() => {
      commitBillingDay(cleaned);
    }, BILLING_DEBOUNCE_MS);
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

  function openCreate() {
    setUserId("");
    setPlanId("");
    setBillingDay("1");
    setStatus("active");
    setFormState({ mode: "create" });
  }

  function openEdit(subscription: SubscriptionPublic) {
    setUserId(subscription.userId);
    setPlanId(subscription.planId);
    setBillingDay(String(subscription.billingDay));
    setStatus(subscription.status);
    setFormState({ mode: "edit", subscription });
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!formState) return;
    if (!userId || !planId) return;
    const day = Number.parseInt(billingDay, 10);
    if (!Number.isFinite(day) || day < 1 || day > 28) {
      toast.error(tCommon("loadError"));
      return;
    }

    startMutation(async () => {
      if (formState.mode === "create") {
        const result = await createSubscriptionAction({
          userId,
          planId,
          billingDay: day,
        });
        if (!result.success || !result.data) {
          toast.error(result.error ?? tCommon("loadError"));
          return;
        }
        toast.success(t("created"));
      } else {
        const result = await updateSubscriptionAction(
          formState.subscription.id,
          {
            planId,
            billingDay: day,
            status,
          },
        );
        if (!result.success || !result.data) {
          toast.error(result.error ?? tCommon("loadError"));
          return;
        }
        toast.success(t("updated"));
      }
      setFormState(null);
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
    subscriptions.length === 0 ? 0 : (currentPage - 1) * initialPage.limit + 1;
  const rangeEnd =
    rangeStart + subscriptions.length - (subscriptions.length === 0 ? 0 : 1);
  const hasActiveFilters = Boolean(
    filters.status || filters.planId || filters.userId || filters.billingDay,
  );

  const isPending = isMutating || isRefreshing;

  return (
    <div className="space-y-6">
      <AdminHeader
        actions={
          <button
            className="flex h-10 items-center gap-2 rounded-xl bg-gradient-to-br from-primary to-primary-dim px-4 text-sm font-bold text-on-primary shadow-lg shadow-primary/10 disabled:opacity-60"
            disabled={isPending}
            onClick={openCreate}
            type="button"
          >
            <Plus className="h-4 w-4" />
            {t("create")}
          </button>
        }
        subtitle={t("subtitle")}
        title={t("title")}
      />

      {errorMessage && (
        <div className="rounded-xl bg-danger-muted px-4 py-3 text-sm text-danger">
          {errorMessage}
        </div>
      )}

      <div className="grid gap-3 rounded-xl bg-surface-container-lowest p-4 sm:grid-cols-2 lg:grid-cols-4">
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
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {t(`status.${s}`)}
            </option>
          ))}
        </select>
        <input
          className={INPUT_CLASS}
          inputMode="numeric"
          onChange={(e) => handleBillingDayChange(e.target.value)}
          placeholder={t("filters.billingDayPlaceholder")}
          value={billingDayInput}
        />
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
                <th className="px-5 py-3">{t("table.billingDay")}</th>
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
                      {t(`status.${sub.status}`)}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-on-surface-variant">
                    {sub.billingDay}
                  </td>
                  <td className="px-5 py-3 text-on-surface-variant">
                    {formatDate(sub.createdAt)}
                  </td>
                  <td className="px-5 py-3">
                    <button
                      className="text-on-surface-variant hover:text-on-surface"
                      onClick={() => openEdit(sub)}
                      type="button"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
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
              {t("pagination.pageOf", { page: currentPage, total: totalPages })}
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

      <Modal
        onClose={() => setFormState(null)}
        open={formState !== null}
        title={
          formState?.mode === "create"
            ? t("form.createTitle")
            : t("form.editTitle")
        }
      >
        <form className="space-y-4" onSubmit={handleSubmit}>
          <Field label={t("form.user")}>
            {formState?.mode === "edit" ? (
              <div className="flex h-auto min-h-10 w-full flex-col justify-center rounded-lg bg-surface-container-high px-3 py-2 text-sm text-on-surface">
                <span className="truncate font-medium">
                  {formState.subscription.userName ??
                    formState.subscription.userEmail ??
                    "—"}
                </span>
                {formState.subscription.userName &&
                formState.subscription.userEmail ? (
                  <span className="truncate text-xs text-on-surface-variant">
                    {formState.subscription.userEmail}
                  </span>
                ) : null}
              </div>
            ) : (
              <SearchableSelect
                onChange={setUserId}
                options={initialUsers.map((u) => ({
                  value: u.id,
                  label: u.name ?? u.email,
                  hint: u.name ? u.email : undefined,
                }))}
                placeholder={t("form.user")}
                value={userId}
              />
            )}
          </Field>
          <Field label={t("form.plan")}>
            <SearchableSelect
              onChange={setPlanId}
              options={buildPlanOptions(initialPlans, formState)}
              placeholder={t("form.plan")}
              value={planId}
            />
          </Field>
          <Field label={t("form.billingDay")}>
            <input
              className={INPUT_CLASS}
              inputMode="numeric"
              max={28}
              min={1}
              onChange={(e) => setBillingDay(e.target.value.replace(/\D/g, ""))}
              required
              type="text"
              value={billingDay}
            />
          </Field>
          {formState?.mode === "edit" && (
            <Field label={t("form.status")}>
              <select
                className={INPUT_CLASS}
                disabled={formState.subscription.status === "cancelled"}
                onChange={(e) => setStatus(e.target.value as SubscriptionStatus)}
                value={status}
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {t(`status.${s}`)}
                  </option>
                ))}
              </select>
            </Field>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              className="h-10 rounded-xl px-4 text-sm font-semibold text-on-surface-variant hover:text-on-surface"
              onClick={() => setFormState(null)}
              type="button"
            >
              {tc("cancel")}
            </button>
            <button
              className="h-10 rounded-xl bg-gradient-to-br from-primary to-primary-dim px-5 text-sm font-bold text-on-primary shadow-lg shadow-primary/10 disabled:opacity-60"
              disabled={isMutating || !userId || !planId}
              type="submit"
            >
              {tc("save")}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

const INPUT_CLASS =
  "h-10 w-full rounded-lg bg-surface-container-high px-3 text-sm text-on-surface outline-none focus:bg-surface-container-lowest focus:ring-1 focus:ring-primary/30";

const STATUS_STYLE: Record<SubscriptionStatus, string> = {
  active: "bg-emerald-500/10 text-emerald-600",
  suspended: "bg-amber-500/10 text-amber-600",
  cancelled: "bg-rose-500/10 text-rose-600",
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

function buildPlanOptions(
  plans: readonly PlanOption[],
  formState:
    | { mode: "create" }
    | { mode: "edit"; subscription: SubscriptionPublic }
    | null,
): readonly { value: string; label: string }[] {
  const base = plans.map((p) => ({ value: p.id, label: p.name }));
  if (formState?.mode !== "edit") return base;
  const sub = formState.subscription;
  if (base.some((o) => o.value === sub.planId)) return base;
  return [{ value: sub.planId, label: sub.planName ?? sub.planId }, ...base];
}
