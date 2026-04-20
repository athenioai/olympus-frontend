"use client";

import { useLocale, useTranslations } from "next-intl";
import { fmtBRL } from "../_lib/fmt";
import { FINANCE_ITEMS } from "../_lib/bulletin-data";

interface FinanceTabProps {
  readonly collected: number;
}

const PAID_COUNT = 12;
const PENDING_COUNT = 2;

/** Finance tab — recovered charges hero + list of recent payments. */
export function FinanceTab({ collected }: FinanceTabProps) {
  const t = useTranslations("auth.bulletin.finance");
  const locale = useLocale();

  return (
    <>
      <div className="auth-ed-finhero">
        <div>
          <div className="auth-ed-eyebrow">{t("heroLabel")}</div>
          <div className="auth-ed-num">{fmtBRL(collected, locale)}</div>
        </div>
        <div className="auth-ed-finstats">
          <span>
            {t.rich("paid", {
              count: PAID_COUNT,
              strong: (chunks) => <strong>{chunks}</strong>,
            })}
          </span>
          <span className="dotsep">·</span>
          <span>
            {t.rich("pending", {
              count: PENDING_COUNT,
              strong: (chunks) => <strong>{chunks}</strong>,
            })}
          </span>
          <span className="dotsep">·</span>
          <span className="auth-ed-delta-up">{t("delta")}</span>
        </div>
      </div>
      <ul className="auth-ed-finlist">
        {FINANCE_ITEMS.map((item, i) => (
          <li
            key={`${item.time}-${item.name}`}
            className="auth-ed-finrow fade-in-up"
            style={{ animationDelay: `${i * 70}ms` }}
          >
            <span className="auth-ed-fintime">{item.time}</span>
            <div className="auth-ed-finwho">
              <div className="auth-ed-finname">{item.name}</div>
              <div className="auth-ed-finsvc">{item.service}</div>
            </div>
            <span className={`auth-ed-finstatus ${item.status}`}>
              <span className="dot" />
              {item.status === "paid" ? t("statusPaid") : t("statusPending")}
            </span>
            <span className="auth-ed-finamt">{fmtBRL(item.amount, locale)}</span>
          </li>
        ))}
      </ul>
    </>
  );
}
