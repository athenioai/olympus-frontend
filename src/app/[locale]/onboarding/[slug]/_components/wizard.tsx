"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import type {
  StepUpdate,
  WizardInitialState,
  WizardStep,
} from "../_lib/types";
import { Step1Password } from "./steps/step-1-password";
import { Step2WorkType } from "./steps/step-2-work-type";
import { Step3Vertical } from "./steps/step-3-vertical";
import { Step4Business } from "./steps/step-4-business";
import { Step5Modality } from "./steps/step-5-modality";
import { Step6Policies } from "./steps/step-6-policies";
import { WizardShell } from "./wizard-shell";

export interface StepProps {
  readonly slug: string;
  readonly state: WizardInitialState;
  readonly onAdvance: (update: StepUpdate, next: WizardStep) => void;
  readonly onBack: () => void;
  readonly onFinish: () => void;
}

export function Wizard({ initial }: { readonly initial: WizardInitialState }) {
  const [state, setState] = useState<WizardInitialState>(initial);

  function advance(update: StepUpdate, next: WizardStep) {
    setState((prev) => ({
      ...prev,
      ...update,
      profileView: update.profileView ?? prev.profileView,
      workType: update.workType ?? prev.workType,
      currentStep: next,
    }));
  }

  function back() {
    setState((prev) => {
      if (prev.currentStep <= 1) return prev;
      return {
        ...prev,
        currentStep: (prev.currentStep - 1) as WizardStep,
      };
    });
  }

  function finish() {
    window.location.href = "/dashboard";
  }

  const scorePercent = state.profileView?.score.percentage ?? 0;

  return (
    <WizardShell
      currentStep={state.currentStep}
      email={state.email}
      scorePercent={scorePercent}
    >
      <StepContent
        onAdvance={advance}
        onBack={back}
        onFinish={finish}
        slug={state.slug}
        state={state}
      />
    </WizardShell>
  );
}

function StepContent(props: StepProps) {
  switch (props.state.currentStep) {
    case 1:
      return <Step1Password {...props} />;
    case 2:
      return <Step2WorkType {...props} />;
    case 3:
      return <Step3Vertical {...props} />;
    case 4:
      return <Step4Business {...props} />;
    case 5:
      return <Step5Modality {...props} />;
    case 6:
      return <Step6Policies {...props} />;
    case 7:
      return <StubStep step={7} {...props} />;
    case 8:
      return <StubStep step={8} {...props} />;
  }
}

function StubStep({
  step,
  onBack,
  onAdvance,
}: StepProps & { readonly step: WizardStep }) {
  const t = useTranslations("onboarding");
  const canAdvance = step < 8;

  function handleNext() {
    if (canAdvance) {
      onAdvance({}, (step + 1) as WizardStep);
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="font-display text-xl font-bold text-on-surface">
        Step {step} (stub)
      </h2>
      <div className="flex items-center justify-between">
        <button
          className="text-sm font-medium text-on-surface-variant hover:text-on-surface disabled:opacity-40"
          disabled={step <= 1}
          onClick={onBack}
          type="button"
        >
          {t("back")}
        </button>
        {canAdvance && (
          <button
            className="rounded-xl bg-primary px-6 py-3 font-display font-bold text-on-primary"
            onClick={handleNext}
            type="button"
          >
            {t("next")}
          </button>
        )}
      </div>
    </div>
  );
}
