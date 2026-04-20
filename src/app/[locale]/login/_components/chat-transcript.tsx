"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { CHAT_MESSAGES } from "../_lib/bulletin-data";

/**
 * Module-scoped flag that survives tab-switch unmount/remount but resets on
 * full page reload. Lets the typing animation play exactly once per visit.
 */
let hasPlayedThisPageLoad = false;

/**
 * Chat tab — types messages in sequence with a "..." dot indicator.
 * Animates only on the first mount per page load; subsequent tab switches
 * render the full transcript instantly.
 */
export function ChatTranscript() {
  const t = useTranslations("auth.bulletin.chat");
  const [visible, setVisible] = useState(() =>
    hasPlayedThisPageLoad ? CHAT_MESSAGES.length : 0,
  );
  const [typing, setTyping] = useState(false);

  useEffect(() => {
    if (hasPlayedThisPageLoad) return;

    let cancelled = false;
    const wait = (ms: number) =>
      new Promise<void>((resolve) => setTimeout(resolve, ms));

    const run = async () => {
      for (let i = 0; i < CHAT_MESSAGES.length; i++) {
        await wait(700);
        if (cancelled) return;
        setTyping(true);
        await wait(550);
        if (cancelled) return;
        setTyping(false);
        setVisible(i + 1);
      }
      hasPlayedThisPageLoad = true;
    };

    run();
    return () => {
      cancelled = true;
    };
  }, []);

  const next = CHAT_MESSAGES[visible];

  return (
    <div className="auth-ed-chat">
      {CHAT_MESSAGES.slice(0, visible).map((msg, i) => (
        <div key={i} className={`auth-ed-msg ${msg.who} fade-in-up`}>
          <span className="auth-ed-msg-meta">
            {msg.name} · {msg.time}
          </span>
          {msg.text}
        </div>
      ))}
      {typing && next && (
        <div className={`auth-ed-msg ${next.who} auth-ed-typing fade-in-up`}>
          <span className="auth-ed-msg-meta">
            {next.name} · {t("typing")}
          </span>
          <span className="auth-ed-dots">
            <i />
            <i />
            <i />
          </span>
        </div>
      )}
    </div>
  );
}
