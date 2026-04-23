"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  ArrowLeft,
  ChevronUp,
  Clock,
  Flame,
  MoreVertical,
  Bot,
  UserRound,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { API_URL } from "@/lib/env";
import { formatTime } from "@/lib/format";
import { Avatar } from "@/components/ui/avatar";
import { WsManager } from "@/lib/ws-manager";
import type { WsState } from "@/lib/ws-manager";
import {
  loadMoreMessages,
  getWsToken,
} from "../actions";
import { ChatInput } from "./chat-input";
import type { ChatMessage } from "@/lib/services/interfaces/chat-service";

/* ---------- Agent visual config ---------- */

type AgentKey = "horos" | "kairos" | "human";

interface AgentVisual {
  readonly bg: string;
  readonly text: string;
  readonly label: string;
  readonly icon: typeof Clock;
  readonly badgeBg: string;
  readonly badgeText: string;
  readonly bubbleBg: string;
}

function getAgentVisual(
  agent: string,
  t: ReturnType<typeof useTranslations>,
  operatorName?: string | null,
): AgentVisual {
  switch (agent) {
    case "horos":
      return {
        bg: "bg-teal/10",
        text: "text-teal",
        label: t("agents.horos"),
        icon: Clock,
        badgeBg: "bg-secondary-container",
        badgeText: "text-on-secondary-container",
        bubbleBg: "bg-teal/8",
      };
    case "kairos":
      return {
        bg: "bg-primary/10",
        text: "text-primary",
        label: t("agents.kairos"),
        icon: Zap,
        badgeBg: "bg-primary-container",
        badgeText: "text-primary",
        bubbleBg: "bg-primary/8",
      };
    // "user" is the backend sender tag for a human operator reply —
    // the optimistic bubble uses "human" locally before the WS echo,
    // so both map to the same visual. Show the logged-in operator's
    // name when we have it; fall back to a generic "Humano" label.
    case "human":
    case "user":
      return {
        bg: "bg-[#8b5cf6]/10",
        text: "text-[#8b5cf6]",
        label: operatorName?.trim() || t("agents.human"),
        icon: UserRound,
        badgeBg: "bg-[#E9D5FF]",
        badgeText: "text-[#6B21A8]",
        bubbleBg: "bg-[#8b5cf6]/8",
      };
    default:
      return {
        bg: "bg-on-surface-variant/10",
        text: "text-on-surface-variant",
        label: agent,
        icon: Flame,
        badgeBg: "bg-surface-container-high",
        badgeText: "text-on-surface-variant",
        bubbleBg: "bg-surface-container-high/50",
      };
  }
}

/* ---------- Component ---------- */

interface MessageThreadProps {
  readonly chatId: string;
  readonly leadId: string | null;
  readonly leadName: string | null;
  readonly leadAvatarUrl: string | null;
  readonly operatorName: string | null;
  readonly agent: string;
  readonly initialMessages: ChatMessage[];
  readonly initialCursor: {
    readonly nextCursor: string | null;
    readonly hasMore: boolean;
  };
  readonly initialHandoff: boolean;
}

