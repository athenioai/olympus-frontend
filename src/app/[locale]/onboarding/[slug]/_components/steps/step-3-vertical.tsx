"use client";

import { useEffect, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import type { BusinessVertical } from "@/lib/services";
import { listVerticalsAction, setVerticalAction } from "../../actions";
import { resolveVerticalIcon } from "../../_lib/vertical-icons";
import type { StepProps } from "../wizard";

export function Step3Vertical({ state, onAdvance, onBack }: StepProps) {
  const t = useTranslations("onboarding.step3");
  const tc = useTranslations("common");
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
    startTransition(async () => {
      const result = await setVerticalAction(selected);
      if (!result.success || !result.profileView || !result.vertical) {
        toast.error(tNav("genericError"));
        return;
      }
      const { tagsCount, customFieldsCount, faqsCount } = result.vertical;
      toast.success(
        t("seeded", {
          tags: tagsCount,
          fields: customFieldsCount,
          faqs: faqsCount,
        }),
      );
      onAdvance({ profileView: result.profileView }, 4);
    });
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="font-display text-2xl font-bold text-on-surface">
          {t("title")}
        </h2>
        <p className="text-sm text-on-surface-variant">{t("subtitle")}</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              className="h-32 animate-pulse rounded-xl bg-surface-container-high"
              key={i}
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {verticals.map((vertical) => {
            const Icon = resolveVerticalIcon(vertical.id);
            const isSelected = selected === vertical.id;
            return (
              <button
                aria-pressed={isSelected}
                className={`flex flex-col items-center gap-2 rounded-xl border p-4 text-center transition-all duration-200 ${
                  isSelected
                    ? "border-primary bg-primary/5 shadow-ambient"
                    : "border-transparent bg-surface-container-high hover:border-primary/40"
                }`}
                key={vertical.id}
                onClick={() => setSelected(vertical.id)}
                type="button"
              >
                <Icon
                  className={`h-7 w-7 ${
                    isSelected ? "text-primary" : "text-on-surface-variant"
                  }`}
                />
                <p className="font-display text-xs font-bold text-on-surface">
                  {vertical.label}
                </p>
                <p className="text-[10px] font-medium text-on-surface-variant">
                  {t("counters", {
                    tags: vertical.tagsCount,
                    fields: vertical.customFieldsCount,
                    faqs: vertical.faqsCount,
                  })}
                </p>
              </button>
            );
          })}
        </div>
      )}

      <div className="flex items-center justify-between pt-2">
        <button
          className="text-sm font-medium text-on-surface-variant hover:text-on-surface disabled:opacity-40"
          onClick={onBack}
          type="button"
        >
          {tNav("back")}
        </button>
        <button
          className="flex h-12 items-center gap-2 rounded-xl bg-gradient-to-br from-primary to-primary-dim px-6 font-display font-bold text-on-primary shadow-lg shadow-primary/10 transition-all duration-200 hover:opacity-95 active:scale-[0.98] disabled:opacity-60"
          disabled={!selected || isPending}
          onClick={handleConfirm}
          type="button"
        >
          {isPending ? tc("loading") : t("confirm")}
        </button>
      </div>
    </div>
  );
}
