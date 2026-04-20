"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useTicker } from "../_hooks/use-ticker";
import { useBulletinContext } from "../_hooks/use-bulletin-context";
import { useCountUp } from "../_hooks/use-count-up";
import { fmtBRL } from "../_lib/fmt";
import { BulletinTabs } from "./bulletin-tabs";
import { BulletinSkeleton } from "./bulletin-skeleton";

/**
 * Left dark column. Renders a skeleton during SSR/hydration so the layout
 * stays stable, then mounts the live content once the client takes over.
 *
 * TODO(backend): once /platform/pulse is wired, gate `mounted` on the SWR
 * data state instead of just hydration.
 */
export function LiveBulletin() {
  const t = useTranslations("auth.bulletin");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="auth-ed-left">
      <BulletinHeader mounted={mounted} />
      {mounted ? <LiveBulletinContent /> : <BulletinSkeleton />}
      <footer className="auth-ed-footer">
        <span>{t("footerLeft")}</span>
        <span className="auth-ed-rule" />
        <span>{t("footerRight")}</span>
      </footer>
    </div>
  );
}

interface BulletinHeaderProps {
  readonly mounted: boolean;
}

function BulletinHeader({ mounted }: BulletinHeaderProps) {
  const t = useTranslations("auth.bulletin");

  return (
    <header className="auth-ed-header">
      <div className="flex items-center gap-2.5">
        <div className="auth-ed-logo">O</div>
        <div className="font-display text-[13px] font-bold text-white">
          Olympus
        </div>
        <span className="auth-ed-live">
          <span className="auth-ed-live-dot" />
          {t("live")}
        </span>
      </div>
      {mounted && <BulletinClock />}
    </header>
  );
}

function BulletinClock() {
  const t = useTranslations("auth.bulletin");
  const locale = useLocale();
  const now = useTicker();

  const dateFmt = new Intl.DateTimeFormat(locale, {
    weekday: "long",
    day: "2-digit",
    month: "long",
  });
  const timeFmt = new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const dateStr = dateFmt.format(now);
  const timeStr = timeFmt.format(now);
  const issueNo = String(now.getDate() + 7).padStart(3, "0");

  return (
    <div className="font-mono flex items-center gap-4 text-[10.5px] uppercase tracking-[0.12em] text-white/55">
      <span>
        {t("issuePrefix")} {issueNo}
      </span>
      <span aria-hidden>·</span>
      <span>{dateStr}</span>
      <span aria-hidden>·</span>
      <span className="text-white/85 tabular-nums">{timeStr}</span>
    </div>
  );
}

function LiveBulletinContent() {
  const t = useTranslations("auth.bulletin");
  const locale = useLocale();
  const now = useTicker();
  const ctx = useBulletinContext(now);

  const people = useCountUp(ctx.people, 1400, 80);
  const collected = useCountUp(ctx.collected, 1600, 260);
  const appts = useCountUp(ctx.appts, 1200, 220);

  return (
    <>
      <div className="auth-ed-masthead">
        <div className="auth-ed-eyebrow">
          {t(`windowLabel.${ctx.daypart}`)}
        </div>
        <h1 className="auth-ed-title">
          {t.rich("title", {
            window: t(`windowDesc.${ctx.daypart}`),
            people: Math.round(people),
            collected: fmtBRL(collected, locale),
            em: (chunks) => <em className="hot">{chunks}</em>,
            strong: (chunks) => <strong>{chunks}</strong>,
          })}
        </h1>
      </div>

      <BulletinTabs
        unitKey={ctx.unit}
        collected={collected}
        appts={appts}
      />
    </>
  );
}
