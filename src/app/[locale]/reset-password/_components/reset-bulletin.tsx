"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { ShieldCheck } from "lucide-react";
import { useTicker } from "@/app/[locale]/login/_hooks/use-ticker";

const DATE_FMT = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});
const TIME_FMT = new Intl.DateTimeFormat("pt-BR", {
  hour: "2-digit",
  minute: "2-digit",
});

export type ResetStage = "form" | "success" | "invalid";

interface ResetBulletinProps {
  readonly stage: ResetStage;
}

/** Left dark column — shows steps 1+2 already DONE, step 3 active/done. */
export function ResetBulletin({ stage }: ResetBulletinProps) {
  const t = useTranslations("resetPassword");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const titleKey =
    stage === "success"
      ? "titleSuccess"
      : stage === "invalid"
        ? "titleInvalid"
        : "titleForm";

  return (
    <div className="auth-ed-left">
      <BulletinHeader mounted={mounted} />

      <div className="auth-ed-masthead">
        <div className="auth-ed-eyebrow">{t("eyebrow")}</div>
        <h1 className="auth-ed-title">
          {t.rich(titleKey, { em: (chunks) => <em>{chunks}</em> })}
        </h1>
      </div>

      <ResetTimeline stage={stage} />
      <SecurityNote />

      <footer className="auth-ed-footer">
        <span>{t("supportLeft")}</span>
        <span className="auth-ed-rule" />
        <span>{t("supportRight")}</span>
      </footer>
    </div>
  );
}

function BulletinHeader({ mounted }: { readonly mounted: boolean }) {
  const t = useTranslations("resetPassword");

  return (
    <header className="auth-ed-header">
      <div className="flex items-center gap-2.5">
        <div className="auth-ed-logo">O</div>
        <div className="font-display text-[13px] font-bold text-white">
          Olympus
        </div>
        <span className="auth-ed-newpwd">
          <span className="auth-ed-newpwd-dot" />
          {t("badge")}
        </span>
      </div>
      {mounted && <BulletinClock />}
    </header>
  );
}

function BulletinClock() {
  const now = useTicker();
  const t = useTranslations("resetPassword");

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

function ResetTimeline({ stage }: { readonly stage: ResetStage }) {
  const t = useTranslations("resetPassword");

  const step3Class =
    stage === "success"
      ? "forgot-step done"
      : stage === "invalid"
        ? "forgot-step"
        : "forgot-step active";

  return (
    <div className="forgot-timeline">
      <div className="forgot-step done">
        <span className="forgot-step-dot" />
        <div className="forgot-step-body">
          <div className="forgot-step-ttl">{t("step1Title")}</div>
          <div className="forgot-step-msg">{t("step1Msg")}</div>
        </div>
      </div>
      <div className="forgot-step done">
        <span className="forgot-step-dot" />
        <div className="forgot-step-body">
          <div className="forgot-step-ttl">{t("step2Title")}</div>
          <div className="forgot-step-msg">{t("step2Msg")}</div>
        </div>
      </div>
      <div className={step3Class}>
        <span className="forgot-step-dot" />
        <div className="forgot-step-body">
          <div className="forgot-step-ttl">{t("step3Title")}</div>
          <div className="forgot-step-msg">
            {stage === "success" ? t("step3MsgSuccess") : t("step3MsgForm")}
          </div>
        </div>
      </div>
    </div>
  );
}

function SecurityNote() {
  const t = useTranslations("resetPassword");

  return (
    <div className="forgot-security">
      <div className="forgot-security-ico">
        <ShieldCheck className="size-3.5" strokeWidth={2.2} />
      </div>
      <div>
        <div className="forgot-security-ttl">{t("securityTitle")}</div>
        <div className="forgot-security-msg">{t("securityMsg")}</div>
      </div>
    </div>
  );
}
