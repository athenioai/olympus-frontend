"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowRight } from "lucide-react";
import type { StepProps } from "../wizard";

export function Step8Success({ state, onFinish }: StepProps) {
  const t = useTranslations("onboarding.ready");
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 400);
    const t2 = setTimeout(() => setPhase(2), 1200);
    const t3 = setTimeout(() => setPhase(3), 2200);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  const businessName =
    state.profileView?.profile?.businessName?.trim() || t("fallbackName");
  const scorePercent = state.profileView?.score?.percentage ?? 0;

  return (
    <div className="onb-ready">
      <div className={`onb-ready-orb${phase >= 1 ? " live" : ""}`}>
        <div className="onb-ready-pulse" />
        <div className="onb-ready-pulse slow" />
        <div className="onb-ready-center">O</div>
      </div>

      <div className="onb-ready-copy">
        <div className={`onb-ready-eyebrow${phase >= 1 ? " show" : ""}`}>
          {t("eyebrow")}
        </div>
        <h1 className={`onb-ready-title${phase >= 2 ? " show" : ""}`}>
          {t("title", { name: businessName })}
        </h1>
        <p className={`onb-ready-sub${phase >= 3 ? " show" : ""}`}>
          {t("sub")}
        </p>
      </div>

      <div className={`onb-ready-score${phase >= 3 ? " show" : ""}`}>
        <span>{t("scoreLabel")}</span>
        <div className="onb-ready-score-bar">
          <div
            className="onb-ready-score-fill"
            style={{ width: phase >= 3 ? `${scorePercent}%` : "0%" }}
          />
        </div>
        <span>{scorePercent}%</span>
      </div>

      <div className={`onb-ready-actions${phase >= 3 ? " show" : ""}`}>
        <button className="onb-btn primary lg" onClick={onFinish} type="button">
          {t("ctaPrimary")}
          <ArrowRight className="size-3.5" />
        </button>
        <button className="onb-btn ghost" onClick={onFinish} type="button">
          {t("ctaSecondary")}
        </button>
      </div>
    </div>
  );
}
