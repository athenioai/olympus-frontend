"use client";

import { useTranslations } from "next-intl";
import { Check, Sparkles } from "lucide-react";
import type { ScoreTier } from "@/lib/services";
import type { StepProps } from "../wizard";

const TIER_COLORS: Record<ScoreTier, string> = {
  none: "text-on-surface-variant",
  bronze: "text-amber-700",
  silver: "text-slate-500",
  gold: "text-amber-500",
  diamond: "text-sky-500",
};

export function Step8Success({ state, onFinish, onBack }: StepProps) {
  const t = useTranslations("onboarding.step8");
  const tNav = useTranslations("onboarding");

  const score = state.profileView?.score;
  const percent = score?.percentage ?? 0;
  const tier: ScoreTier = score?.tier ?? "none";

  const tierLabel = t(TIER_LABEL[tier]);
  const tierColor = TIER_COLORS[tier];

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <Sparkles className="h-8 w-8 text-primary" strokeWidth={1.5} />
        </div>
        <h2 className="font-display text-2xl font-bold text-on-surface">
          {t("title")}
        </h2>
      </div>

      <div className="rounded-xl bg-surface-container-high p-6 text-center">
        <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
          {t("scoreTitle")}
        </p>
        <p className="mt-2 font-display text-4xl font-extrabold text-on-surface">
          {percent}%
        </p>
        <p className={`mt-1 font-display text-sm font-bold ${tierColor}`}>
          {tierLabel}
        </p>
      </div>

      <div className="space-y-2">
        <p className="font-display text-sm font-semibold text-on-surface">
          {t("nextTitle")}
        </p>
        <ul className="space-y-2 text-sm text-on-surface-variant">
          <NextItem label={t("nextAgent")} />
          <NextItem label={t("nextChannel")} />
          <NextItem label={t("nextContacts")} />
        </ul>
      </div>

      <div className="flex items-center justify-between pt-2">
        <button
          className="text-sm font-medium text-on-surface-variant hover:text-on-surface"
          onClick={onBack}
          type="button"
        >
          {tNav("back")}
        </button>
        <button
          className="flex h-12 items-center gap-2 rounded-xl bg-gradient-to-br from-primary to-primary-dim px-6 font-display font-bold text-on-primary shadow-lg shadow-primary/10 transition-all duration-200 hover:opacity-95 active:scale-[0.98]"
          onClick={onFinish}
          type="button"
        >
          {t("enter")}
        </button>
      </div>
    </div>
  );
}

function NextItem({ label }: { readonly label: string }) {
  return (
    <li className="flex items-center gap-2">
      <Check className="h-4 w-4 text-primary" />
      {label}
    </li>
  );
}

const TIER_LABEL: Record<ScoreTier, string> = {
  none: "tierNone",
  bronze: "tierBronze",
  silver: "tierSilver",
  gold: "tierGold",
  diamond: "tierDiamond",
};
