"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight, Info, Plus } from "lucide-react";
import { toast } from "sonner";
import { BrlInput } from "@/components/ui/brl-input";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Tooltip } from "@/components/ui/tooltip";
import type {
  AdminInvoicePublic,
  AdminInvoiceStatus,
  AdminInvoiceSummary,
  AdminUserOption,
  LateInterestType,
  PaginatedAdminInvoices,
  SubscriptionPublic,
} from "@/lib/services";
import { AdminHeader } from "../../_components/admin-header";
import { Modal } from "../../_components/modal";
import { endOfDayIsoInSaoPaulo } from "../../_lib/date";
import { formatBRL, formatDate } from "../../_lib/format";
import { createInvoiceAction } from "../actions";

const FILTERS: readonly ("all" | AdminInvoiceStatus)[] = [
  "all",
  "pending",
  "paid",
  "overdue",
  "cancelled",
];

const MIN_AMOUNT_CENTS = 1;
const MAX_AMOUNT_CENTS = 99_999_999;

interface InvoicesViewFilters {
  readonly status: string;
  readonly userId: string;
  readonly dueDateFrom: string;
  readonly dueDateTo: string;
}

interface InvoicesViewProps {
  readonly initialPage: PaginatedAdminInvoices;
  readonly initialSummary: AdminInvoiceSummary | null;
  readonly initialUsers: readonly AdminUserOption[];
  readonly initialSubscriptions: readonly SubscriptionPublic[];
  readonly filters: InvoicesViewFilters;
  readonly errorMessage: string | null;
}

