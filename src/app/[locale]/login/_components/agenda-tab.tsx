"use client";

import { AGENDA_SLOTS } from "../_lib/bulletin-data";

interface AgendaTabProps {
  readonly appts: number;
}

/** Agenda tab — tomorrow's slots with confirmed/new/free state badges. */
export function AgendaTab({ appts }: AgendaTabProps) {
  return (
    <>
      <div className="auth-ed-aghead">
        <div>
          <div className="auth-ed-eyebrow">Amanhã · quarta</div>
          <div className="auth-ed-num">{Math.round(appts)} consultas</div>
        </div>
        <div className="auth-ed-finstats">
          <span>
            <strong>5</strong> confirmadas
          </span>
          <span className="dotsep">·</span>
          <span>
            <strong>2</strong> livres
          </span>
        </div>
      </div>
      <ul className="auth-ed-aglist">
        {AGENDA_SLOTS.map((slot, i) => (
          <li
            key={`${slot.time}-${slot.name}`}
            className={`auth-ed-agrow fade-in-up ${slot.kind}${slot.highlight ? " highlight" : ""}`}
            style={{ animationDelay: `${i * 55}ms` }}
          >
            <span className="auth-ed-agtime">{slot.time}</span>
            <span className="auth-ed-agbar" />
            <div className="auth-ed-agwho">
              <div className="auth-ed-finname">{slot.name}</div>
              <div className="auth-ed-finsvc">{slot.service}</div>
            </div>
            {slot.kind !== "free" && (
              <span className={`auth-ed-agtag ${slot.kind}`}>
                {slot.kind === "new" ? "novo cliente" : "agendou sozinho"}
              </span>
            )}
          </li>
        ))}
      </ul>
    </>
  );
}
