"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { motion } from "motion/react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { formatBRL } from "@/lib/format";
import { getPlanChangeAction } from "../_lib/plan-change-decision";
import { changePlan } from "../actions";
import type { PlanOption } from "@/lib/services/plan-options-source";

interface ChangePlanModalProps {
  readonly currentPlan: { readonly id: string; readonly cost: number };
  readonly plans: readonly PlanOption[];
  readonly currentPeriodEnd: string;
  readonly onClose: () => void;
  readonly onConfirmed: () => void;
}

type Phase = "select" | "confirm";
type ChangeAction = "upgrade" | "downgrade";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function ChangePlanModal({
  currentPlan,
  plans,
  currentPeriodEnd,
  onClose,
  onConfirmed,
}: ChangePlanModalProps) {
  const t = useTranslations("billing.changePlanModal");
  const tc = useTranslations("common");
  const [phase, setPhase] = useState<Phase>("select");
  const [selectedPlan, setSelectedPlan] = useState<PlanOption | null>(null);
  const [selectedAction, setSelectedAction] = useState<ChangeAction | null>(
    null,
  );
  const [isPending, startTransition] = useTransition();

  function handleSelectPlan(plan: PlanOption, action: ChangeAction) {
    setSelectedPlan(plan);
    setSelectedAction(action);
    setPhase("confirm");
  }

  function handleBack() {
    setPhase("select");
    setSelectedPlan(null);
    setSelectedAction(null);
  }

  function handleConfirm() {
    if (!selectedPlan?.id || !selectedAction) return;
    startTransition(async () => {
      const result = await changePlan(selectedAction, selectedPlan.id!);
      if (result.success) {
        onConfirmed();
      } else {
        toast.error(result.error ?? tc("error"));
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-on-surface/20 backdrop-blur-sm"
        onClick={onClose}
        onKeyDown={() => {}}
        role="presentation"
      />
      <motion.div
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative z-10 flex w-full max-w-2xl flex-col rounded-xl bg-surface-container-lowest shadow-ambient-strong"
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        style={{ maxHeight: "min(90vh, 640px)" }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="px-8 pb-4 pt-8">
          <h2 className="font-display text-xl font-bold tracking-tight text-on-surface">
            {t("title")}
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto px-8 pb-6">
          {phase === "select" && (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {plans.map((plan) => {
                const action = getPlanChangeAction(
                  currentPlan.cost,
                  plan.cost,
                );
                const isCurrent = action === "current";

                return (
                  <div
                    className={cn(
                      "flex flex-col rounded-xl p-4 transition-colors",
                      isCurrent
                        ? "bg-primary/5 ring-1 ring-primary/20"
                        : "bg-surface-container-low hover:bg-surface-container-high",
                    )}
                    key={plan.id ?? plan.slug ?? plan.name}
                  >
                    <h3 className="font-display text-sm font-bold text-on-surface">
                      {plan.name}
                    </h3>
                    <p className="mt-1 text-[13px] font-medium text-on-surface-variant">
                      {formatBRL(plan.cost)}
                    </p>
                    <div className="mt-auto pt-4">
                      {isCurrent ? (
                        <span className="inline-flex h-8 items-center rounded-lg px-3 text-[13px] font-medium text-primary">
                          {t("current")}
                        </span>
                      ) : (
                        <button
                          className={cn(
                            "flex h-8 w-full items-center justify-center rounded-lg text-[13px] font-bold transition-opacity",
                            action === "upgrade"
                              ? "bg-primary text-on-primary hover:opacity-90"
                              : "bg-surface-container-high text-on-surface hover:bg-surface-container-highest",
                          )}
                          disabled={plan.id === null || isPending}
                          onClick={() =>
                            plan.id &&
                            handleSelectPlan(
                              plan,
                              action as ChangeAction,
                            )
                          }
                          type="button"
                        >
                          {action === "upgrade"
                            ? t("upgrade")
                            : t("downgrade")}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {phase === "confirm" && selectedPlan && selectedAction && (
            <div className="space-y-4">
              <button
                className="inline-flex items-center gap-1.5 text-sm font-medium text-on-surface-variant transition-colors hover:text-on-surface"
                onClick={handleBack}
                type="button"
              >
                <ArrowLeft className="h-4 w-4" />
                {tc("back")}
              </button>

              <div className="rounded-xl bg-surface-container-low p-5">
                <h3 className="font-display text-base font-bold text-on-surface">
                  {selectedAction === "upgrade"
                    ? t("confirmUpgrade.title")
                    : t("confirmDowngrade.title")}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">
                  {selectedAction === "upgrade"
                    ? t("confirmUpgrade.body", {
                        date: formatDate(currentPeriodEnd),
                      })
                    : t("confirmDowngrade.body", {
                        date: formatDate(currentPeriodEnd),
                      })}
                </p>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-sm text-on-surface-variant">
                    {selectedPlan.name}
                  </span>
                  <span className="font-display text-lg font-bold text-on-surface">
                    {formatBRL(selectedPlan.cost)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-surface-container-high px-8 py-5">
          <button
            className="h-10 rounded-xl px-5 text-sm font-medium text-on-surface-variant transition-colors hover:bg-surface-container-high"
            disabled={isPending}
            onClick={onClose}
            type="button"
          >
            {tc("cancel")}
          </button>
          {phase === "confirm" && (
            <button
              className={cn(
                "flex h-10 items-center gap-2 rounded-xl px-5 text-sm font-bold transition-opacity disabled:opacity-60",
                selectedAction === "upgrade"
                  ? "bg-primary text-on-primary hover:opacity-90"
                  : "bg-surface-container-high text-on-surface hover:bg-surface-container-highest",
              )}
              disabled={isPending}
              onClick={handleConfirm}
              type="button"
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {selectedAction === "upgrade"
                ? t("confirmUpgrade.confirm")
                : t("confirmDowngrade.confirm")}
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