export function InvoicesView({
  initialPage,
  initialSummary,
  initialUsers,
  initialSubscriptions,
  filters,
  errorMessage,
}: InvoicesViewProps) {
  const t = useTranslations("admin.invoices");
  const tc = useTranslations("common");
  const tCommon = useTranslations("admin.common");

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [formOpen, setFormOpen] = useState(false);
  const [userId, setUserId] = useState("");
  const [subscriptionId, setSubscriptionId] = useState("");
  const [amountCents, setAmountCents] = useState(0);
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const todayYmd = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [lateFeePercent, setLateFeePercent] = useState("2");
  const [lateInterestType, setLateInterestType] =
    useState<LateInterestType>("simple");
  const [lateInterestPercent, setLateInterestPercent] = useState("1");

  const [isMutating, startMutation] = useTransition();
  const [isRefreshing, startRefresh] = useTransition();

  const searchParamsRef = useRef(searchParams);
  searchParamsRef.current = searchParams;

  const userSubscriptions = useMemo(
    () => initialSubscriptions.filter((s) => s.userId === userId),
    [initialSubscriptions, userId],
  );

  function pushParams(mutate: (p: URLSearchParams) => void) {
    const next = new URLSearchParams(searchParamsRef.current.toString());
    mutate(next);
    const qs = next.toString();
    startRefresh(() => {
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    });
  }

  function handleFilterChange(key: keyof InvoicesViewFilters, value: string) {
    pushParams((p) => {
      if (value) p.set(key, value);
      else p.delete(key);
      p.delete("page");
    });
  }

  function handleStatusChange(value: "all" | AdminInvoiceStatus) {
    handleFilterChange("status", value === "all" ? "" : value);
  }

  function goToPage(n: number) {
    pushParams((p) => {
      if (n <= 1) p.delete("page");
      else p.set("page", String(n));
    });
  }

  function openCreate() {
    setUserId("");
    setSubscriptionId("");
    setAmountCents(0);
    setDescription("");
    setDueDate("");
    setLateFeePercent("2");
    setLateInterestType("simple");
    setLateInterestPercent("1");
    setFormOpen(true);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isMutating) return;
    if (!userId) return;
    if (amountCents < MIN_AMOUNT_CENTS || amountCents > MAX_AMOUNT_CENTS) {
      toast.error(t("form.amountOutOfRange"));
      return;
    }
    const amountParsed = amountCents / 100;
    const latePercent = Number.parseFloat(lateFeePercent);
    const interestPercent = Number.parseFloat(lateInterestPercent);
    if (
      !Number.isFinite(latePercent) ||
      latePercent < 0 ||
      latePercent > 100 ||
      !Number.isFinite(interestPercent) ||
      interestPercent < 0 ||
      interestPercent > 100
    ) {
      toast.error(t("form.percentOutOfRange"));
      return;
    }

    const payload = {
      userId,
      ...(subscriptionId ? { subscriptionId } : {}),
      amount: amountParsed,
      ...(description.trim() ? { description: description.trim() } : {}),
      dueDate: endOfDayIsoInSaoPaulo(dueDate),
      lateFeePercent: latePercent,
      lateInterestType,
      lateInterestPercent: interestPercent,
    };

    startMutation(async () => {
      const result = await createInvoiceAction(payload);
      if (!result.success || !result.data) {
        toast.error(result.error ?? tCommon("loadError"));
        return;
      }
      setFormOpen(false);
      toast.success(t("created"));
      router.refresh();
    });
  }

  const invoices = initialPage.items;
  const totalPages = Math.max(
    1,
    Math.ceil(initialPage.total / initialPage.limit),
  );
  const currentPage = Math.min(Math.max(1, initialPage.page), totalPages);
  const canPrev = currentPage > 1;
  const canNext = currentPage < totalPages;
  const rangeStart =
    invoices.length === 0 ? 0 : (currentPage - 1) * initialPage.limit + 1;
  const rangeEnd = rangeStart + invoices.length - (invoices.length === 0 ? 0 : 1);
  const hasActiveFilters = Boolean(
    filters.status ||
      filters.userId ||
      filters.dueDateFrom ||
      filters.dueDateTo,
  );

  const activeStatus = (filters.status || "all") as "all" | AdminInvoiceStatus;

  return (
    <div className="space-y-6">
      <AdminHeader
        actions={
          <button
            className="flex h-10 items-center gap-2 rounded-xl bg-gradient-to-br from-primary to-primary-dim px-4 text-sm font-bold text-on-primary shadow-lg shadow-primary/10 disabled:opacity-60"
            disabled={isMutating || isRefreshing}
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

      {initialSummary && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <SummaryTile
            hint={t("summary.mrrHint")}
            label={t("summary.mrr")}
            value={formatBRL(initialSummary.mrr)}
          />
          <SummaryTile
            label={t("summary.total")}
            value={initialSummary.totalInvoices.toString()}
          />
          <SummaryTile
            label={t("summary.pending")}
            value={initialSummary.pendingInvoices.toString()}
          />
          <SummaryTile
            label={t("summary.paid")}
            value={initialSummary.paidInvoices.toString()}
          />
        </div>
      )}

      <div className="grid gap-3 rounded-xl bg-surface-container-lowest p-4 sm:grid-cols-2 lg:grid-cols-4">
        <select
          className={INPUT_CLASS}
          onChange={(e) =>
            handleStatusChange(e.target.value as "all" | AdminInvoiceStatus)
          }
          value={activeStatus}
        >
          {FILTERS.map((f) => (
            <option key={f} value={f}>
              {t(`filter.${f}`)}
            </option>
          ))}
        </select>
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
        <label className="block">
          <span className="sr-only">{t("filters.dueDateFrom")}</span>
          <input
            className={INPUT_CLASS}
            onChange={(e) => handleFilterChange("dueDateFrom", e.target.value)}
            placeholder={t("filters.dueDateFrom")}
            title={t("filters.dueDateFrom")}
            type="date"
            value={filters.dueDateFrom}
          />
        </label>
        <label className="block">
          <span className="sr-only">{t("filters.dueDateTo")}</span>
          <input
            className={INPUT_CLASS}
            onChange={(e) => handleFilterChange("dueDateTo", e.target.value)}
            placeholder={t("filters.dueDateTo")}
            title={t("filters.dueDateTo")}
            type="date"
            value={filters.dueDateTo}
          />
        </label>
      </div>

      {invoices.length === 0 ? (
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
                <th className="px-5 py-3">{t("table.amount")}</th>
                <th className="px-5 py-3">{t("table.status")}</th>
                <th className="px-5 py-3">{t("table.dueDate")}</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((invoice) => {
                const displayName =
                  invoice.userName ??
                  invoice.userEmail ??
                  invoice.userId.slice(0, 8);
                return (
                  <tr
                    className="border-t border-surface-container-high"
                    key={invoice.id}
                  >
                    <td className="px-5 py-3 font-medium text-on-surface">
                      {displayName}
                      {invoice.userName && invoice.userEmail ? (
                        <p className="text-xs text-on-surface-variant">
                          {invoice.userEmail}
                        </p>
                      ) : null}
                      {invoice.description ? (
                        <p className="text-xs text-on-surface-variant">
                          {invoice.description}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-5 py-3 text-on-surface">
                      {formatBRL(invoice.amount)}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${STATUS_STYLE[invoice.status]}`}
                      >
                        {t(`status.${invoice.status}`)}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-on-surface-variant">
                      {formatDate(invoice.dueDate)}
                    </td>
                  </tr>
                );
              })}
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
        onClose={() => setFormOpen(false)}
        open={formOpen}
        title={t("form.createTitle")}
        wide
      >
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label={t("form.user")}>
              <SearchableSelect
                onChange={(v) => {
                  setUserId(v);
                  setSubscriptionId("");
                }}
                options={initialUsers.map((u) => ({
                  value: u.id,
                  label: u.name ?? u.email,
                  hint: u.name ? u.email : undefined,
                }))}
                placeholder={t("form.user")}
                value={userId}
              />
            </Field>
            <Field label={t("form.subscription")}>
              <select
                className={INPUT_CLASS}
                onChange={(e) => setSubscriptionId(e.target.value)}
                value={subscriptionId}
              >
                <option value="">—</option>
                {userSubscriptions.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.id.slice(0, 8)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={t("form.amount")}>
              <BrlInput
                cents={amountCents}
                className={INPUT_CLASS}
                max={MAX_AMOUNT_CENTS}
                onChange={setAmountCents}
                required
              />
            </Field>
            <Field label={t("form.dueDate")}>
              <input
                className={INPUT_CLASS}
                min={todayYmd}
                onChange={(e) => setDueDate(e.target.value)}
                onInput={(e) => e.currentTarget.setCustomValidity("")}
                onInvalid={(e) => {
                  if (e.currentTarget.validity.valueMissing) {
                    e.currentTarget.setCustomValidity(tc("fieldRequired"));
                  }
                }}
                required
                type="date"
                value={dueDate}
              />
            </Field>
          </div>
          <Field label={t("form.description")}>
            <input
              className={INPUT_CLASS}
              onChange={(e) => setDescription(e.target.value)}
              value={description}
            />
          </Field>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Field label={t("form.lateFeePercent")}>
              <input
                className={INPUT_CLASS}
                inputMode="decimal"
                onChange={(e) => setLateFeePercent(e.target.value)}
                value={lateFeePercent}
              />
            </Field>
            <Field label={t("form.lateInterestType")}>
              <select
                className={INPUT_CLASS}
                onChange={(e) =>
                  setLateInterestType(e.target.value as LateInterestType)
                }
                value={lateInterestType}
              >
                <option value="simple">{t("form.simple")}</option>
                <option value="compound">{t("form.compound")}</option>
              </select>
            </Field>
            <Field label={t("form.lateInterestPercent")}>
              <input
                className={INPUT_CLASS}
                inputMode="decimal"
                onChange={(e) => setLateInterestPercent(e.target.value)}
                value={lateInterestPercent}
              />
            </Field>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              className="h-10 rounded-xl px-4 text-sm font-semibold text-on-surface-variant hover:text-on-surface"
              onClick={() => setFormOpen(false)}
              type="button"
            >
              {tc("cancel")}
            </button>
            <button
              className="h-10 rounded-xl bg-gradient-to-br from-primary to-primary-dim px-5 text-sm font-bold text-on-primary shadow-lg shadow-primary/10 disabled:opacity-60"
              disabled={isMutating || !userId}
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

const STATUS_STYLE: Record<AdminInvoiceStatus, string> = {
  pending: "bg-amber-500/10 text-amber-600",
  paid: "bg-emerald-500/10 text-emerald-600",
  overdue: "bg-rose-500/10 text-rose-600",
  cancelled: "bg-surface-container-high text-on-surface-variant",
};

function SummaryTile({
  label,
  value,
  hint,
}: {
  readonly label: string;
  readonly value: string;
  readonly hint?: string;
}) {
  return (
    <div className="rounded-xl bg-surface-container-lowest p-5 shadow-ambient">
      <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-on-surface-variant">
        <span>{label}</span>
        {hint && (
          <Tooltip content={hint} side="top">
            <Info className="h-3 w-3 cursor-help text-on-surface-variant/60" />
          </Tooltip>
        )}
      </div>
      <p className="mt-2 font-display text-2xl font-extrabold text-on-surface">
        {value}
      </p>
    </div>
  );
}

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
