"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { ArrowRight } from "lucide-react";
import { loginAction } from "../actions";

/**
 * Right column — discreet login form.
 * Wraps the existing `loginAction` server action; on success, hard-redirects
 * to /dashboard so the auth cookies set during the action are picked up.
 */
export function LoginForm() {
  const t = useTranslations("auth");
  const tc = useTranslations("common");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await loginAction(formData);
      if (result.success) {
        window.location.href = "/dashboard";
      } else {
        setError(result.error ?? null);
      }
    });
  }

  return (
    <div className="auth-ed-right">
      <div className="auth-ed-form">
        <div className="auth-ed-eyebrow mb-2.5">{t("session")}</div>
        <h2 className="font-display text-[40px] font-extrabold leading-[1.05] tracking-[-0.03em] text-on-surface">
          {t("welcomeBack")}
        </h2>
        <div className="mt-2.5 flex items-center gap-2 text-[12.5px] text-on-surface-variant">
          <span className="font-mono text-[10.5px] uppercase tracking-[0.1em] text-on-surface-variant/70">
            {t("lastSession")}
          </span>
          <span className="size-[3px] rounded-full bg-on-surface-variant/50" />
          <span>{t("lastSessionAgo")}</span>
        </div>

        <form action={handleSubmit} className="mt-8 flex flex-col gap-3.5">
          {error && <div className="auth-ed-error">{error}</div>}

          <input
            autoComplete="email"
            className="auth-ed-input"
            id="email"
            name="email"
            placeholder={t("email")}
            required
            type="email"
          />
          <input
            autoComplete="current-password"
            className="auth-ed-input"
            id="password"
            name="password"
            placeholder={t("password")}
            required
            type="password"
          />
          <button
            className="auth-ed-cta"
            disabled={isPending}
            type="submit"
          >
            {isPending ? tc("loading") : t("login")}
            {!isPending && <ArrowRight className="size-[15px]" />}
          </button>

          <div className="flex items-center justify-between text-[12.5px] text-on-surface-variant">
            <a
              className="text-on-surface-variant no-underline transition-opacity hover:opacity-70"
              href="/forgot-password"
            >
              {t("forgotPassword")}
            </a>
            <a
              className="font-semibold text-on-surface no-underline transition-opacity hover:opacity-70"
              href="/signup"
            >
              {t("signupCta")} →
            </a>
          </div>
        </form>

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
