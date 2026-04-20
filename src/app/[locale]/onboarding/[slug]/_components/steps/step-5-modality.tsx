"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Check } from "lucide-react";
import { toast } from "sonner";
import type { ServiceModality } from "@/lib/services";
import { updateServiceModalityAction } from "../../actions";
import type { StepProps } from "../wizard";
import { OnbNav } from "../onb-nav";

const OPTIONS: readonly ServiceModality[] = [
  "presencial",
  "remoto",
  "domicilio",
  "hibrido",
];

export function Step5Modality({
  state,
  onAdvance,
  onBack,
  onSkip,
}: StepProps) {
  const t = useTranslations("onboarding.step5");
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
    <div className="flex flex-col gap-6">
      <div className="onb-grid-2">
        {OPTIONS.map((value) => {
          const on = selected === value;
          return (
            <button
              aria-pressed={on}
              className={`onb-pick${on ? " on" : ""}`}
              key={value}
              onClick={() => setSelected(value)}
              type="button"
            >
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <div className="onb-pick-title">{t(value)}</div>
                <div className="onb-pick-sub">{t(`${value}Hint`)}</div>
              </div>
              {on && <Check className="size-4 text-primary" />}
            </button>
          );
        })}
      </div>

      <OnbNav
        canContinue={!!selected}
        isPending={isPending}
        onBack={onBack}
        onContinue={handleContinue}
        onSkip={onSkip}
      />
    </div>
  );
}
