"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useTicker } from "@/app/[locale]/login/_hooks/use-ticker";
import { useCountUp } from "@/app/[locale]/login/_hooks/use-count-up";
import { fmtBRL } from "@/app/[locale]/login/_lib/fmt";
import { SIGNUP_FEED } from "../_lib/signup-feed-data";

const DATE_FMT = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const TARGET_REVENUE = 18_427_000;
const TARGET_BUSINESSES = 2_847;
const FEED_ROTATE_MS = 3_500;
const VISIBLE_FEED_ROWS = 4;

/** Left dark column — social proof: stat rail + rotating signup feed. */
export function SignupBulletin() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="auth-ed-left">
      <BulletinHeader mounted={mounted} />
      {mounted ? <BulletinContent /> : <BulletinPlaceholder />}
      <BulletinFooter />
    </div>
  );
}

function BulletinHeader({ mounted }: { readonly mounted: boolean }) {
  const t = useTranslations("signup");

  return (
    <header className="auth-ed-header">
      <div className="flex items-center gap-2.5">
        <div className="auth-ed-logo">O</div>
        <div className="font-display text-[13px] font-bold text-white">
          Olympus
        </div>
        <span className="auth-ed-team">
          <span className="auth-ed-team-dot" />
          {t("bulletinBadge")}
        </span>
      </div>
      {mounted && <BulletinIssue />}
    </header>
  );
}

function BulletinIssue() {
  const t = useTranslations("signup");
  const now = useTicker();

  return (
    <div className="font-mono flex items-center gap-4 text-[10.5px] uppercase tracking-[0.12em] text-white/55">
      <span>{t("bulletinIssue")}</span>
      <span aria-hidden>·</span>
      <span className="text-white/85 tabular-nums">
        {DATE_FMT.format(now).replace(/\//g, ".")}
      </span>
    </div>
  );
}

function BulletinContent() {
  const t = useTranslations("signup");
  const revenue = useCountUp(TARGET_REVENUE, 2000, 150);
  const pros = useCountUp(TARGET_BUSINESSES, 1600, 280);

  return (
    <>
      <div className="auth-ed-masthead">
        <div className="auth-ed-eyebrow">{t("bulletinEyebrow")}</div>
        <h1 className="auth-ed-title" style={{ maxWidth: "24ch" }}>
          {t.rich("bulletinTitle", {
            revenue: fmtBRL(revenue),
            em: (chunks) => <em className="hot">{chunks}</em>,
          })}
        </h1>
      </div>

      <StatRail businesses={pros} />
      <SignupFeed />
    </>
  );
}

function StatRail({ businesses }: { readonly businesses: number }) {
  const t = useTranslations("signup");

  return (
    <div className="signup-stats">
      <div className="signup-stat">
        <div className="signup-stat-n">
          {Math.round(businesses).toLocaleString("pt-BR")}
        </div>
        <div className="signup-stat-l">{t("statBusinesses")}</div>
      </div>
      <div className="signup-stat-sep" />
      <div className="signup-stat">
        <div className="signup-stat-n">
          94<span className="u">%</span>
        </div>
        <div className="signup-stat-l">{t("statResponse")}</div>
      </div>
      <div className="signup-stat-sep" />
      <div className="signup-stat">
        <div className="signup-stat-n">
          8<span className="u">min</span>
        </div>
        <div className="signup-stat-l">{t("statTimeToLive")}</div>
      </div>
    </div>
  );
}

function SignupFeed() {
  const t = useTranslations("signup");
  const [cursor, setCursor] = useState(0);

  useEffect(() => {
    const id = setInterval(
      () => setCursor((c) => (c + 1) % SIGNUP_FEED.length),
      FEED_ROTATE_MS,
    );
    return () => clearInterval(id);
  }, []);

  const visible = Array.from(
    { length: VISIBLE_FEED_ROWS },
    (_, i) => SIGNUP_FEED[(cursor + i) % SIGNUP_FEED.length],
  );

  return (
    <div className="signup-feed">
      <div className="signup-feed-head">
        <div className="auth-ed-eyebrow">{t("feedHead")}</div>
        <div className="signup-feed-meta-window">{t("feedWindow")}</div>
      </div>
      <ul className="signup-feed-list">
        {visible.map((entry, i) => (
          <li
            key={`${cursor}-${i}`}
            className="signup-feed-row"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <span
              className="signup-feed-ava"
              style={{
                background: `hsl(${(entry.name.charCodeAt(0) * 23) % 360} 30% 40%)`,
              }}
            >
              {entry.name.charAt(0)}
            </span>
            <span className="signup-feed-who">
              <span className="signup-feed-name">{entry.name}</span>
              <span className="signup-feed-meta">
                {entry.trade} · {entry.city}
              </span>
            </span>
            <span className="signup-feed-time">
              {t("feedTime", { minutes: entry.mins })}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function BulletinPlaceholder() {
  return (
    <>
      <div className="auth-ed-masthead" aria-hidden>
        <div className="skeleton h-3 w-32" style={{ borderRadius: 4 }} />
        <div className="skeleton mt-3 h-9 w-[80%]" style={{ borderRadius: 6 }} />
        <div className="skeleton mt-2 h-9 w-[55%]" style={{ borderRadius: 6 }} />
      </div>
      <div className="signup-feed" aria-hidden>
        <div className="flex flex-col gap-2 pt-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-11 w-full" style={{ borderRadius: 8 }} />
          ))}
        </div>
      </div>
    </>
  );
}

function BulletinFooter() {
  const t = useTranslations("signup");

  return (
    <footer className="auth-ed-footer">
      <span>{t("footerLeft")}</span>
      <span className="auth-ed-rule" />
      <span>{t("footerRight")}</span>
    </footer>
  );
}
