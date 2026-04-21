"use client";

import { useMemo, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Pencil, Plus } from "lucide-react";
import { toast } from "sonner";
import type {
  AdminUserPublic,
  PlanPublic,
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

interface SubscriptionsViewProps {
  readonly initialSubscriptions: readonly SubscriptionPublic[];
  readonly initialUsers: readonly AdminUserPublic[];
  readonly initialPlans: readonly PlanPublic[];
  readonly errorMessage: string | null;
}

const STATUSES: readonly SubscriptionStatus[] = [
  "active",
  "suspended",
  "cancelled",
];

export function SubscriptionsView({
  initialSubscriptions,
  initialUsers,
  initialPlans,
  errorMessage,
}: SubscriptionsViewProps) {
  const t = useTranslations("admin.subscriptions");
  const tc = useTranslations("common");
  const tCommon = useTranslations("admin.common");

  const [subscriptions, setSubscriptions] = useState<readonly SubscriptionPublic[]>(
    initialSubscriptions,
  );
  const [formState, setFormState] = useState<
    { mode: "create" } | { mode: "edit"; subscription: SubscriptionPublic } | null
  >(null);

  const [userId, setUserId] = useState("");
  const [planId, setPlanId] = useState("");
  const [billingDay, setBillingDay] = useState("1");
  const [status, setStatus] = useState<SubscriptionStatus>("active");
  const [isPending, startTransition] = useTransition();

  const userMap = useMemo(
    () => Object.fromEntries(initialUsers.map((u) => [u.id, u])),
    [initialUsers],
  );
  const planMap = useMemo(
    () => Object.fromEntries(initialPlans.map((p) => [p.id, p])),
    [initialPlans],
  );

  function openCreate() {
    setUserId(initialUsers[0]?.id ?? "");
    setPlanId(initialPlans[0]?.id ?? "");
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
    const day = Number.parseInt(billingDay, 10);
    if (!Number.isFinite(day) || day < 1 || day > 28) {
      toast.error(tCommon("loadError"));
      return;
    }

    startTransition(async () => {
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
        setSubscriptions((prev) => [
          result.data as SubscriptionPublic,
          ...prev,
        ]);
        toast.success(t("created"));
      } else {
        const result = await updateSubscriptionAction(formState.subscription.id, {
          planId,
          billingDay: day,
          status,
        });
        if (!result.success || !result.data) {
          toast.error(result.error ?? tCommon("loadError"));
          return;
        }
        const updated = result.data;
        setSubscriptions((prev) =>
          prev.map((s) => (s.id === updated.id ? updated : s)),
        );
        toast.success(t("updated"));
      }
      setFormState(null);
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

      {subscriptions.length === 0 ? (
        <div className="rounded-xl bg-surface-container-lowest p-8 text-center text-sm text-on-surface-variant">
          {t("empty")}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl bg-surface-container-lowest shadow-ambient">
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
              {subscriptions.map((sub) => {
                const user = userMap[sub.userId];
                const plan = planMap[sub.planId];
                return (
                  <tr
                    className="border-t border-surface-container-high"
                    key={sub.id}
                  >
                    <td className="px-5 py-3 font-medium text-on-surface">
                      {user?.name ?? user?.email ?? "—"}
                    </td>
                    <td className="px-5 py-3 text-on-surface-variant">
                      {plan?.name ?? "—"}
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
                );
              })}
            </tbody>
          </table>
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
            <select
              className={INPUT_CLASS}
              disabled={formState?.mode === "edit"}
              onChange={(e) => setUserId(e.target.value)}
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
          <Field label={t("form.plan")}>
            <select
              className={INPUT_CLASS}
              onChange={(e) => setPlanId(e.target.value)}
              required
              value={planId}
            >
              {initialPlans.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.name}
                </option>
              ))}
            </select>
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
              disabled={isPending}
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
