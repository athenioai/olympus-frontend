"use client";

import { useTranslations } from "next-intl";
import { ChevronLeft, ArrowRight } from "lucide-react";

interface OnbNavProps {
  readonly onBack: () => void;
  readonly canBack?: boolean;
  /** When provided, renders a skip link (only valid for non-essential steps). */
  readonly onSkip?: () => void;
  readonly canContinue: boolean;
  readonly isPending: boolean;
  /** When set, renders a button[type=submit] (form context). When null, renders click handler. */
  readonly onContinue?: () => void;
  readonly isFinalStep?: boolean;
}

/**
 * Bottom nav for every onboarding step (except the ready celebration).
 * Centralizes Voltar / Pular / Continuar to keep visual + i18n consistent.
 */
export function OnbNav({
  onBack,
  canBack = true,
  onSkip,
  canContinue,
  isPending,
  onContinue,
  isFinalStep = false,
}: OnbNavProps) {
  const t = useTranslations("onboarding");
  const tc = useTranslations("common");

  const continueLabel = isPending
    ? tc("loading")
    : isFinalStep
      ? t("finish")
      : t("next");

  return (
    <div className="onb-nav">
      <div className="onb-nav-left">
        {canBack ? (
          <button className="onb-btn ghost" onClick={onBack} type="button">
            <ChevronLeft className="size-3.5" />
            {t("back")}
          </button>
        ) : (
          <span />
        )}
      </div>

      <div className="onb-nav-right">
        {onSkip && (
          <button
            className="onb-btn link"
            onClick={onSkip}
            title={t("skipWithWarn")}
            type="button"
          >
            {canContinue ? t("skipWithWarn") : t("skipWithRisk")}
          </button>
        )}
        <button
          className="onb-btn primary"
          disabled={!canContinue || isPending}
          onClick={onContinue}
          type={onContinue ? "button" : "submit"}
        >
          {continueLabel}
          <ArrowRight className="size-3.5" />
        </button>
      </div>
    </div>
  );
}
