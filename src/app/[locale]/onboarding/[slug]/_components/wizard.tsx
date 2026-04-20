"use client";

import { useState } from "react";
import type {
  StepUpdate,
  WizardInitialState,
  WizardStep,
} from "../_lib/types";
import { Step1Password } from "./steps/step-1-password";
import { Step2WorkType } from "./steps/step-2-work-type";
import { Step3Business } from "./steps/step-3-business";
import { Step4Vertical } from "./steps/step-4-vertical";
import { Step5Modality } from "./steps/step-5-modality";
import { Step6Policies } from "./steps/step-6-policies";
import { Step7Extras } from "./steps/step-7-extras";
import { Step8Success } from "./steps/step-8-success";
import { WizardShell } from "./wizard-shell";

export interface StepProps {
  readonly slug: string;
  readonly state: WizardInitialState;
  readonly onAdvance: (update: StepUpdate, next: WizardStep) => void;
  readonly onBack: () => void;
  readonly onFinish: () => void;
  readonly onSkip: () => void;
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

  function skip() {
    setState((prev) => {
      if (prev.currentStep >= 8) return prev;
      return {
        ...prev,
        currentStep: (prev.currentStep + 1) as WizardStep,
      };
    });
  }

  function finish() {
    window.location.href = "/dashboard";
  }

  const stepProps: StepProps = {
    slug: state.slug,
    state,
    onAdvance: advance,
    onBack: back,
    onFinish: finish,
    onSkip: skip,
  };

  // Step 8 (ready) is full-bleed — bypass the split shell.
  if (state.currentStep === 8) {
    return (
      <div className="onb-root ready">
        <Step8Success {...stepProps} />
      </div>
    );
  }

  return (
    <WizardShell
      currentStep={state.currentStep}
      email={state.email}
      profileView={state.profileView}
      workType={state.workType}
    >
      <StepContent {...stepProps} />
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
      return <Step3Business {...props} />;
    case 4:
      return <Step4Vertical {...props} />;
    case 5:
      return <Step5Modality {...props} />;
    case 6:
      return <Step6Policies {...props} />;
    case 7:
      return <Step7Extras {...props} />;
    case 8:
      return null;
  }
}