export function MessageThread({
  chatId,
  leadId,
  leadName,
  leadAvatarUrl,
  operatorName,
  agent,
  initialMessages,
  initialCursor,
  initialHandoff,
}: MessageThreadProps) {
  const t = useTranslations("conversations");
  const tc = useTranslations("common");

  const [messages, setMessages] = useState(initialMessages);
  const [cursor, setCursor] = useState<string | null>(initialCursor.nextCursor);
  const [hasMore, setHasMore] = useState(initialCursor.hasMore);
  const [isLoadingMore, startLoadMore] = useTransition();
  const [handoff, setHandoff] = useState(initialHandoff);
  const [wsState, setWsState] = useState<WsState>("disconnected");

  const scrollRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WsManager | null>(null);
  const activeAgent = handoff ? "human" : agent;
  const agentVisual = getAgentVisual(activeAgent, t, operatorName);
  const aiVisual = getAgentVisual(agent, t);

  /* -- Scroll helpers -- */
  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    });
  }, []);

  // Scroll whenever a new message lands at the tail (optimistic send, WS
  // inbound, etc.). Load-more prepends to the head so the last id stays
  // the same and this effect doesn't fire — preserving the reader's
  // scroll position during history pagination.
  const lastMessageId = messages[messages.length - 1]?.id;
  useEffect(() => {
    scrollToBottom();
  }, [lastMessageId, scrollToBottom]);

  /* -- WebSocket connection -- */
  useEffect(() => {
    let canceled = false;

    async function connect() {
      const token = await getWsToken();
      if (!token || canceled) return;

      const wsUrl = API_URL.replace(/^http/, "ws") + "/ws";

      const manager = new WsManager({
        url: wsUrl,
        token,
        onMessage: (message) => {
          if (message.chatId !== chatId) return;
          setMessages((prev) => {
            if (prev.some((m) => m.id === message.id)) return prev;
            // Human sends are echoed back with sender="user" and a fresh
            // backend id. Match an optimistic "human" bubble by content
            // within a short window and swap it in place, so the user
            // doesn't see the same message twice.
            if (message.sender === "user") {
              const arrivedAt = new Date(message.createdAt).getTime();
              const idx = prev.findIndex(
                (m) =>
                  m.sender === "human" &&
                  m.content === message.content &&
                  Math.abs(new Date(m.createdAt).getTime() - arrivedAt) < 30_000,
              );
              if (idx !== -1) {
                const next = [...prev];
                next[idx] = message;
                return next;
              }
            }
            return [...prev, message];
          });
          scrollToBottom();
        },
        onStateChange: (state) => {
          if (!canceled) setWsState(state);
        },
      });

      wsRef.current = manager;
      manager.connect();
    }

    connect();

    return () => {
      canceled = true;
      wsRef.current?.disconnect();
      wsRef.current = null;
    };
  }, [chatId, scrollToBottom]);

  /* -- Load more (cursor-based) -- */
  const handleLoadMore = useCallback(() => {
    if (!hasMore || !cursor) return;

    const container = scrollRef.current;
    const prevScrollHeight = container?.scrollHeight ?? 0;

    startLoadMore(async () => {
      const result = await loadMoreMessages(chatId, cursor);
      if (result.success && result.data) {
        setMessages((prev) => [...result.data!, ...prev]);
        setCursor(result.nextCursor ?? null);
        setHasMore(result.hasMore ?? false);

        requestAnimationFrame(() => {
          if (container) {
            container.scrollTop = container.scrollHeight - prevScrollHeight;
          }
        });
      }
    });
  }, [cursor, hasMore, chatId]);

  /* -- Optimistic message -- */
  const handleMessageSent = useCallback(
    (optimistic: ChatMessage) => {
      setMessages((prev) => [...prev, optimistic]);
      scrollToBottom();
    },
    [scrollToBottom],
  );

  const handleMessageFailed = useCallback((messageId: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== messageId));
  }, []);

  const handleHandoffChange = useCallback((active: boolean) => {
    setHandoff(active);
  }, []);

  return (
    <div className="flex h-full flex-col">
      {/* ── Header ────────────────────────────────────────── */}
      <header className="flex h-20 shrink-0 items-center justify-between bg-surface/80 px-8 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <Link href="/conversations" className="lg:hidden">
            <button className="rounded-lg p-2 text-on-surface-variant transition-colors hover:bg-surface-container-high" type="button">
              <ArrowLeft className="h-4 w-4" />
            </button>
          </Link>

          {/* Lead avatar */}
          <Avatar
            className="border-2 border-primary-container"
            id={leadId ?? chatId}
            name={leadName ?? "?"}
            size={44}
            src={leadAvatarUrl}
          />

          {/* Name + agent */}
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold leading-tight text-on-surface">
                {leadName ?? t("unknown")}
              </h2>
              <span className="flex items-center gap-1 rounded-full bg-secondary-container/30 px-2 py-0.5 text-[10px] font-bold uppercase tracking-tighter text-on-secondary-container">
                <span className="h-1.5 w-1.5 rounded-full bg-secondary" />
                {t("status.active")}
              </span>
            </div>
            <div className="mt-0.5 flex items-center gap-2">
              <span className="text-[11px] font-medium text-on-surface-variant">
                Agente:
              </span>
              <span className={cn("rounded px-2 py-0.5 text-[10px] font-semibold uppercase", agentVisual.badgeBg, agentVisual.badgeText)}>
                {agentVisual.label}
              </span>
            </div>
          </div>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-3">
          <button className="rounded-xl p-2.5 text-on-surface-variant transition-colors hover:bg-surface-container-low" type="button">
            <MoreVertical className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* Reconnecting */}
      {wsState === "reconnecting" && (
        <div className="flex items-center justify-center gap-2 bg-warning-muted px-4 py-1.5 text-xs font-medium text-warning">
          <span className="h-2 w-2 animate-pulse rounded-full bg-warning" />
          {t("reconnecting")}
        </div>
      )}

      {/* ── Messages ──────────────────────────────────────── */}
      <section ref={scrollRef} className="flex-1 overflow-y-auto bg-surface">
        <div className="mx-auto max-w-3xl space-y-8 px-8 py-8 2xl:max-w-4xl">
          {/* Load more */}
          {hasMore && (
            <div className="flex justify-center">
              <button
                className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-medium text-on-surface-variant transition-colors hover:bg-surface-container-high"
                disabled={isLoadingMore}
                onClick={handleLoadMore}
                type="button"
              >
                {isLoadingMore ? (
                  <span className="flex items-center gap-1.5">
                    <span className="h-3 w-3 animate-spin rounded-full border-2 border-on-surface-variant/30 border-t-on-surface-variant" />
                    {tc("loading")}
                  </span>
                ) : (
                  <>
                    <ChevronUp className="h-3.5 w-3.5" />
                    {t("loadMoreMessages")}
                  </>
                )}
              </button>
            </div>
          )}

          {/* Bubbles */}
          {messages.map((message) => {
            const isAssistant = message.sender !== "lead";
            const msgVisual = getAgentVisual(
              isAssistant ? message.sender : "lead",
              t,
              operatorName,
            );

            // Split on [BREAK] for multi-bubble messages
            const parts = message.content
              .split(/\[BREAK\]/i)
              .map((p) => p.trim())
              .filter(Boolean);

            if (!isAssistant) {
              // Lead message — LEFT side
              return (
                <div className="flex items-start gap-3" key={message.id} style={{ maxWidth: "70%" }}>
                  <Avatar
                    id={leadId ?? chatId}
                    name={leadName ?? "?"}
                    size={32}
                    src={leadAvatarUrl}
                  />
                  <div className="space-y-1.5">
                    {parts.map((part, i) => (
                      <div
                        className={cn(
                          "rounded-2xl border border-surface-container-high bg-surface-container-lowest p-4 text-sm leading-relaxed text-on-surface shadow-sm",
                          i === 0 && "rounded-tl-none",
                        )}
                        key={i}
                      >
                        <p className="whitespace-pre-wrap">{part}</p>
                      </div>
                    ))}
                    <span className="ml-1 text-[10px] text-on-surface-variant">
                      {formatTime(message.createdAt, "pt-BR")}
                    </span>
                  </div>
                </div>
              );
            }

            // Assistant/Agent message — RIGHT side
            return (
              <div className="ml-auto flex flex-row-reverse items-start gap-3" key={message.id} style={{ maxWidth: "70%" }}>
                <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg shadow-sm", msgVisual.bg, msgVisual.text)}>
                  <Bot className="h-4 w-4" />
                </div>
                <div className="flex flex-col items-end space-y-1.5">
                  {parts.map((part, i) => (
                    <div
                      className={cn(
                        "rounded-2xl p-4 text-sm leading-relaxed text-on-surface",
                        msgVisual.bubbleBg,
                        i === 0 && "rounded-tr-none",
                      )}
                      key={i}
                    >
                      <p className="whitespace-pre-wrap">{part}</p>
                    </div>
                  ))}
                  <span className="mr-1 text-[10px] text-on-surface-variant">
                    {formatTime(message.createdAt, "pt-BR")} • {msgVisual.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Input ─────────────────────────────────────────── */}
      <ChatInput
        chatId={chatId}
        agent={agent}
        handoff={handoff}
        onHandoffChange={handleHandoffChange}
        onMessageSent={handleMessageSent}
        onMessageFailed={handleMessageFailed}
      />
    </div>
  );
}
