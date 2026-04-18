"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { PlanPublic } from "@/lib/services";
import { AdminHeader } from "../../_components/admin-header";
import { Modal } from "../../_components/modal";
import { formatBRL, formatDate } from "../../_lib/format";
import {
  createPlanAction,
  deletePlanAction,
  updatePlanAction,
} from "../actions";

interface PlansViewProps {
  readonly initialPlans: readonly PlanPublic[];
  readonly errorMessage: string | null;
}

export function PlansView({ initialPlans, errorMessage }: PlansViewProps) {
  const t = useTranslations("admin.plans");
  const tc = useTranslations("common");
  const tCommon = useTranslations("admin.common");

  const [plans, setPlans] = useState<readonly PlanPublic[]>(initialPlans);
  const [formState, setFormState] = useState<
    { mode: "create" } | { mode: "edit"; plan: PlanPublic } | null
  >(null);
  const [name, setName] = useState("");
  const [cost, setCost] = useState("");
  const [isPending, startTransition] = useTransition();

  function openCreate() {
    setName("");
    setCost("");
    setFormState({ mode: "create" });
  }

  function openEdit(plan: PlanPublic) {
    setName(plan.name);
    setCost(String(plan.cost));
    setFormState({ mode: "edit", plan });
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!formState) return;
    const parsedCost = Number.parseFloat(cost.replace(",", "."));
    if (!Number.isFinite(parsedCost)) {
      toast.error(tCommon("loadError"));
      return;
    }

    startTransition(async () => {
      if (formState.mode === "create") {
        const result = await createPlanAction({
          name: name.trim(),
          cost: parsedCost,
        });
        if (!result.success || !result.data) {
          toast.error(result.error ?? tCommon("loadError"));
          return;
        }
        setPlans((prev) => [result.data as PlanPublic, ...prev]);
        toast.success(t("created"));
      } else {
        const result = await updatePlanAction(formState.plan.id, {
          name: name.trim(),
          cost: parsedCost,
        });
        if (!result.success || !result.data) {
          toast.error(result.error ?? tCommon("loadError"));
          return;
        }
        const updated = result.data;
        setPlans((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
        toast.success(t("updated"));
      }
      setFormState(null);
    });
  }

  function handleDelete(plan: PlanPublic) {
    if (!window.confirm(t("deleteConfirm"))) return;
    startTransition(async () => {
      const result = await deletePlanAction(plan.id);
      if (!result.success) {
        toast.error(result.error ?? tCommon("loadError"));
        return;
      }
      setPlans((prev) => prev.filter((p) => p.id !== plan.id));
      toast.success(t("deleted"));
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

      {plans.length === 0 ? (
        <div className="rounded-xl bg-surface-container-lowest p-8 text-center text-sm text-on-surface-variant">
          {t("empty")}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl bg-surface-container-lowest shadow-ambient">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs font-semibold uppercase tracking-widest text-on-surface-variant">
                <th className="px-5 py-3">{t("table.name")}</th>
                <th className="px-5 py-3">{t("table.cost")}</th>
                <th className="px-5 py-3">{t("table.createdAt")}</th>
                <th className="px-5 py-3">{t("table.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {plans.map((plan) => (
                <tr
                  className="border-t border-surface-container-high"
                  key={plan.id}
                >
                  <td className="px-5 py-3 font-medium text-on-surface">
                    {plan.name}
                  </td>
                  <td className="px-5 py-3 text-on-surface-variant">
                    {formatBRL(plan.cost)}
                  </td>
                  <td className="px-5 py-3 text-on-surface-variant">
                    {formatDate(plan.createdAt)}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex gap-3">
                      <button
                        className="text-on-surface-variant hover:text-on-surface"
                        onClick={() => openEdit(plan)}
                        type="button"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        className="text-on-surface-variant hover:text-danger"
                        disabled={isPending}
                        onClick={() => handleDelete(plan)}
                        type="button"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
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
          <label className="block space-y-1">
            <span className="font-display text-xs font-semibold text-on-surface">
              {t("form.name")}
            </span>
            <input
              className="h-10 w-full rounded-lg bg-surface-container-high px-3 text-sm text-on-surface outline-none focus:bg-surface-container-lowest focus:ring-1 focus:ring-primary/30"
              onChange={(e) => setName(e.target.value)}
              required
              value={name}
            />
          </label>
          <label className="block space-y-1">
            <span className="font-display text-xs font-semibold text-on-surface">
              {t("form.cost")}
            </span>
            <input
              className="h-10 w-full rounded-lg bg-surface-container-high px-3 text-sm text-on-surface outline-none focus:bg-surface-container-lowest focus:ring-1 focus:ring-primary/30"
              inputMode="decimal"
              onChange={(e) => setCost(e.target.value)}
              required
              value={cost}
            />
          </label>
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
