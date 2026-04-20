"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { ConciergeBell, Shuffle, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import type { WorkType } from "@/lib/services";
import { setWorkTypeAction } from "../../actions";
import type { StepProps } from "../wizard";
import { OnbNav } from "../onb-nav";

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
      onAdvance({ workType: result.workType }, 3); // → business (essential)
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="onb-cards">
        {OPTIONS.map(({ value, icon: Icon }) => {
          const on = selected === value;
          return (
            <button
              aria-pressed={on}
              className={`onb-card${on ? " on" : ""}`}
              key={value}
              onClick={() => setSelected(value)}
              type="button"
            >
              <div className="onb-card-ico">
                <Icon className="size-[18px]" />
              </div>
              <div className="onb-card-title">{t(`${value}Title`)}</div>
              <div className="onb-card-sub">{t(`${value}Hint`)}</div>
            </button>
          );
        })}
      </div>

      <OnbNav
        canContinue={!!selected}
        isPending={isPending}
        onBack={onBack}
        onContinue={handleContinue}
      />
    </div>
  );
}
