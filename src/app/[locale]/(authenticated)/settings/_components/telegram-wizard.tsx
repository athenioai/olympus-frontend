"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "motion/react";
import {
  Send,
  Bot,
  ClipboardPaste,
  Loader2,
  CheckCircle2,
  ExternalLink,
  ArrowRight,
  ArrowLeft,
  X,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { connectChannel } from "../actions";

interface TelegramWizardProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly onConnected: () => void;
}

const TOKEN_REGEX = /^\d+:[a-zA-Z0-9_-]{35,}$/;

const STEPS = [1, 2, 3, 4] as const;

export function TelegramWizard({ open, onClose, onConnected }: TelegramWizardProps) {
  const t = useTranslations("settings.channels.telegram.wizard");
  const [step, setStep] = useState(1);
  const [token, setToken] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const isTokenValid = TOKEN_REGEX.test(token.trim());

  function reset() {
    setStep(1);
    setToken("");
    setError(null);
  }

  function handleClose() {
    reset();
    onClose();
  }

  function handleConnect() {
    if (!isTokenValid) return;
    setError(null);

    startTransition(async () => {
      const result = await connectChannel("telegram", token.trim());
      if (result.success) {
        setStep(4);
        onConnected();
      } else {
        const msg = result.error ?? "";
        if (msg.includes("CONFLICT")) {
          setError(t("conflict"));
        } else if (msg.includes("PROFILE_INCOMPLETE")) {
          setError("Complete seu perfil do negócio antes de conectar um canal.");
        } else {
          setError(t("error"));
        }
      }
    });
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-on-surface/20 backdrop-blur-sm"
        onClick={handleClose}
        onKeyDown={() => {}}
        role="presentation"
      />
      <motion.div
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative z-10 w-full max-w-lg rounded-2xl bg-surface-container-lowest p-0 shadow-ambient-strong"
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-surface-container-high/30 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0088cc]/10">
              <Send className="h-4 w-4 text-[#0088cc]" />
            </div>
            <h2 className="font-display text-base font-bold tracking-tight text-on-surface">
              {t("title")}
            </h2>
          </div>
          <button
            className="flex h-8 w-8 items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:bg-surface-container-high"
            onClick={handleClose}
            type="button"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Progress */}
        <div className="flex gap-1.5 px-6 pt-5">
          {STEPS.map((s) => (
            <div
              className={cn(
                "h-1 flex-1 rounded-full transition-colors duration-300",
                s <= step ? "bg-[#0088cc]" : "bg-surface-container-high",
              )}
              key={s}
            />
          ))}
        </div>

        {/* Content */}
        <div className="px-6 py-6">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                initial={{ opacity: 0, x: 20 }}
                key="step1"
                transition={{ duration: 0.2 }}
              >
                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0088cc]/10">
                  <Bot className="h-7 w-7 text-[#0088cc]" />
                </div>
                <h3 className="font-display text-lg font-bold tracking-tight text-on-surface">
                  {t("step1Title")}
                </h3>
                <p className="mt-2 text-[14px] leading-relaxed text-on-surface-variant">
                  {t("step1Desc")}
                </p>
                <a
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#0088cc]/10 px-4 py-2.5 text-[13px] font-semibold text-[#0088cc] transition-colors hover:bg-[#0088cc]/15"
                  href="https://t.me/BotFather"
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  {t("step1Cta")}
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                initial={{ opacity: 0, x: 20 }}
                key="step2"
                transition={{ duration: 0.2 }}
              >
                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/8">
                  <ClipboardPaste className="h-7 w-7 text-primary" />
                </div>
                <h3 className="font-display text-lg font-bold tracking-tight text-on-surface">
                  {t("step2Title")}
                </h3>
                <p className="mt-2 text-[14px] leading-relaxed text-on-surface-variant">
                  {t("step2Desc")}
                </p>
                <input
                  className={cn(
                    "mt-4 h-12 w-full rounded-xl bg-surface-container-high px-4 font-mono text-sm text-on-surface outline-none transition-all placeholder:text-on-surface-variant/40 focus:bg-surface-container-lowest focus:ring-1",
                    token && !isTokenValid
                      ? "focus:ring-danger/40"
                      : "focus:ring-primary/30",
                  )}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder={t("step2Placeholder")}
                  type="text"
                  value={token}
                />
                {token && !isTokenValid && (
                  <p className="mt-2 flex items-center gap-1.5 text-[12px] text-danger">
                    <AlertCircle className="h-3.5 w-3.5" />
                    {t("step2Invalid")}
                  </p>
                )}
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                initial={{ opacity: 0, x: 20 }}
                key="step3"
                transition={{ duration: 0.2 }}
              >
                <div className="flex flex-col items-center py-8 text-center">
                  <Loader2 className="mb-4 h-10 w-10 animate-spin text-[#0088cc]" />
                  <h3 className="font-display text-lg font-bold tracking-tight text-on-surface">
                    {t("step3Title")}
                  </h3>
                  <p className="mt-2 max-w-xs text-[14px] leading-relaxed text-on-surface-variant">
                    {t("step3Desc")}
                  </p>
                </div>
                {error && (
                  <div className="rounded-xl bg-danger-muted px-4 py-3 text-[13px] text-danger">
                    {error}
                  </div>
                )}
              </motion.div>
            )}

            {step === 4 && (
              <motion.div
                animate={{ opacity: 1, scale: 1 }}
                initial={{ opacity: 0, scale: 0.95 }}
                key="step4"
                transition={{ duration: 0.3 }}
              >
                <div className="flex flex-col items-center py-6 text-center">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
                    <CheckCircle2 className="h-8 w-8 text-success" />
                  </div>
                  <h3 className="font-display text-lg font-bold tracking-tight text-on-surface">
                    {t("step4Title")}
                  </h3>
                  <p className="mt-2 max-w-xs text-[14px] leading-relaxed text-on-surface-variant">
                    {t("step4Desc")}
                  </p>
                  <p className="mt-4 text-[13px] font-medium text-[#0088cc]">
                    {t("step4Cta")}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-surface-container-high/30 px-6 py-4">
          {step === 1 && (
            <>
              <div />
              <button
                className="flex h-10 items-center gap-2 rounded-xl bg-[#0088cc] px-5 text-[13px] font-bold text-white transition-opacity hover:opacity-90"
                onClick={() => setStep(2)}
                type="button"
              >
                {t("next")}
                <ArrowRight className="h-4 w-4" />
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <button
                className="flex h-10 items-center gap-2 rounded-xl px-4 text-[13px] font-medium text-on-surface-variant transition-colors hover:bg-surface-container-high"
                onClick={() => setStep(1)}
                type="button"
              >
                <ArrowLeft className="h-4 w-4" />
                {t("back")}
              </button>
              <button
                className="flex h-10 items-center gap-2 rounded-xl bg-[#0088cc] px-5 text-[13px] font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
                disabled={!isTokenValid}
                onClick={() => {
                  setStep(3);
                  handleConnect();
                }}
                type="button"
              >
                {t("connect")}
                <ArrowRight className="h-4 w-4" />
              </button>
            </>
          )}

          {step === 3 && (
            <>
              {error ? (
                <>
                  <button
                    className="flex h-10 items-center gap-2 rounded-xl px-4 text-[13px] font-medium text-on-surface-variant transition-colors hover:bg-surface-container-high"
                    onClick={() => {
                      setError(null);
                      setStep(2);
                    }}
                    type="button"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    {t("back")}
                  </button>
                  <button
                    className="flex h-10 items-center gap-2 rounded-xl bg-[#0088cc] px-5 text-[13px] font-bold text-white transition-opacity hover:opacity-90"
                    onClick={() => {
                      setError(null);
                      handleConnect();
                    }}
                    type="button"
                  >
                    Tentar novamente
                  </button>
                </>
              ) : (
                <div />
              )}
            </>
          )}

          {step === 4 && (
            <>
              <div />
              <button
                className="flex h-10 items-center gap-2 rounded-xl bg-primary px-5 text-[13px] font-bold text-on-primary transition-opacity hover:opacity-90"
                onClick={handleClose}
                type="button"
              >
                {t("close")}
              </button>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
