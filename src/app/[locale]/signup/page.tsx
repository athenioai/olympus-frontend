"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { ArrowRight, Hexagon } from "lucide-react";
import { signupAction, type SignupErrorCode } from "./actions";

export default function SignupPage() {
  const t = useTranslations("signup");
  const ta = useTranslations("auth");
  const tc = useTranslations("common");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<SignupErrorCode | null>(null);

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await signupAction(formData);
      if (result.success) {
        window.location.href = "/signup/success";
        return;
      }
      setError(result.error ?? "GENERIC");
    });
  }

  const errorMessage = error ? t(`errors.${ERROR_KEY[error]}`) : null;

  return (
    <div className="flex min-h-screen items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_50%_50%,#faf9f7_0%,#f4f4f1_100%)]">
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2"
        style={{
          background:
            "radial-gradient(circle, rgba(255,165,53,0.08) 0%, rgba(250,249,247,0) 70%)",
        }}
      />

      <main className="relative z-10 w-full max-w-[480px] px-6">
        <div className="mb-12 flex flex-col items-center">
          <div className="mb-4">
            <Hexagon
              className="h-12 w-12 fill-primary/20 text-primary"
              strokeWidth={1.5}
            />
          </div>
          <h1 className="font-display text-3xl font-extrabold tracking-tighter text-on-surface">
            {t("title")}
          </h1>
          <p className="mt-1 text-sm font-medium tracking-tight text-on-surface-variant">
            {t("subtitle")}
          </p>
        </div>

        <div className="glass rounded-xl border border-white/40 p-10 shadow-ambient">
          <form action={handleSubmit} className="space-y-6">
            {errorMessage && (
              <div className="rounded-lg bg-danger-muted px-4 py-3 text-sm text-danger">
                {errorMessage}
              </div>
            )}

            <div className="space-y-2">
              <label
                className="block font-display text-sm font-semibold text-on-surface"
                htmlFor="email"
              >
                {t("emailLabel")}
              </label>
              <input
                autoComplete="email"
                className="h-12 w-full rounded-xl border-none bg-surface-container-high px-4 text-on-surface outline-none transition-all duration-200 placeholder:text-on-surface-variant/60 focus:bg-surface-container-lowest focus:ring-1 focus:ring-primary/30"
                id="email"
                name="email"
                placeholder={t("emailPlaceholder")}
                required
                type="email"
              />
            </div>

            <div className="pt-2">
              <button
                className="flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-primary to-primary-dim font-display font-bold text-on-primary shadow-lg shadow-primary/10 transition-all duration-200 hover:opacity-95 active:scale-[0.98] disabled:opacity-60"
                disabled={isPending}
                type="submit"
              >
                {isPending ? tc("loading") : t("submit")}
                {!isPending && <ArrowRight className="h-5 w-5" />}
              </button>
            </div>
          </form>
        </div>

        <footer className="mt-8 space-y-4 text-center">
          <p className="text-sm text-on-surface-variant">
            {t("hasAccount")}{" "}
            <a
              className="font-bold text-primary hover:underline"
              href="/login"
            >
              {ta("login")}
            </a>
          </p>
        </footer>
      </main>
    </div>
  );
}

const ERROR_KEY: Record<SignupErrorCode, string> = {
  EMAIL_REQUIRED: "emailRequired",
  EMAIL_INVALID: "emailInvalid",
  EMAIL_EXISTS: "emailExists",
  GENERIC: "generic",
};
