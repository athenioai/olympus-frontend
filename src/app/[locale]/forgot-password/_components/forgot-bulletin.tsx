"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Check } from "lucide-react";
import { useTicker } from "@/app/[locale]/login/_hooks/use-ticker";
import { maskEmail } from "../_lib/mask-email";

const DATE_FMT = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});
const TIME_FMT = new Intl.DateTimeFormat("pt-BR", {
  hour: "2-digit",
  minute: "2-digit",
});

interface ForgotBulletinProps {
  readonly stage: "enter" | "sent";
  readonly email: string;
}

/** Left dark column — recovery flow guidance + 3-step timeline + security note. */
export function ForgotBulletin({ stage, email }: ForgotBulletinProps) {
  const t = useTranslations("forgotPassword");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="auth-ed-left">
      <BulletinHeader mounted={mounted} />

      <div className="auth-ed-masthead">
        <div className="auth-ed-eyebrow">{t("eyebrow")}</div>
        <h1 className="auth-ed-title">
          {t.rich(stage === "enter" ? "titleEnter" : "titleSent", {
            em: (chunks) => <em>{chunks}</em>,
          })}
        </h1>
      </div>

      <ForgotTimeline stage={stage} email={email} />
      <SecurityNote />

      <footer className="auth-ed-footer">
        <span>{t("supportLeft")}</span>
        <span className="auth-ed-rule" />
        <span>{t("supportRight")}</span>
      </footer>
    </div>
  );
}

interface BulletinHeaderProps {
  readonly mounted: boolean;
}

function BulletinHeader({ mounted }: BulletinHeaderProps) {
  const t = useTranslations("forgotPassword");

  return (
    <header className="auth-ed-header">
      <div className="flex items-center gap-2.5">
        <div className="auth-ed-logo">O</div>
        <div className="font-display text-[13px] font-bold text-white">
          Olympus
        </div>
        <span className="auth-ed-recovery">
          <span className="auth-ed-recovery-dot" />
          {t("badge")}
        </span>
      </div>
      {mounted && <BulletinClock />}
    </header>
  );
}

function BulletinClock() {
  const now = useTicker();
  const t = useTranslations("forgotPassword");

  return (
    <div className="font-mono flex items-center gap-4 text-[10.5px] uppercase tracking-[0.12em] text-white/55">
      <span>{t("secureSession")}</span>
      <span aria-hidden>·</span>
      <span>{DATE_FMT.format(now).replace(/\//g, ".")}</span>
      <span aria-hidden>·</span>
      <span className="text-white/85 tabular-nums">{TIME_FMT.format(now)}</span>
    </div>
  );
}

interface ForgotTimelineProps {
  readonly stage: "enter" | "sent";
  readonly email: string;
}

function ForgotTimeline({ stage, email }: ForgotTimelineProps) {
  const t = useTranslations("forgotPassword");

  const step1Class =
    stage === "enter" ? "forgot-step active" : "forgot-step done";
  const step2Class = stage === "sent" ? "forgot-step active" : "forgot-step";

  return (
    <div className="forgot-timeline">
      <div className={step1Class}>
        <span className="forgot-step-dot" />
        <div className="forgot-step-body">
          <div className="forgot-step-ttl">{t("step1Title")}</div>
          <div className="forgot-step-msg">
            {stage === "enter" ? (
              t("step1MsgEnter")
            ) : (
              <span className="font-mono">{maskEmail(email)}</span>
            )}
          </div>
        </div>
      </div>

      <div className={step2Class}>
        <span className="forgot-step-dot" />
        <div className="forgot-step-body">
          <div className="forgot-step-ttl">{t("step2Title")}</div>
          <div className="forgot-step-msg">{t("step2Msg")}</div>
        </div>
      </div>

      <div className="forgot-step">
        <span className="forgot-step-dot" />
        <div className="forgot-step-body">
          <div className="forgot-step-ttl">{t("step3Title")}</div>
          <div className="forgot-step-msg">{t("step3Msg")}</div>
        </div>
      </div>
    </div>
  );
}

function SecurityNote() {
  const t = useTranslations("forgotPassword");

  return (
    <div className="forgot-security">
      <div className="forgot-security-ico">
        <Check className="size-3.5" strokeWidth={2.5} />
      </div>
      <div>
        <div className="forgot-security-ttl">{t("securityTitle")}</div>
        <div className="forgot-security-msg">{t("securityMsg")}</div>
      </div>
    </div>
  );
}
