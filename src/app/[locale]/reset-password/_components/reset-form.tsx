"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { ArrowRight, AlertTriangle, Check, Eye, EyeOff } from "lucide-react";
import { scorePasswordStrength } from "@/lib/auth/password-strength";
import {
  resetPasswordAction,
  type ResetPasswordErrorCode,
} from "../actions";
import { ResetBulletin, type ResetStage } from "./reset-bulletin";

const REDIRECT_DELAY_SECONDS = 5;

const ERROR_KEY: Record<ResetPasswordErrorCode, string> = {
  PASSWORD_WEAK: "errorPasswordWeak",
  PASSWORD_MISMATCH: "errorPasswordMismatch",
  TOKEN_INVALID: "errorTokenExpired",
  TOKEN_EXPIRED: "errorTokenExpired",
  PASSWORD_RESET_FAILED: "errorGeneric",
};

interface ResetPasswordViewProps {
  readonly token: string;
  readonly tokenValid: boolean;
}

/** Right column — owns the stage state machine + submit. */
export function ResetPasswordView({
  token,
  tokenValid,
}: ResetPasswordViewProps) {
  const initialStage: ResetStage = tokenValid ? "form" : "invalid";
  const [stage, setStage] = useState<ResetStage>(initialStage);

  return (
    <div className="auth-editorial">
      <ResetBulletin stage={stage} />

      <div className="auth-ed-right">
        <div className="auth-ed-form" key={stage}>
          {stage === "form" && (
            <FormStage token={token} onSuccess={() => setStage("success")} />
          )}
          {stage === "success" && <SuccessStage />}
          {stage === "invalid" && <InvalidStage />}
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

interface FormStageProps {
  readonly token: string;
  readonly onSuccess: () => void;
}

function FormStage({ token, onSuccess }: FormStageProps) {
  const t = useTranslations("resetPassword");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [state, formAction, isPending] = useActionState(
    resetPasswordAction,
    null,
  );

  const strength = useMemo(() => scorePasswordStrength(password), [password]);

  useEffect(() => {
    if (state?.success) onSuccess();
  }, [state, onSuccess]);

  const error =
    state && !state.success && state.error
      ? t(ERROR_KEY[state.error] ?? "errorGeneric")
      : null;

  return (
    <form action={formAction}>
      <input name="token" type="hidden" value={token} />

      <div className="auth-ed-eyebrow mb-2.5">{t("formEyebrow")}</div>
      <h2 className="font-display text-[28px] font-extrabold leading-[1.15] tracking-[-0.025em] text-on-surface">
        {t("formTitle")}
      </h2>

      <div className="mt-7 flex flex-col gap-3.5">
        {error && <div className="auth-ed-error">{error}</div>}

        <div className="reset-pwd-wrap">
          <input
            autoComplete="new-password"
            autoFocus
            className="auth-ed-input pr-12"
            name="password"
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t("passwordPlaceholder")}
            required
            type={showPassword ? "text" : "password"}
            value={password}
          />
          <button
            aria-label={showPassword ? t("hidePassword") : t("showPassword")}
            className="reset-pwd-toggle"
            onClick={() => setShowPassword((prev) => !prev)}
            type="button"
          >
            {showPassword ? (
              <EyeOff className="size-[18px]" />
            ) : (
              <Eye className="size-[18px]" />
            )}
          </button>
        </div>

        {password.length > 0 && <StrengthBar strength={strength} />}

        <input
          autoComplete="new-password"
          className="auth-ed-input"
          name="confirm"
          onChange={(e) => setConfirm(e.target.value)}
          placeholder={t("confirmLabel")}
          required
          type={showPassword ? "text" : "password"}
          value={confirm}
        />

        <button className="auth-ed-cta" disabled={isPending} type="submit">
          {isPending ? t("submitting") : t("submit")}
          {!isPending && <ArrowRight className="size-[15px]" />}
        </button>
      </div>
    </form>
  );
}

interface StrengthBarProps {
  readonly strength: "weak" | "medium" | "strong";
}

function StrengthBar({ strength }: StrengthBarProps) {
  const t = useTranslations("resetPassword");
  const label =
    strength === "strong"
      ? t("strengthStrong")
      : strength === "medium"
        ? t("strengthMedium")
        : t("strengthWeak");

  return (
    <div className="reset-strength">
      <div className="reset-strength-track">
        <div className={`reset-strength-fill ${strength}`} />
      </div>
      <div className="reset-strength-label">{label}</div>
    </div>
  );
}

function SuccessStage() {
  const t = useTranslations("resetPassword");
  const [seconds, setSeconds] = useState(REDIRECT_DELAY_SECONDS);

  useEffect(() => {
    if (seconds <= 0) {
      window.location.href = "/login";
      return;
    }
    const id = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [seconds]);

  return (
    <div className="forgot-sent">
      <div className="reset-success-ico">
        <Check className="size-7" strokeWidth={2.2} />
      </div>
      <div className="auth-ed-eyebrow mb-1.5 text-[oklch(0.48_0.12_155)]">
        {t("successEyebrow")}
      </div>
      <h2 className="font-display text-[28px] font-extrabold leading-[1.15] tracking-[-0.025em] text-on-surface">
        {t("successTitle")}
      </h2>
      <p className="mt-2.5 text-[13.5px] leading-[1.5] text-on-surface-variant">
        {t("successMessage", { seconds })}
      </p>

      <div className="mt-5">
        <Link className="auth-ed-cta" href="/login">
          {t("successCta")}
          <ArrowRight className="size-[15px]" />
        </Link>
      </div>
    </div>
  );
}

function InvalidStage() {
  const t = useTranslations("resetPassword");

  return (
    <div className="forgot-sent">
      <div className="reset-invalid-ico">
        <AlertTriangle className="size-7" strokeWidth={2.2} />
      </div>
      <div className="auth-ed-eyebrow mb-1.5 text-danger">
        {t("invalidEyebrow")}
      </div>
      <h2 className="font-display text-[28px] font-extrabold leading-[1.15] tracking-[-0.025em] text-on-surface">
        {t("invalidTitle")}
      </h2>
      <p className="mt-2.5 text-[13.5px] leading-[1.5] text-on-surface-variant">
        {t("invalidMessage")}
      </p>

      <div className="mt-5">
        <Link className="auth-ed-cta" href="/forgot-password">
          {t("invalidCta")}
          <ArrowRight className="size-[15px]" />
        </Link>
      </div>
    </div>
  );
}
