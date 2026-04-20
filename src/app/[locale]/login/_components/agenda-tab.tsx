"use client";

import { useTranslations } from "next-intl";
import { AGENDA_SLOTS } from "../_lib/bulletin-data";

interface AgendaTabProps {
  readonly appts: number;
}

const CONFIRMED_COUNT = 5;
const FREE_COUNT = 2;

/** Agenda tab — tomorrow's slots with confirmed/new/free state badges. */
export function AgendaTab({ appts }: AgendaTabProps) {
  const t = useTranslations("auth.bulletin.agenda");

  return (
    <>
      <div className="auth-ed-aghead">
        <div>
          <div className="auth-ed-eyebrow">{t("heroLabel")}</div>
          <div className="auth-ed-num">
            {t("heroValue", { count: Math.round(appts) })}
          </div>
        </div>
        <div className="auth-ed-finstats">
          <span>
            {t.rich("confirmed", {
              count: CONFIRMED_COUNT,
              strong: (chunks) => <strong>{chunks}</strong>,
            })}
          </span>
          <span className="dotsep">·</span>
          <span>
            {t.rich("free", {
              count: FREE_COUNT,
              strong: (chunks) => <strong>{chunks}</strong>,
            })}
          </span>
        </div>
      </div>
      <ul className="auth-ed-aglist">
        {AGENDA_SLOTS.map((slot, i) => {
          const serviceLabel =
            slot.kind === "free" ? t("freeService") : slot.service;
          return (
            <li
              key={`${slot.time}-${slot.name}`}
              className={`auth-ed-agrow fade-in-up ${slot.kind}${slot.highlight ? " highlight" : ""}`}
              style={{ animationDelay: `${i * 55}ms` }}
            >
              <span className="auth-ed-agtime">{slot.time}</span>
              <span className="auth-ed-agbar" />
              <div className="auth-ed-agwho">
                <div className="auth-ed-finname">{slot.name}</div>
                <div className="auth-ed-finsvc">{serviceLabel}</div>
              </div>
              {slot.kind !== "free" && (
                <span className={`auth-ed-agtag ${slot.kind}`}>
                  {slot.kind === "new" ? t("tagNew") : t("tagConfirmed")}
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </>
  );
}
