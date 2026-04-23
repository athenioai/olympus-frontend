"use client";

import { useMemo, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import {
  meetsBackendPolicy,
  scorePasswordStrength,
  type PasswordStrength,
} from "@/lib/auth/password-strength";
import { setPasswordStepAction } from "../../actions";
import type { StepProps } from "../wizard";
import { OnbNav } from "../onb-nav";

export function Step1Password({ slug, onAdvance, onBack }: StepProps) {
  const t = useTranslations("onboarding.step1");
  const tErr = useTranslations("onboarding");

  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [clientError, setClientError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const strength = useMemo(() => scorePasswordStrength(password), [password]);
  const passwordMismatch = confirm.length > 0 && password !== confirm;
  const canContinue =
    name.trim().length >= 2 &&
    meetsBackendPolicy(password) &&
    password === confirm;

  function validate(): string | null {
    if (name.trim().length < 2 || name.trim().length > 120) {
      return t("errorNameShort");
    }
    if (!meetsBackendPolicy(password)) {
      return t("errorPasswordWeak");
    }
    if (password !== confirm) {
      return t("errorPasswordMismatch");
    }
    return null;
  }

  function handleSubmit(formData: FormData) {
    const err = validate();
    if (err) {
      setClientError(err);
      return;
    }
    setClientError(null);

    startTransition(async () => {
      const result = await setPasswordStepAction(slug, formData);
      if (!result.success || !result.user) {
        setClientError(mapServerError(result.error));
        return;
      }

      toast.success(t("title"));
      onAdvance(
        {
          profileView: result.profileView,
          workType: result.profileView?.profile?.workType ?? undefined,
        },
        2,
      );
    });
  }

  function mapServerError(code?: string): string {
    if (code === "PASSWORD_WEAK") return t("errorPasswordWeak");
    if (code === "SLUG_FORBIDDEN") return t("errorSlugForbidden");
    return tErr("genericError");
  }

  return (
    <form action={handleSubmit} className="flex flex-col gap-5">
      {clientError && (
        <div className="rounded-lg bg-danger-muted px-4 py-3 text-sm text-danger">
          {clientError}
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <label className="onb-field-label" htmlFor="name">
          {t("nameLabel")}
        </label>
        <input
          autoComplete="name"
          autoFocus
          className="onb-input"
          id="name"
          name="name"
          onChange={(e) => setName(e.target.value)}
          placeholder={t("namePlaceholder")}
          required
          type="text"
          value={name}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="onb-field-label" htmlFor="password">
          {t("passwordLabel")}
        </label>
        <div className="onb-pwd-wrap">
          <input
            autoComplete="new-password"
            className="onb-input"
            id="password"
            name="password"
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t("passwordPlaceholder")}
            required
            type={showPassword ? "text" : "password"}
            value={password}
          />
          <button
            className="onb-pwd-eye"
            onClick={() => setShowPassword((v) => !v)}
            type="button"
          >
            {showPassword ? (
              <EyeOff className="size-4" />
            ) : (
              <Eye className="size-4" />
            )}
          </button>
        </div>
        {password.length > 0 && <StrengthMeter strength={strength} />}
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="onb-field-label" htmlFor="confirm">
          {t("confirmPasswordLabel")}
        </label>
        <input
          aria-invalid={passwordMismatch ? true : undefined}
          autoComplete="new-password"
          className="onb-input"
          id="confirm"
          onChange={(e) => setConfirm(e.target.value)}
          required
          type={showPassword ? "text" : "password"}
          value={confirm}
        />
        {passwordMismatch && (
          <p className="text-xs text-danger">
            {t("errorPasswordMismatch")}
          </p>
        )}
      </div>

      <OnbNav
        canBack={false}
        canContinue={canContinue}
        isPending={isPending}
        onBack={onBack}
      />
    </form>
  );
}

function StrengthMeter({ strength }: { readonly strength: PasswordStrength }) {
  const t = useTranslations("onboarding.step1");

  const colorByStrength: Record<PasswordStrength, string> = {
    weak: "oklch(0.62 0.18 25)",
    medium: "oklch(0.72 0.16 80)",
    strong: "oklch(0.58 0.12 155)",
  };
  const filledByStrength: Record<PasswordStrength, number> = {
    weak: 1,
    medium: 2,
    strong: 4,
  };
  const labelByStrength: Record<PasswordStrength, string> = {
    weak: t("strengthWeak"),
    medium: t("strengthMedium"),
    strong: t("strengthStrong"),
  };

  const filled = filledByStrength[strength];
  const color = colorByStrength[strength];

  return (
    <div className="onb-pwd-meter">
      {[0, 1, 2, 3].map((i) => (
        <span
          className="onb-pwd-seg"
          key={i}
          style={{
            background: i < filled ? color : "var(--color-surface-container-high)",
          }}
        />
      ))}
      <span className="onb-pwd-label" style={{ color }}>
        {labelByStrength[strength]}
      </span>
    </div>
  );
}
