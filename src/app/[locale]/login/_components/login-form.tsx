"use client";

import {
  useActionState,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { useTranslations } from "next-intl";
import { ArrowRight, Check, Eye, EyeOff } from "lucide-react";
import { loginAction } from "../actions";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const FAILS_BEFORE_COOLDOWN = 3;
const COOLDOWN_MS = 10_000;

/**
 * Right column — discreet login form.
 * Uses `useActionState` so the form submits through the server action
 * endpoint even before client hydration; on success the action issues
 * a server-side redirect to `/dashboard`.
 */
export function LoginForm() {
  const t = useTranslations("auth");
  const tc = useTranslations("common");
  const [state, formAction, isPending] = useActionState(loginAction, null);

  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [capsLockOn, setCapsLockOn] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [cooldownUntil, setCooldownUntil] = useState<number | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const prevStateRef = useRef(state);

  const error = state?.error ?? null;
  const toggleLabel = showPassword ? t("hidePassword") : t("showPassword");
  const emailValid = EMAIL_RE.test(email.trim());
  const inCooldown = secondsLeft > 0;

  useEffect(() => {
    if (state && state !== prevStateRef.current && state.error) {
      setFailedAttempts((n) => {
        const next = n + 1;
        if (next >= FAILS_BEFORE_COOLDOWN) {
          setCooldownUntil(Date.now() + COOLDOWN_MS);
          setSecondsLeft(Math.ceil(COOLDOWN_MS / 1000));
        }
        return next;
      });
    }
    prevStateRef.current = state;
  }, [state]);

  useEffect(() => {
    if (cooldownUntil === null) return;
    const tick = () => {
      const remainingMs = cooldownUntil - Date.now();
      if (remainingMs <= 0) {
        setCooldownUntil(null);
        setSecondsLeft(0);
        setFailedAttempts(0);
        return;
      }
      setSecondsLeft(Math.ceil(remainingMs / 1000));
    };
    tick();
    const id = window.setInterval(tick, 250);
    return () => window.clearInterval(id);
  }, [cooldownUntil]);

  function handlePasswordKey(event: ReactKeyboardEvent<HTMLInputElement>) {
    setCapsLockOn(event.getModifierState("CapsLock"));
  }

  const submitLabel = inCooldown
    ? t("tryAgainIn", { seconds: secondsLeft })
    : isPending
      ? tc("loading")
      : t("login");

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

        <form action={formAction} className="mt-8 flex flex-col gap-3.5">
          {error && <div className="auth-ed-error">{error}</div>}

          <div className="relative">
            <input
              autoComplete="email"
              autoFocus
              className="auth-ed-input pr-10"
              id="email"
              name="email"
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("email")}
              required
              type="email"
              value={email}
            />
            {emailValid && (
              <span
                aria-label={t("emailValid")}
                className="pointer-events-none absolute right-3 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center rounded-full bg-primary/10 text-primary"
                title={t("emailValid")}
              >
                <Check className="size-[14px]" />
              </span>
            )}
          </div>

          <div>
            <div className="relative">
              <input
                autoComplete="current-password"
                className="auth-ed-input pr-12"
                id="password"
                name="password"
                onKeyDown={handlePasswordKey}
                onKeyUp={handlePasswordKey}
                placeholder={t("password")}
                required
                type={showPassword ? "text" : "password"}
              />
              <button
                aria-label={toggleLabel}
                aria-pressed={showPassword}
                className="absolute right-3 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-on-surface-variant transition-opacity hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                onClick={() => setShowPassword((v) => !v)}
                tabIndex={-1}
                title={toggleLabel}
                type="button"
              >
                {showPassword ? (
                  <EyeOff className="size-[18px]" />
                ) : (
                  <Eye className="size-[18px]" />
                )}
              </button>
            </div>
            {capsLockOn && (
              <div
                aria-live="polite"
                className="mt-1.5 flex items-center gap-1.5 pl-1 text-[11.5px] text-warning"
              >
                <span aria-hidden>⇪</span>
                <span>{t("capsLockOn")}</span>
              </div>
            )}
          </div>

          <label className="mt-0.5 flex cursor-pointer items-center gap-2 text-[12.5px] text-on-surface-variant select-none">
            <input
              className="size-4 cursor-pointer rounded-[4px] accent-primary"
              defaultChecked
              name="remember"
              type="checkbox"
              value="1"
            />
            <span>{t("rememberMe")}</span>
          </label>

          <button
            className="auth-ed-cta"
            disabled={isPending || inCooldown}
            type="submit"
          >
            {submitLabel}
            {!isPending && !inCooldown && <ArrowRight className="size-[15px]" />}
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
