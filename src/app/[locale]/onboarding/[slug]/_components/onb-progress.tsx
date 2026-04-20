"use client";

import { useTranslations } from "next-intl";
import { TOTAL_STEPS, type WizardStep } from "../_lib/types";

interface OnbProgressProps {
  readonly currentStep: WizardStep;
  readonly minsLeft: number;
}

/** Top progress strip: step counter + ETA pill + segmented bar. */
export function OnbProgress({ currentStep, minsLeft }: OnbProgressProps) {
  const t = useTranslations("onboarding");

  return (
    <div className="onb-progress">
      <div className="onb-progress-meta">
        <div className="flex items-baseline gap-2 whitespace-nowrap">
          <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-on-surface-variant/70">
            {t("stepWord")}
          </span>
          <span className="font-display text-[15px] font-bold text-on-surface">
            {currentStep}
            <span className="ml-1 font-mono text-xs font-normal text-on-surface-variant/70">
              /{TOTAL_STEPS}
            </span>
          </span>
        </div>
        <div className="onb-eta font-mono text-[11px] tracking-[0.06em] text-on-surface-variant">
          {minsLeft > 0
            ? t("etaMins", { mins: minsLeft })
            : t("etaFinal")}
        </div>
      </div>
      <div className="onb-progress-segs">
        {Array.from({ length: TOTAL_STEPS }).map((_, i) => {
          const stepNumber = i + 1;
          const cls =
            stepNumber < currentStep
              ? "onb-progress-seg done"
              : stepNumber === currentStep
                ? "onb-progress-seg cur"
                : "onb-progress-seg";
          return <span className={cls} key={stepNumber} />;
        })}
      </div>
    </div>
  );
}
