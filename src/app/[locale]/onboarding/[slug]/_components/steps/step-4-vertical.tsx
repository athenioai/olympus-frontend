"use client";

import { useEffect, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Check } from "lucide-react";
import { toast } from "sonner";
import type { BusinessVertical } from "@/lib/services";
import { listVerticalsAction, setVerticalAction } from "../../actions";
import { resolveVerticalIcon } from "../../_lib/vertical-icons";
import type { StepProps } from "../wizard";
import { OnbNav } from "../onb-nav";

export function Step4Vertical({
  state,
  onAdvance,
  onBack,
  onSkip,
}: StepProps) {
  const t = useTranslations("onboarding.step4");
  const tNav = useTranslations("onboarding");

  const [verticals, setVerticals] = useState<readonly BusinessVertical[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(
    state.profileView?.profile?.businessVertical ?? null,
  );
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    let cancelled = false;
    listVerticalsAction().then((result) => {
      if (cancelled) return;
      if (result.success && result.verticals) {
        setVerticals(result.verticals);
      } else {
        toast.error(tNav("genericError"));
      }
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [tNav]);

  function handleConfirm() {
    if (!selected) return;
    const isFirstSelection = !state.profileView?.profile?.businessVertical;
    startTransition(async () => {
      const result = await setVerticalAction(selected);
      if (!result.success || !result.profileView || !result.vertical) {
        toast.error(tNav("genericError"));
        return;
      }
      if (isFirstSelection) {
        const { tagsCount, customFieldsCount, faqsCount } = result.vertical;
        toast.success(
          t("seeded", {
            tags: tagsCount,
            fields: customFieldsCount,
            faqs: faqsCount,
          }),
        );
      } else {
        toast.success(t("updated"));
      }
      onAdvance({ profileView: result.profileView }, 5);
    });
  }

  return (
    <div className="flex flex-col gap-6">
      {loading ? (
        <div className="onb-grid-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div className="skeleton h-16 w-full" key={i} />
          ))}
        </div>
      ) : (
        <div className="onb-grid-2">
          {verticals.map((vertical) => {
            const Icon = resolveVerticalIcon(vertical.id);
            const on = selected === vertical.id;
            return (
              <button
                aria-pressed={on}
                className={`onb-pick${on ? " on" : ""}`}
                key={vertical.id}
                onClick={() => setSelected(vertical.id)}
                type="button"
              >
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-surface-container-high text-on-surface-variant">
                  <Icon className="size-4" />
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <div className="onb-pick-title">{vertical.label}</div>
                  <div className="onb-pick-sub">
                    {t("counters", {
                      tags: vertical.tagsCount,
                      fields: vertical.customFieldsCount,
                      faqs: vertical.faqsCount,
                    })}
                  </div>
                </div>
                {on && <Check className="size-4 text-primary" />}
              </button>
            );
          })}
        </div>
      )}

      <OnbNav
        canContinue={!!selected}
        isPending={isPending}
        onBack={onBack}
        onContinue={handleConfirm}
        onSkip={onSkip}
      />
    </div>
  );
}
