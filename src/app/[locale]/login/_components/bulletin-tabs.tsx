"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { ChatTranscript } from "./chat-transcript";
import { FinanceTab } from "./finance-tab";
import { AgendaTab } from "./agenda-tab";
import type { WindowUnit } from "../_hooks/use-bulletin-context";

type TabKey = "chat" | "finance" | "agenda";

const TAB_KEYS: readonly TabKey[] = ["chat", "finance", "agenda"];
const STORAGE_KEY = "olympus.login.lastTab";

interface BulletinTabsProps {
  readonly unitKey: WindowUnit;
  readonly collected: number;
  readonly appts: number;
}

function readStoredTab(): TabKey {
  if (typeof window === "undefined") return "chat";
  const raw = window.localStorage.getItem(STORAGE_KEY);
  return TAB_KEYS.includes(raw as TabKey) ? (raw as TabKey) : "chat";
}

/** Tab navigator + animated panel switcher; remembers the last tab choice. */
export function BulletinTabs({ unitKey, collected, appts }: BulletinTabsProps) {
  const t = useTranslations("auth.bulletin");
  const [active, setActive] = useState<TabKey>("chat");

  useEffect(() => {
    setActive(readStoredTab());
  }, []);

  const handleSelect = (key: TabKey) => {
    setActive(key);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, key);
    }
  };

  const tabs: readonly { key: TabKey; label: string; meta: string }[] = [
    { key: "chat", label: t("tabs.chat"), meta: t("tabs.chatMeta") },
    { key: "finance", label: t("tabs.finance"), meta: t(`windowUnit.${unitKey}`) },
    { key: "agenda", label: t("tabs.agenda"), meta: t("tabs.agendaMeta") },
  ];

  const meta = tabs.find((tab) => tab.key === active)?.meta ?? "";

  return (
    <div className="auth-ed-tabs">
      <div className="auth-ed-tabnav" role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            role="tab"
            aria-selected={active === tab.key}
            className={`auth-ed-tab${active === tab.key ? " on" : ""}`}
            onClick={() => handleSelect(tab.key)}
            type="button"
          >
            {tab.label}
          </button>
        ))}
        <span className="auth-ed-tabmeta">{meta}</span>
      </div>
      <div className="auth-ed-tabpanel" key={active}>
        {active === "chat" && <ChatTranscript />}
        {active === "finance" && <FinanceTab collected={collected} />}
        {active === "agenda" && <AgendaTab appts={appts} />}
      </div>
    </div>
  );
}
