"use client";

import { useEffect, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { ArrowRight, Mail } from "lucide-react";
import { requestPasswordResetAction } from "../actions";
import { maskEmail } from "../_lib/mask-email";
import { ForgotBulletin } from "./forgot-bulletin";

const RESEND_COOLDOWN_SECONDS = 45;

const SAFE_ERRORS: Record<string, string> = {
  EMAIL_REQUIRED: "errorEmailRequired",
  EMAIL_INVALID: "errorEmailInvalid",
};

/**
 * Right column — two states: `enter` (email input) and `sent` (confirmation).
 * Owns the stage state because the left bulletin needs to mirror it.
 */
export function ForgotPasswordView() {
  const t = useTranslations("forgotPassword");
  const [stage, setStage] = useState<"enter" | "sent">("enter");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setInterval(
      () => setCooldown((current) => Math.max(0, current - 1)),
      1000,
    );
    return () => clearInterval(id);
  }, [cooldown]);

  function handleSubmit(formData: FormData) {
    setError(null);
    const submittedEmail = String(formData.get("email") ?? "").trim();

    startTransition(async () => {
      const result = await requestPasswordResetAction(formData);
      if (result.success) {
        setEmail(submittedEmail);
        setStage("sent");
        setCooldown(RESEND_COOLDOWN_SECONDS);
      } else {
        const key = SAFE_ERRORS[result.error ?? ""] ?? "errorGeneric";
        setError(t(key));
      }
    });
  }

  function handleResend() {
    setCooldown(RESEND_COOLDOWN_SECONDS);
    const fd = new FormData();
    fd.set("email", email);
    startTransition(async () => {
      await requestPasswordResetAction(fd);
    });
  }

  return (
    <div className="auth-editorial">
      <ForgotBulletin stage={stage} email={email} />

      <div className="auth-ed-right">
        <div className="auth-ed-form" key={stage}>
          {stage === "enter" ? (
            <EnterStage
              isPending={isPending}
              error={error}
              defaultEmail={email}
              onSubmit={handleSubmit}
            />
          ) : (
            <SentStage
              email={email}
              cooldown={cooldown}
              onResend={handleResend}
              onChangeEmail={() => setStage("enter")}
            />
          )}
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

interface EnterStageProps {
  readonly isPending: boolean;
  readonly error: string | null;
  readonly defaultEmail: string;
  readonly onSubmit: (formData: FormData) => void;
}

function EnterStage({
  isPending,
  error,
  defaultEmail,
  onSubmit,
}: EnterStageProps) {
  const t = useTranslations("forgotPassword");

  return (
    <form action={onSubmit}>
      <div className="auth-ed-eyebrow mb-2.5">{t("formEyebrow")}</div>
      <h2 className="font-display text-[28px] font-extrabold leading-[1.15] tracking-[-0.025em] text-on-surface">
        {t("formTitle")}
      </h2>

      <div className="mt-7 flex flex-col gap-3.5">
        {error && <div className="auth-ed-error">{error}</div>}
        <input
          autoComplete="email"
          autoFocus
          className="auth-ed-input"
          defaultValue={defaultEmail}
          name="email"
          placeholder={t("emailPlaceholder")}
          required
          type="email"
        />
        <button className="auth-ed-cta" disabled={isPending} type="submit">
          {isPending ? t("submitting") : t("submit")}
          {!isPending && <ArrowRight className="size-[15px]" />}
        </button>
      </div>

      <div className="forgot-divider text-center">
        {t("rememberLine")}{" "}
        <Link className="forgot-link" href="/login">
          {t("backToLogin")} →
        </Link>
      </div>
    </form>
  );
}

interface SentStageProps {
  readonly email: string;
  readonly cooldown: number;
  readonly onResend: () => void;
  readonly onChangeEmail: () => void;
}

function SentStage({
  email,
  cooldown,
  onResend,
  onChangeEmail,
}: SentStageProps) {
  const t = useTranslations("forgotPassword");

  return (
    <div className="forgot-sent">
      <div className="forgot-sent-ico">
        <Mail className="size-7" strokeWidth={1.6} />
      </div>
      <div className="auth-ed-eyebrow mb-1.5 text-primary-dim">
        {t("sentEyebrow")}
      </div>
      <h2 className="font-display text-[28px] font-extrabold leading-[1.15] tracking-[-0.025em] text-on-surface">
        {t("sentTitle")}
      </h2>
      <p className="mt-2.5 text-[13.5px] leading-[1.5] text-on-surface-variant">
        {t.rich("sentMessage", {
          email: () => (
            <span className="font-mono font-semibold text-on-surface">
              {maskEmail(email)}
            </span>
          ),
        })}
      </p>

      <div className="mt-5">
        <Link className="auth-ed-cta" href="/login">
          {t("backToLogin")}
          <ArrowRight className="size-[15px]" />
        </Link>
      </div>

      <div className="forgot-divider flex items-center justify-between gap-3">
        <span>{t("didntArrive")}</span>
        {cooldown > 0 ? (
          <span className="font-mono text-on-surface-variant/70">
            {t("resendIn", { seconds: cooldown })}
          </span>
        ) : (
          <button
            className="forgot-link"
            onClick={onResend}
            type="button"
          >
            {t("resend")} →
          </button>
        )}
      </div>

      <div className="mt-3 text-xs text-on-surface-variant/70">
        {t("wrongEmail")}{" "}
        <button
          className="forgot-link underline"
          onClick={onChangeEmail}
          type="button"
        >
          {t("changeEmail")}
        </button>
      </div>
    </div>
  );
}
