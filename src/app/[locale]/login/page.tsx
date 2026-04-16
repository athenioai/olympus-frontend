"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Eye, EyeOff, ArrowRight, Hexagon } from "lucide-react";
import { loginAction } from "./actions";

export default function LoginPage() {
  const t = useTranslations("auth");
  const tc = useTranslations("common");
  const [isPending, startTransition] = useTransition();
  const [showPassword, setShowPassword] = useState(false);
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
    <div className="flex min-h-screen items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_50%_50%,#faf9f7_0%,#f4f4f1_100%)]">
      {/* Warm ambient glow */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2"
        style={{
          background:
            "radial-gradient(circle, rgba(255,165,53,0.08) 0%, rgba(250,249,247,0) 70%)",
        }}
      />

      {/* Decorative corner text */}
      <div className="pointer-events-none fixed left-0 top-0 hidden w-full items-start justify-between p-12 opacity-20 lg:flex">
        <div
          className="font-display text-[10px] font-bold uppercase tracking-[0.4em] text-on-surface"
          style={{ writingMode: "vertical-rl" }}
        >
          EST. MMXXIV
        </div>
        <div className="font-display text-[10px] font-bold uppercase tracking-[0.4em] text-on-surface">
          Secure Terminal Access 01
        </div>
      </div>

      <main className="relative z-10 w-full max-w-[480px] px-6">
        {/* Logo */}
        <div className="mb-12 flex flex-col items-center">
          <div className="mb-4">
            <Hexagon
              className="h-12 w-12 fill-primary/20 text-primary"
              strokeWidth={1.5}
            />
          </div>
          <h1 className="font-display text-3xl font-extrabold tracking-tighter text-on-surface">
            Olympus
          </h1>
          <p className="mt-1 text-sm font-medium tracking-tight text-on-surface-variant">
            {t("welcomeSubtitle")}
          </p>
        </div>

        {/* Login card */}
        <div className="glass rounded-xl border border-white/40 p-10 shadow-ambient">
          <form action={handleSubmit} className="space-y-6">
            {/* Error message */}
            {error && (
              <div className="rounded-lg bg-danger-muted px-4 py-3 text-sm text-danger">
                {error}
              </div>
            )}

            {/* Email */}
            <div className="space-y-2">
              <label
                className="block font-display text-sm font-semibold text-on-surface"
                htmlFor="email"
              >
                {t("email")}
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

            {/* Password */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label
                  className="block font-display text-sm font-semibold text-on-surface"
                  htmlFor="password"
                >
                  {t("password")}
                </label>
                <a
                  className="text-xs font-semibold text-primary transition-opacity hover:opacity-70"
                  href="/forgot-password"
                >
                  {t("forgotPassword")}
                </a>
              </div>
              <div className="relative">
                <input
                  autoComplete="current-password"
                  className="h-12 w-full rounded-xl border-none bg-surface-container-high px-4 pr-12 text-on-surface outline-none transition-all duration-200 placeholder:text-on-surface-variant/60 focus:bg-surface-container-lowest focus:ring-1 focus:ring-primary/30"
                  id="password"
                  name="password"
                  placeholder="••••••••"
                  required
                  type={showPassword ? "text" : "password"}
                />
                <button
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface"
                  onClick={() => setShowPassword(!showPassword)}
                  type="button"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit */}
            <div className="pt-2">
              <button
                className="flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-primary to-primary-dim font-display font-bold text-on-primary shadow-lg shadow-primary/10 transition-all duration-200 hover:opacity-95 active:scale-[0.98] disabled:opacity-60"
                disabled={isPending}
                type="submit"
              >
                {isPending ? tc("loading") : t("login")}
                {!isPending && <ArrowRight className="h-5 w-5" />}
              </button>
            </div>
          </form>
        </div>

        {/* Footer */}
        <footer className="mt-8 space-y-4 text-center">
          <p className="text-sm text-on-surface-variant">
            {t("needHelp")}{" "}
            <a
              className="font-bold text-primary hover:underline"
              href="https://wa.me/5511999999999"
              rel="noopener noreferrer"
              target="_blank"
            >
              Falar com a equipe
            </a>
          </p>
        </footer>
      </main>
    </div>
  );
}
