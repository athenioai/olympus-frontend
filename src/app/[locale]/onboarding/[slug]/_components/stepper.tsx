"use client";

import { useTranslations } from "next-intl";
import { TOTAL_STEPS, type WizardStep } from "../_lib/types";

interface StepperProps {
  readonly currentStep: WizardStep;
}

export function Stepper({ currentStep }: StepperProps) {
  const t = useTranslations("onboarding");

  return (
    <div className="space-y-2">
      <div
        aria-label={t("stepLabel", {
          current: currentStep,
          total: TOTAL_STEPS,
        })}
        className="hidden items-center gap-1 sm:flex"
        role="progressbar"
      >
        {Array.from({ length: TOTAL_STEPS }).map((_, i) => {
          const step = (i + 1) as WizardStep;
          const active = step <= currentStep;
          return (
            <div
              aria-hidden="true"
              className={`h-2 flex-1 rounded-full transition-colors duration-300 ${
                active ? "bg-primary" : "bg-surface-container-high"
              }`}
              key={step}
            />
          );
        })}
      </div>
      <p className="text-center text-xs font-medium tracking-tight text-on-surface-variant sm:text-left">
        {t("stepLabel", { current: currentStep, total: TOTAL_STEPS })}
      </p>
    </div>
  );
}
