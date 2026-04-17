"use client";

import { useState, useTransition, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import Link from "next/link";
import {
  Bot,
  Flame,
  MessageSquare,
  MessagesSquare,
  Search,
  Snowflake,
  Thermometer,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import { WhatsAppIcon, TelegramIcon } from "@/components/icons/channel-icons";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/format";
import { deleteChatSession } from "../actions";
import { DeleteDialog } from "./delete-dialog";
import type { ChatSession } from "@/lib/services/interfaces/chat-service";

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
  const [handoffOnly, setHandoffOnly] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [isDeleting, startDelete] = useTransition();

  const handoffCount = useMemo(() => sessions.filter((s) => s.handoff).length, [sessions]);

  const filtered = useMemo(() => {
    let result = sessions;

    if (handoffOnly) {
      result = result.filter((s) => s.handoff);
    }

    if (searchQuery.trim()) {
      const term = searchQuery.toLowerCase();
      result = result.filter((s) =>
        s.lead.name.toLowerCase().includes(term),
      );
    }

    return result;
  }, [sessions, handoffOnly, searchQuery]);

  const logicalPath = pathname.replace(/^\/(pt-BR|en-US|es)/, "");
  const activeSessionId = logicalPath.startsWith("/conversations/")
    ? logicalPath.split("/conversations/")[1]?.split("/")[0]
    : null;

  function handleDelete(sessionId: string) {
    startDelete(async () => {
      const result = await deleteChatSession(sessionId);
      if (result.success) {
        setSessions((prev) =>
          prev.filter((s) => s.id !== sessionId),
        );
        setDeleteTarget(null);
        if (activeSessionId === sessionId) {
          router.push("/conversations");
        }
      }
    });
  }

  const hasFilters = searchQuery || handoffOnly;

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

        {/* Handoff filter */}
        <button
          className={cn(
            "flex h-9 w-full items-center justify-center gap-2 rounded-xl text-[13px] font-semibold transition-colors",
            handoffOnly
              ? "bg-[#8b5cf6]/10 text-[#8b5cf6]"
              : "bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest",
          )}
          onClick={() => setHandoffOnly((prev) => !prev)}
          type="button"
        >
          <UserRound className="h-4 w-4" />
          {t("needsHuman")}
          {handoffCount > 0 && (
            <span className={cn(
              "flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[11px] font-bold",
              handoffOnly ? "bg-[#8b5cf6]/20 text-[#8b5cf6]" : "bg-on-surface-variant/10 text-on-surface-variant",
            )}>
              {handoffCount}
            </span>
          )}
        </button>

        {hasFilters && (
          <button
            onClick={() => {
              setHandoffOnly(false);
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
              const isActive = session.id === activeSessionId;
              const isHot = session.lead.temperature === "hot";

              return (
                <Link
                  key={session.id}
                  href={`/conversations/${session.id}`}
                  className={cn(
                    "group relative flex items-start gap-3 rounded-xl px-4 py-3.5 transition-all duration-150",
                    isActive
                      ? "bg-surface-container-lowest shadow-sm"
                      : "hover:bg-surface-container-high",
                  )}
                >
                  {/* Avatar */}
                  <div className="relative">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-surface-container-high text-on-surface-variant">
                      <UserRound className="h-6 w-6" />
                    </div>
                    {isHot && (
                      <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-surface-container-low bg-warning" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    {/* Row 1: Name + icons + time */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-2">
                        <span className={cn("truncate text-[14px] font-semibold", isActive ? "text-primary" : "text-on-surface")}>
                          {session.lead.name}
                        </span>
                        <div className="flex shrink-0 items-center gap-1">
                          {session.lead.channel === "whatsapp" && (
                            <WhatsAppIcon className="h-3.5 w-3.5 text-[#25D366]" />
                          )}
                          {session.lead.channel === "telegram" && (
                            <TelegramIcon className="h-3.5 w-3.5 text-[#0088cc]" />
                          )}
                          {session.lead.temperature === "hot" && (
                            <Flame className="h-3.5 w-3.5 text-danger" />
                          )}
                          {session.lead.temperature === "warm" && (
                            <Thermometer className="h-3.5 w-3.5 text-warning" />
                          )}
                          {session.lead.temperature === "cold" && (
                            <Snowflake className="h-3.5 w-3.5" style={{ color: "#7DD3FC" }} />
                          )}
                          {session.handoff && (
                            <span className="rounded bg-[#8b5cf6]/10 px-1 py-0.5 text-[9px] font-bold uppercase text-[#8b5cf6]">
                              H
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="shrink-0 text-[11px] text-on-surface-variant">
                        {formatRelativeTime(session.lastMessage?.createdAt ?? session.updatedAt)}
                      </span>
                    </div>

                    {/* Row 2: Last message preview */}
                    <div className="mt-1 flex items-center justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-1.5 text-on-surface-variant">
                        {session.lastMessage ? (
                          <>
                            {session.lastMessage.sender === "lead" ? (
                              <UserRound className="h-3.5 w-3.5 shrink-0 text-on-surface-variant/50" />
                            ) : (
                              <Bot className="h-3.5 w-3.5 shrink-0 text-teal" />
                            )}
                            <p className="truncate text-[13px]">
                              {session.lastMessage.content}
                            </p>
                          </>
                        ) : (
                          <p className="text-[13px] text-on-surface-variant/40">...</p>
                        )}
                      </div>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setDeleteTarget(session.id);
                        }}
                        className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-on-surface-variant opacity-0 transition-all group-hover:opacity-100 hover:bg-danger/10 hover:text-danger"
                        type="button"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
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
