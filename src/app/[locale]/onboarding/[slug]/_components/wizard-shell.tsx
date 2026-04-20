"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import type {
  BusinessProfileView,
  WorkType,
} from "@/lib/services";
import { minsRemaining } from "../_lib/onb-config";
import type { WizardStep } from "../_lib/types";
import { AgentPreview } from "./agent-preview";
import { OnbProgress } from "./onb-progress";

interface WizardShellProps {
  readonly currentStep: WizardStep;
  readonly email: string;
  readonly profileView: BusinessProfileView | null;
  readonly workType: WorkType | null;
  readonly children: ReactNode;
}

const EYEBROW_KEYS = {
  1: "step1",
  2: "step2",
  3: "step3",
  4: "step4",
  5: "step5",
  6: "step6",
  7: "step7",
  8: "step8",
} as const;

const TITLE_NAMESPACES = {
  1: "step1",
  2: "step2",
  3: "step3",
  4: "step4",
  5: "step5",
  6: "step6",
  7: "step7",
  8: "step8",
} as const;

/**
 * Editorial 2-column shell for the onboarding wizard.
 * Owns the eyebrow + title + subtitle (read from i18n by step number).
 * Each step body still owns its own nav (Voltar / Skip / Continuar) because
 * submit logic is step-specific, but visual classes are unified via .onb-*.
 *
 * Step 8 (ready) bypasses this shell and renders full-bleed in wizard.tsx.
 */
export function WizardShell({
  currentStep,
  email,
  profileView,
  workType,
  children,
}: WizardShellProps) {
  const t = useTranslations("onboarding");
  const tEye = useTranslations("onboarding.eyebrows");
  const tStep = useTranslations(
    `onboarding.${TITLE_NAMESPACES[currentStep]}`,
  );

  const minsLeft = minsRemaining(currentStep);
  const eyebrow = tEye(EYEBROW_KEYS[currentStep]);
  const title = tStep("title");
  // Some steps interpolate `email` in the subtitle (notably step 1).
  const subtitle = (() => {
    try {
      return tStep("subtitle", { email });
    } catch {
      try {
        return tStep("subtitle");
      } catch {
        return "";
      }
    }
  })();

  return (
    <div className="onb-root">
      <div className="onb-split">
        <aside className="onb-left">
          <div className="onb-left-top">
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/45">
              {t("bulletin.label")}
            </div>
            <button className="onb-exit" type="button">
              {t("bulletin.exit")}
            </button>
          </div>
          <AgentPreview
            currentStep={currentStep}
            profileView={profileView}
            workType={workType}
          />
        </aside>

        <main className="onb-right">
          <OnbProgress currentStep={currentStep} minsLeft={minsLeft} />

          <div className="onb-form">
            <div className="onb-eye">{eyebrow}</div>
            <h1 className="onb-title">{title}</h1>
            {subtitle && <p className="onb-sub">{subtitle}</p>}

            <div className="onb-body" key={currentStep}>
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
