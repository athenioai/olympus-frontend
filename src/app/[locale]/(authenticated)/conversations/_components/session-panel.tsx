"use client";

import { useState, useTransition, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import Link from "next/link";
import {
  Clock,
  Flame,
  MessageSquare,
  MessagesSquare,
  Search,
  Trash2,
  UserRound,
  X,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/format";
import { deleteChatSession } from "../actions";
import { DeleteDialog } from "./delete-dialog";
import type { ChatSession } from "@/lib/services/interfaces/chat-service";

/* ---------- Agent visual config ---------- */

type AgentKey = "horos" | "kairos" | "human";

interface AgentVisual {
  readonly bg: string;
  readonly text: string;
  readonly icon: typeof Clock;
}

const AGENT_VISUALS: Record<AgentKey, AgentVisual> = {
  horos: {
    bg: "bg-teal/15",
    text: "text-teal",
    icon: Clock,
  },
  kairos: {
    bg: "bg-primary/15",
    text: "text-primary",
    icon: Zap,
  },
  human: {
    bg: "bg-[#8b5cf6]/15",
    text: "text-[#8b5cf6]",
    icon: UserRound,
  },
};

const FALLBACK_VISUAL: AgentVisual = {
  bg: "bg-on-surface-variant/10",
  text: "text-on-surface-variant",
  icon: Flame,
};

function getAgentVisual(agent: string): AgentVisual {
  return AGENT_VISUALS[agent as AgentKey] ?? FALLBACK_VISUAL;
}

/* ---------- Channel badge config ---------- */

const CHANNEL_VALUES = ["", "whatsapp", "telegram", "instagram", "sms"] as const;
const CHANNEL_DISPLAY: Record<string, string> = {
  "": "",
  whatsapp: "WhatsApp",
  telegram: "Telegram",
  instagram: "Instagram",
  sms: "SMS",
};

/* ---------- Component ---------- */

interface SessionPanelProps {
  readonly initialSessions: ChatSession[];
}

export function SessionPanel({ initialSessions }: SessionPanelProps) {
  const t = useTranslations("conversations");
  const tc = useTranslations("common");
  const pathname = usePathname();
  const router = useRouter();

  const [sessions, setSessions] = useState(initialSessions);
  const [searchQuery, setSearchQuery] = useState("");
  const [agentFilter, setAgentFilter] = useState("");
  const [channelFilter, setChannelFilter] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [isDeleting, startDelete] = useTransition();

  const filtered = useMemo(() => {
    let result = sessions;

    if (agentFilter) {
      result = result.filter((s) =>
        agentFilter === "human" ? s.handoff : s.agent === agentFilter,
      );
    }

    if (channelFilter) {
      result = result.filter((s) => s.channel === channelFilter);
    }

    if (searchQuery.trim()) {
      const term = searchQuery.toLowerCase();
      result = result.filter((s) =>
        s.leadName?.toLowerCase().includes(term),
      );
    }

    return result;
  }, [sessions, agentFilter, channelFilter, searchQuery]);

  const logicalPath = pathname.replace(/^\/(pt-BR|en-US|es)/, "");
  const activeSessionId = logicalPath.startsWith("/conversations/")
    ? logicalPath.split("/conversations/")[1]?.split("/")[0]
    : null;

  function handleDelete(sessionId: string) {
    startDelete(async () => {
      const result = await deleteChatSession(sessionId);
      if (result.success) {
        setSessions((prev) =>
          prev.filter((s) => s.sessionId !== sessionId),
        );
        setDeleteTarget(null);
        if (activeSessionId === sessionId) {
          router.push("/conversations");
        }
      }
    });
  }

  const hasFilters = agentFilter || channelFilter || searchQuery;

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="shrink-0 space-y-3 px-6 pt-6 pb-4">
        <h2 className="text-xl font-bold tracking-tight text-on-surface">
          {t("title")}
        </h2>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("searchPlaceholder")}
            className="h-10 w-full rounded-xl bg-surface-container-high pl-10 pr-9 text-sm text-on-surface outline-none placeholder:text-on-surface-variant/60 transition-all focus:ring-1 focus:ring-primary/30 focus:bg-surface-container-lowest"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface"
              type="button"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2">
          <select
            value={agentFilter}
            onChange={(e) => setAgentFilter(e.target.value)}
            className="h-8 flex-1 rounded-lg bg-surface-container-high px-2 text-xs text-on-surface outline-none transition-colors hover:bg-surface-container-highest focus:ring-1 focus:ring-primary/30"
          >
            <option value="">{t("allAgents")}</option>
            <option value="horos">{t("agents.horos")}</option>
            <option value="kairos">{t("agents.kairos")}</option>
            <option value="human">{t("agents.human")}</option>
          </select>
          <select
            value={channelFilter}
            onChange={(e) => setChannelFilter(e.target.value)}
            className="h-8 flex-1 rounded-lg bg-surface-container-high px-2 text-xs text-on-surface outline-none transition-colors hover:bg-surface-container-highest focus:ring-1 focus:ring-primary/30"
          >
            {CHANNEL_VALUES.map((v) => (
              <option key={v} value={v}>
                {v === "" ? t("allChannels") : CHANNEL_DISPLAY[v] || v}
              </option>
            ))}
          </select>
        </div>

        {hasFilters && (
          <button
            onClick={() => {
              setAgentFilter("");
              setChannelFilter("");
              setSearchQuery("");
            }}
            className="text-[11px] font-medium text-primary hover:underline"
            type="button"
          >
            {tc("search")} &times;
          </button>
        )}
      </div>

      {/* Session list */}
      <div className="flex-1 overflow-y-auto px-3 pb-4">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-container-high">
              <MessagesSquare className="h-6 w-6 text-on-surface-variant/50" />
            </div>
            <p className="mt-3 text-sm text-on-surface-variant">
              {t("noConversations")}
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {filtered.map((session) => {
              const isActive = session.sessionId === activeSessionId;
              const activeAgent = session.handoff ? "human" : session.agent;
              const visual = getAgentVisual(activeAgent);
              const AgentIcon = visual.icon;
              const displayName = session.leadName ?? t("unknown");

              return (
                <Link
                  key={session.sessionId}
                  href={`/conversations/${session.sessionId}`}
                  className={cn(
                    "group relative flex items-start gap-3 rounded-xl px-4 py-3.5 transition-all duration-150",
                    isActive
                      ? "bg-surface-container-lowest shadow-sm"
                      : "hover:bg-surface-container-high",
                  )}
                >
                  {/* Agent avatar */}
                  <div
                    className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                      visual.bg,
                      visual.text,
                    )}
                  >
                    <AgentIcon className="h-5 w-5" />
                  </div>

                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <span
                        className={cn(
                          "truncate text-sm font-semibold",
                          isActive
                            ? "text-primary"
                            : "text-on-surface",
                        )}
                      >
                        {displayName}
                      </span>
                      <div className="flex shrink-0 items-center gap-1.5">
                        <span className="text-[10px] text-on-surface-variant">
                          {formatRelativeTime(session.lastMessageAt)}
                        </span>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setDeleteTarget(session.sessionId);
                          }}
                          className="flex h-5 w-5 items-center justify-center rounded-md text-on-surface-variant opacity-0 transition-all group-hover:opacity-100 hover:bg-danger/10 hover:text-danger"
                          type="button"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>

                    {/* Agent badge */}
                    <div className="mt-0.5 flex items-center gap-1.5">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider",
                          visual.bg,
                          visual.text,
                        )}
                      >
                        {t(`agents.${activeAgent as AgentKey}`)}
                      </span>
                      {session.handoff && (
                        <span className="text-[10px] font-medium text-[#8b5cf6]">
                          {t("status.handoff")}
                        </span>
                      )}
                    </div>

                    {/* Last message preview */}
                    <div className="mt-1 flex items-center gap-1.5 text-on-surface-variant">
                      <MessageSquare className="h-3 w-3 shrink-0" />
                      <p className="truncate text-xs">
                        {session.lastMessage}
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      <DeleteDialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && handleDelete(deleteTarget)}
        isDeleting={isDeleting}
      />
    </div>
  );
}
