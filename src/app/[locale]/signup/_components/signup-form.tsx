"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { signupAction, type SignupErrorCode } from "../actions";
import { SignupBulletin } from "./signup-bulletin";

const ERROR_KEY: Record<SignupErrorCode, string> = {
  EMAIL_REQUIRED: "emailRequired",
  EMAIL_INVALID: "emailInvalid",
  EMAIL_EXISTS: "emailExists",
  GENERIC: "generic",
};

/** Right column — single-field email signup. */
export function SignupView() {
  const t = useTranslations("signup");
  const ta = useTranslations("auth");
  const tc = useTranslations("common");
  const [state, formAction, isPending] = useActionState(signupAction, null);
  const errorMessage = state?.error
    ? t(`errors.${ERROR_KEY[state.error]}`)
    : null;

  return (
    <div className="auth-editorial">
      <SignupBulletin />

      <div className="auth-ed-right">
        <div className="auth-ed-form">
          <div className="auth-ed-eyebrow mb-2.5">{t("formEyebrow")}</div>
          <h2 className="font-display text-[32px] font-extrabold leading-[1.1] tracking-[-0.025em] text-on-surface">
            {t("formTitle")}
          </h2>

          <form action={formAction} className="mt-7 flex flex-col gap-3.5">
            {errorMessage && (
              <div className="auth-ed-error">{errorMessage}</div>
            )}

            <input
              autoComplete="email"
              className="auth-ed-input"
              name="email"
              placeholder={t("emailPlaceholder")}
              required
              type="email"
            />
            <button
              className="auth-ed-cta"
              disabled={isPending}
              type="submit"
            >
              {isPending ? tc("loading") : t("formCta")}
              {!isPending && <ArrowRight className="size-[15px]" />}
            </button>
          </form>

          <div className="mt-6 flex items-center gap-2.5 font-mono text-[9.5px] uppercase tracking-[0.14em] text-on-surface-variant/70">
            <span>{t("complianceNoCard")}</span>
            <span className="auth-ed-rule bg-surface-container-high" />
            <span>{t("complianceCancelAnytime")}</span>
            <span className="auth-ed-rule bg-surface-container-high" />
            <span>{t("complianceLgpd")}</span>
          </div>

          <div className="mt-5 border-t border-dotted border-surface-container-high pt-4 text-center text-[12.5px] text-on-surface-variant">
            {t("hasAccount")}{" "}
            <Link
              className="font-semibold text-on-surface no-underline transition-opacity hover:opacity-70"
              href="/login"
            >
              {ta("login")} →
            </Link>
          </div>
        </div>

        <div className="auth-ed-formfoot">
          <span>LGPD</span>
          <span className="auth-ed-rule" />
          <span>SSL</span>
          <span className="auth-ed-rule" />
          <span>SOC 2</span>
        </div>
      </div>
    </div>
  );
}
