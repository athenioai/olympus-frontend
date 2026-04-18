"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import type { ServiceModality } from "@/lib/services";
import { updateServiceModalityAction } from "../../actions";
import type { StepProps } from "../wizard";

const OPTIONS: readonly ServiceModality[] = [
  "presencial",
  "remoto",
  "domicilio",
  "hibrido",
];

export function Step5Modality({ state, onAdvance, onBack }: StepProps) {
  const t = useTranslations("onboarding.step5");
  const tc = useTranslations("common");
  const tNav = useTranslations("onboarding");

  const [selected, setSelected] = useState<ServiceModality | null>(
    state.profileView?.profile?.serviceModality ?? null,
  );
  const [isPending, startTransition] = useTransition();

  function handleContinue() {
    if (!selected) return;
    startTransition(async () => {
      const result = await updateServiceModalityAction(selected);
      if (!result.success || !result.profileView) {
        toast.error(tNav("genericError"));
        return;
      }
      onAdvance({ profileView: result.profileView }, 6);
    });
  }

  return (
    <div className="space-y-6">
      <h2 className="font-display text-2xl font-bold text-on-surface">
        {t("title")}
      </h2>

      <div className="space-y-2">
        {OPTIONS.map((value) => {
          const isSelected = selected === value;
          return (
            <button
              aria-pressed={isSelected}
              className={`flex w-full items-center gap-4 rounded-xl border p-4 text-left transition-all duration-200 ${
                isSelected
                  ? "border-primary bg-primary/5"
                  : "border-transparent bg-surface-container-high hover:border-primary/40"
              }`}
              key={value}
              onClick={() => setSelected(value)}
              type="button"
            >
              <div
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                  isSelected ? "border-primary" : "border-on-surface-variant/40"
                }`}
              >
                {isSelected && (
                  <div className="h-2.5 w-2.5 rounded-full bg-primary" />
                )}
              </div>
              <div>
                <p className="font-display text-sm font-bold text-on-surface">
                  {t(value)}
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
          className="text-sm font-medium text-on-surface-variant hover:text-on-surface"
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
