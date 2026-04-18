"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { ConciergeBell, Shuffle, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import type { WorkType } from "@/lib/services";
import { setWorkTypeAction } from "../../actions";
import type { StepProps } from "../wizard";

const OPTIONS: readonly {
  readonly value: WorkType;
  readonly icon: React.ComponentType<{ readonly className?: string }>;
}[] = [
  { value: "services", icon: ConciergeBell },
  { value: "sales", icon: ShoppingCart },
  { value: "hybrid", icon: Shuffle },
];

export function Step2WorkType({ state, onAdvance, onBack }: StepProps) {
  const t = useTranslations("onboarding.step2");
  const tc = useTranslations("common");
  const tNav = useTranslations("onboarding");

  const [selected, setSelected] = useState<WorkType | null>(
    state.workType ?? null,
  );
  const [isPending, startTransition] = useTransition();

  function handleContinue() {
    if (!selected) return;
    startTransition(async () => {
      const result = await setWorkTypeAction(selected);
      if (!result.success || !result.workType) {
        toast.error(tNav("genericError"));
        return;
      }
      onAdvance({ workType: result.workType }, 3);
    });
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="font-display text-2xl font-bold text-on-surface">
          {t("title")}
        </h2>
        <p className="text-sm text-on-surface-variant">{t("subtitle")}</p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {OPTIONS.map(({ value, icon: Icon }) => {
          const isSelected = selected === value;
          return (
            <button
              aria-pressed={isSelected}
              className={`flex flex-col items-center gap-3 rounded-xl border p-6 text-center transition-all duration-200 ${
                isSelected
                  ? "border-primary bg-primary/5 shadow-ambient"
                  : "border-transparent bg-surface-container-high hover:border-primary/40"
              }`}
              key={value}
              onClick={() => setSelected(value)}
              type="button"
            >
              <Icon
                className={`h-8 w-8 ${
                  isSelected ? "text-primary" : "text-on-surface-variant"
                }`}
              />
              <div className="space-y-0.5">
                <p className="font-display text-sm font-bold text-on-surface">
                  {t(`${value}Title`)}
                </p>
                <p className="text-xs text-on-surface-variant">
                  {t(`${value}Hint`)}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-between pt-2">
        <button
          className="text-sm font-medium text-on-surface-variant hover:text-on-surface disabled:opacity-40"
          disabled
          onClick={onBack}
          type="button"
        >
          {tNav("back")}
        </button>
        <button
          className="flex h-12 items-center gap-2 rounded-xl bg-gradient-to-br from-primary to-primary-dim px-6 font-display font-bold text-on-primary shadow-lg shadow-primary/10 transition-all duration-200 hover:opacity-95 active:scale-[0.98] disabled:opacity-60"
          disabled={!selected || isPending}
          onClick={handleContinue}
          type="button"
        >
          {isPending ? tc("loading") : tNav("next")}
        </button>
      </div>
    </div>
  );
}
