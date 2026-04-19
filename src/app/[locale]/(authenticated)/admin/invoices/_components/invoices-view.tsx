"use client";

import { useMemo, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Check, Plus, X as XIcon } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import type {
  AdminInvoicePublic,
  AdminInvoiceStatus,
  AdminInvoiceSummary,
  AdminUserPublic,
  LateInterestType,
  SubscriptionPublic,
} from "@/lib/services";
import { AdminHeader } from "../../_components/admin-header";
import { Modal } from "../../_components/modal";
import { endOfDayIsoInSaoPaulo } from "../../_lib/date";
import { formatBRL, formatDate } from "../../_lib/format";
import {
  cancelInvoiceAction,
  createInvoiceAction,
  markInvoicePaidAction,
} from "../actions";

interface InvoicesViewProps {
  readonly initialInvoices: readonly AdminInvoicePublic[];
  readonly initialSummary: AdminInvoiceSummary | null;
  readonly initialUsers: readonly AdminUserPublic[];
  readonly initialSubscriptions: readonly SubscriptionPublic[];
  readonly errorMessage: string | null;
}

const FILTERS: readonly ("all" | AdminInvoiceStatus)[] = [
  "all",
  "pending",
  "paid",
  "overdue",
  "cancelled",
];

export function InvoicesView({
  initialInvoices,
  initialSummary,
  initialUsers,
  initialSubscriptions,
  errorMessage,
}: InvoicesViewProps) {
  const t = useTranslations("admin.invoices");
  const tc = useTranslations("common");
  const tCommon = useTranslations("admin.common");

  const [invoices, setInvoices] = useState<readonly AdminInvoicePublic[]>(
    initialInvoices,
  );
  const [filter, setFilter] = useState<"all" | AdminInvoiceStatus>("all");
  const [formOpen, setFormOpen] = useState(false);

  const [userId, setUserId] = useState("");
  const [subscriptionId, setSubscriptionId] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [lateFeePercent, setLateFeePercent] = useState("2");
  const [lateInterestType, setLateInterestType] =
    useState<LateInterestType>("simple");
  const [lateInterestPercent, setLateInterestPercent] = useState("1");

  const [pendingAction, setPendingAction] = useState<
    { kind: "markPaid" | "cancel"; invoice: AdminInvoicePublic } | null
  >(null);
  const [isPending, startTransition] = useTransition();

  const userMap = useMemo(
    () => Object.fromEntries(initialUsers.map((u) => [u.id, u])),
    [initialUsers],
  );

  const userSubscriptions = useMemo(
    () =>
      initialSubscriptions.filter(
        (s) => s.userId === userId && s.status === "active",
      ),
    [initialSubscriptions, userId],
  );

  const filtered = useMemo(() => {
    if (filter === "all") return invoices;
    return invoices.filter((i) => i.status === filter);
  }, [invoices, filter]);

  function openCreate() {
    setUserId(initialUsers[0]?.id ?? "");
    setSubscriptionId("");
    setAmount("");
    setDescription("");
    setDueDate("");
    setLateFeePercent("2");
    setLateInterestType("simple");
    setLateInterestPercent("1");
    setFormOpen(true);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const amountParsed = Number.parseFloat(amount.replace(",", "."));
    // Backend accepts 0.01..999999.99. Reject client-side to give a
    // specific message instead of letting Zod error bubble up as INVALID_INPUT.
    if (
      !Number.isFinite(amountParsed) ||
      amountParsed < 0.01 ||
      amountParsed > 999999.99
    ) {
      toast.error(t("form.amountOutOfRange"));
      return;
    }
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

    startTransition(async () => {
      const result = await createInvoiceAction(payload);
      if (!result.success || !result.data) {
        toast.error(result.error ?? tCommon("loadError"));
        return;
      }
      setInvoices((prev) => [result.data as AdminInvoicePublic, ...prev]);
      setFormOpen(false);
      toast.success(t("created"));
    });
  }

  function confirmPendingAction() {
    if (!pendingAction) return;
    const { kind, invoice } = pendingAction;
    startTransition(async () => {
      const result =
        kind === "markPaid"
          ? await markInvoicePaidAction(invoice.id)
          : await cancelInvoiceAction(invoice.id);
      if (!result.success || !result.data) {
        toast.error(result.error ?? tCommon("loadError"));
        return;
      }
      const updated = result.data;
      setInvoices((prev) =>
        prev.map((i) => (i.id === updated.id ? updated : i)),
      );
      setPendingAction(null);
      toast.success(kind === "markPaid" ? t("marked") : t("cancelled"));
    });
  }

  return (
    <div className="space-y-6">
      <AdminHeader
        actions={
          <button
            className="flex h-10 items-center gap-2 rounded-xl bg-gradient-to-br from-primary to-primary-dim px-4 text-sm font-bold text-on-primary shadow-lg shadow-primary/10"
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

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            className={`h-9 rounded-full px-4 text-xs font-semibold transition-colors ${
              filter === f
                ? "bg-primary/10 text-primary"
                : "bg-surface-container-high text-on-surface-variant hover:text-on-surface"
            }`}
            key={f}
            onClick={() => setFilter(f)}
            type="button"
          >
            {t(`filter.${f}`)}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl bg-surface-container-lowest p-8 text-center text-sm text-on-surface-variant">
          {t("empty")}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl bg-surface-container-lowest shadow-ambient">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs font-semibold uppercase tracking-widest text-on-surface-variant">
                <th className="px-5 py-3">{t("table.user")}</th>
                <th className="px-5 py-3">{t("table.amount")}</th>
                <th className="px-5 py-3">{t("table.status")}</th>
                <th className="px-5 py-3">{t("table.dueDate")}</th>
                <th className="px-5 py-3">{t("table.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((invoice) => {
                const user = userMap[invoice.userId];
                const canTransition = invoice.status === "pending";
                return (
                  <tr
                    className="border-t border-surface-container-high"
                    key={invoice.id}
                  >
                    <td className="px-5 py-3 font-medium text-on-surface">
                      {user?.name ?? user?.email ?? invoice.userId.slice(0, 8)}
                      {invoice.description && (
                        <p className="text-xs text-on-surface-variant">
                          {invoice.description}
                        </p>
                      )}
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
                    <td className="px-5 py-3">
                      <div className="flex gap-2">
                        <button
                          className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-emerald-600 hover:bg-emerald-500/10 disabled:cursor-not-allowed disabled:opacity-40"
                          disabled={!canTransition || isPending}
                          onClick={() =>
                            setPendingAction({ kind: "markPaid", invoice })
                          }
                          type="button"
                        >
                          <Check className="h-3.5 w-3.5" />
                          {t("markPaid")}
                        </button>
                        <button
                          className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-500/10 disabled:cursor-not-allowed disabled:opacity-40"
                          disabled={!canTransition || isPending}
                          onClick={() =>
                            setPendingAction({ kind: "cancel", invoice })
                          }
                          type="button"
                        >
                          <XIcon className="h-3.5 w-3.5" />
                          {t("cancel")}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
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
              <select
                className={INPUT_CLASS}
                onChange={(e) => {
                  setUserId(e.target.value);
                  setSubscriptionId("");
                }}
                required
                value={userId}
              >
                {initialUsers.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name ?? user.email}
                  </option>
                ))}
              </select>
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
              <input
                className={INPUT_CLASS}
                inputMode="decimal"
                onChange={(e) => setAmount(e.target.value)}
                required
                value={amount}
              />
            </Field>
            <Field label={t("form.dueDate")}>
              <input
                className={INPUT_CLASS}
                onChange={(e) => setDueDate(e.target.value)}
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
              disabled={isPending}
              type="submit"
            >
              {tc("save")}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        cancelLabel={tc("cancel")}
        confirmLabel={
          pendingAction?.kind === "markPaid"
            ? t("markPaid")
            : t("cancel")
        }
        description={
          pendingAction?.kind === "markPaid"
            ? t("markPaidConfirm")
            : t("cancelConfirm")
        }
        isPending={isPending}
        onCancel={() => setPendingAction(null)}
        onConfirm={confirmPendingAction}
        open={pendingAction !== null}
        title={tc("confirm")}
        variant={pendingAction?.kind === "cancel" ? "danger" : "default"}
      />
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
}: {
  readonly label: string;
  readonly value: string;
}) {
  return (
    <div className="rounded-xl bg-surface-container-lowest p-5 shadow-ambient">
      <p className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant">
        {label}
      </p>
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
