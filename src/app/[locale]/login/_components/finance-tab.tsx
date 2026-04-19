"use client";

import { fmtBRL } from "../_lib/fmt";
import { FINANCE_ITEMS } from "../_lib/bulletin-data";

interface FinanceTabProps {
  readonly collected: number;
}

/** Finance tab — recovered charges hero + list of recent payments. */
export function FinanceTab({ collected }: FinanceTabProps) {
  return (
    <>
      <div className="auth-ed-finhero">
        <div>
          <div className="auth-ed-eyebrow">Cobranças recuperadas</div>
          <div className="auth-ed-num">{fmtBRL(collected)}</div>
        </div>
        <div className="auth-ed-finstats">
          <span>
            <strong>12</strong> pagos
          </span>
          <span className="dotsep">·</span>
          <span>
            <strong>2</strong> pendentes
          </span>
          <span className="dotsep">·</span>
          <span className="auth-ed-delta-up">▲ +18%</span>
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
              {item.status === "paid" ? "pago" : "aguardando"}
            </span>
            <span className="auth-ed-finamt">{fmtBRL(item.amount)}</span>
          </li>
        ))}
      </ul>
    </>
  );
}
