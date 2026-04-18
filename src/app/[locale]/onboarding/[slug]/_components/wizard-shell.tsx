"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Hexagon } from "lucide-react";
import type { WizardStep } from "../_lib/types";
import { Stepper } from "./stepper";
import { ProgressBar } from "./progress-bar";

interface WizardShellProps {
  readonly email: string;
  readonly currentStep: WizardStep;
  readonly scorePercent: number;
  readonly children: ReactNode;
}

export function WizardShell({
  email,
  currentStep,
  scorePercent,
  children,
}: WizardShellProps) {
  const t = useTranslations("onboarding");

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_50%_0%,#faf9f7_0%,#f4f4f1_100%)]">
      <div className="mx-auto flex min-h-screen max-w-3xl flex-col px-6 py-10">
        <header className="mb-8 space-y-4">
          <div className="flex items-center gap-3">
            <Hexagon
              className="h-8 w-8 fill-primary/20 text-primary"
              strokeWidth={1.5}
            />
            <p className="font-display text-sm font-semibold tracking-tight text-on-surface">
              {t("headerTitle", { email })}
            </p>
          </div>
          <Stepper currentStep={currentStep} />
          <ProgressBar percent={scorePercent} />
        </header>

        <main className="glass flex-1 rounded-xl border border-white/40 p-8 shadow-ambient sm:p-10">
          {children}
        </main>
      </div>
    </div>
  );
}
