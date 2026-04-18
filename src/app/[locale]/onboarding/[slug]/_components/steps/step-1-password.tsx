"use client";

import { useMemo, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { setPasswordStepAction } from "../../actions";
import {
  meetsBackendPolicy,
  scorePasswordStrength,
} from "../../_lib/password-strength";
import type { StepProps } from "../wizard";

export function Step1Password({ slug, state, onAdvance }: StepProps) {
  const t = useTranslations("onboarding.step1");
  const tc = useTranslations("common");
  const tErr = useTranslations("onboarding");

  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [clientError, setClientError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const strength = useMemo(() => scorePasswordStrength(password), [password]);

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
          workType: result.user.workType,
        },
        2,
      );
    });
  }

  function mapServerError(code?: string): string {
    if (code === "PASSWORD_WEAK") return t("errorPasswordWeak");
    if (code === "INVALID_SLUG" || code === "SLUG_CONSUMED") {
      return tErr("genericError");
    }
    return tErr("genericError");
  }

  return (
    <form action={handleSubmit} className="space-y-6">
      <div className="space-y-1">
        <h2 className="font-display text-2xl font-bold text-on-surface">
          {t("title")}
        </h2>
        <p className="text-sm text-on-surface-variant">
          {t("subtitle", { email: state.email })}
        </p>
      </div>

      {clientError && (
        <div className="rounded-lg bg-danger-muted px-4 py-3 text-sm text-danger">
          {clientError}
        </div>
      )}

      <div className="space-y-2">
        <label
          className="block font-display text-sm font-semibold text-on-surface"
          htmlFor="name"
        >
          {t("nameLabel")}
        </label>
        <input
          autoComplete="name"
          className="h-12 w-full rounded-xl border-none bg-surface-container-high px-4 text-on-surface outline-none focus:bg-surface-container-lowest focus:ring-1 focus:ring-primary/30"
          id="name"
          name="name"
          onChange={(e) => setName(e.target.value)}
          placeholder={t("namePlaceholder")}
          required
          type="text"
          value={name}
        />
      </div>

      <div className="space-y-2">
        <label
          className="block font-display text-sm font-semibold text-on-surface"
          htmlFor="password"
        >
          {t("passwordLabel")}
        </label>
        <div className="relative">
          <input
            autoComplete="new-password"
            className="h-12 w-full rounded-xl border-none bg-surface-container-high px-4 pr-12 text-on-surface outline-none focus:bg-surface-container-lowest focus:ring-1 focus:ring-primary/30"
            id="password"
            name="password"
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t("passwordPlaceholder")}
            required
            type={showPassword ? "text" : "password"}
            value={password}
          />
          <button
            className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface"
            onClick={() => setShowPassword((v) => !v)}
            type="button"
          >
            {showPassword ? (
              <EyeOff className="h-5 w-5" />
            ) : (
              <Eye className="h-5 w-5" />
            )}
          </button>
        </div>
        {password.length > 0 && (
          <PasswordStrengthBar strength={strength} />
        )}
      </div>

      <div className="space-y-2">
        <label
          className="block font-display text-sm font-semibold text-on-surface"
          htmlFor="confirm"
        >
          {t("confirmPasswordLabel")}
        </label>
        <input
          autoComplete="new-password"
          className="h-12 w-full rounded-xl border-none bg-surface-container-high px-4 text-on-surface outline-none focus:bg-surface-container-lowest focus:ring-1 focus:ring-primary/30"
          id="confirm"
          onChange={(e) => setConfirm(e.target.value)}
          required
          type={showPassword ? "text" : "password"}
          value={confirm}
        />
      </div>

      <div className="flex justify-end pt-2">
        <button
          className="flex h-12 items-center gap-2 rounded-xl bg-gradient-to-br from-primary to-primary-dim px-6 font-display font-bold text-on-primary shadow-lg shadow-primary/10 transition-all duration-200 hover:opacity-95 active:scale-[0.98] disabled:opacity-60"
          disabled={isPending}
          type="submit"
        >
          {isPending ? tc("loading") : tErr("next")}
        </button>
      </div>
    </form>
  );
}

function PasswordStrengthBar({
  strength,
}: {
  readonly strength: "weak" | "medium" | "strong";
}) {
  const t = useTranslations("onboarding.step1");
  const color =
    strength === "strong"
      ? "bg-emerald-500"
      : strength === "medium"
        ? "bg-amber-500"
        : "bg-rose-500";
  const width =
    strength === "strong" ? "w-full" : strength === "medium" ? "w-2/3" : "w-1/3";
  const label =
    strength === "strong"
      ? t("strengthStrong")
      : strength === "medium"
        ? t("strengthMedium")
        : t("strengthWeak");

  return (
    <div className="space-y-1">
      <div className="h-1 w-full overflow-hidden rounded-full bg-surface-container-high">
        <div
          className={`h-full ${width} ${color} transition-all duration-300`}
        />
      </div>
      <p className="text-xs text-on-surface-variant">{label}</p>
    </div>
  );
}
