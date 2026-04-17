"use client";

import { useTranslations } from "next-intl";

interface ProgressBarProps {
  readonly percent: number;
}

export function ProgressBar({ percent }: ProgressBarProps) {
  const t = useTranslations("onboarding");
  const safePercent = Math.max(0, Math.min(100, Math.round(percent)));

  return (
    <div className="space-y-1">
      <p className="text-xs font-medium tracking-tight text-on-surface-variant">
        {t("scoreLabel", { percent: safePercent })}
      </p>
      <div className="h-2 overflow-hidden rounded-full bg-surface-container-high">
        <div
          aria-valuemax={100}
          aria-valuemin={0}
          aria-valuenow={safePercent}
          className="h-full bg-gradient-to-r from-primary to-primary-dim transition-[width] duration-500"
          role="progressbar"
          style={{ width: `${safePercent}%` }}
        />
      </div>
    </div>
  );
}
