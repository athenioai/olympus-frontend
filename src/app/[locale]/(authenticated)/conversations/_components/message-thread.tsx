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
  Calendar,
  ChevronUp,
  Clock,
  Flame,
  UserRound,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatDate, formatTime } from "@/lib/format";
import { WsManager } from "@/lib/ws-manager";
import type { WsState } from "@/lib/ws-manager";
import {
  loadMoreMessages,
  getWsToken,
} from "../actions";
import { ChatInput } from "./chat-input";
import type { ChatMessage, Pagination } from "@/lib/services/interfaces/chat-service";

/* ---------- Agent visual config ---------- */

type AgentKey = "horos" | "kairos" | "human";

interface AgentVisual {
  readonly bgLight: string;
  readonly bgBubble: string;
  readonly text: string;
  readonly label: string;
  readonly icon: typeof Clock;
}

function getAgentVisual(agent: string, t: ReturnType<typeof useTranslations>): AgentVisual {
  switch (agent) {
    case "horos":
      return {
        bgLight: "bg-teal/10",
        bgBubble: "bg-teal/[0.06]",
        text: "text-teal",
        label: t("agents.horos"),
        icon: Clock,
      };
    case "kairos":
      return {
        bgLight: "bg-primary/10",
        bgBubble: "bg-primary/[0.06]",
        text: "text-primary",
        label: t("agents.kairos"),
        icon: Zap,
      };
    case "human":
      return {
        bgLight: "bg-[#8b5cf6]/10",
        bgBubble: "bg-[#8b5cf6]/[0.06]",
        text: "text-[#8b5cf6]",
        label: t("agents.human"),
        icon: UserRound,
      };
    default:
      return {
        bgLight: "bg-on-surface-variant/10",
        bgBubble: "bg-on-surface-variant/[0.06]",
        text: "text-on-surface-variant",
        label: agent,
        icon: Flame,
      };
  }
}

/* ---------- Component ---------- */

interface MessageThreadProps {
  readonly sessionId: string;
  readonly leadName: string | null;
  readonly agent: string;
  readonly initialMessages: ChatMessage[];
  readonly initialPagination: Pagination;
  readonly initialHandoff: boolean;
}

export function MessageThread({
  sessionId,
  leadName,
  agent,
  initialMessages,
  initialPagination,
  initialHandoff,
}: MessageThreadProps) {
  const t = useTranslations("conversations");
  const tc = useTranslations("common");

  const [messages, setMessages] = useState(initialMessages);
  const [currentPage, setCurrentPage] = useState(initialPagination.page);
  const [isLoadingMore, startLoadMore] = useTransition();
  const [handoff, setHandoff] = useState(initialHandoff);
  const [wsState, setWsState] = useState<WsState>("disconnected");

  const scrollRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WsManager | null>(null);

  const hasMore = currentPage > 1;
  const activeAgent = handoff ? "human" : agent;
  const agentVisual = getAgentVisual(activeAgent, t);
  const aiVisual = getAgentVisual(agent, t);
  const AgentIcon = agentVisual.icon;

  /* -- Scroll helpers -- */
  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    });
  }, []);

  /* -- Scroll to bottom on mount -- */
  useEffect(() => {
    scrollToBottom();
  }, [scrollToBottom]);

  /* -- WebSocket connection -- */
  useEffect(() => {
    let canceled = false;

    async function connect() {
      const token = await getWsToken();
      if (!token || canceled) return;

      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
      const wsUrl = apiUrl.replace(/^http/, "ws") + "/ws";

      const manager = new WsManager({
        url: wsUrl,
        token,
        onMessage: (message) => {
          if (message.sessionId === sessionId) {
            setMessages((prev) => {
              if (prev.some((m) => m.id === message.id)) return prev;
              return [...prev, message];
            });
            scrollToBottom();
          }
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
  }, [sessionId, scrollToBottom]);

  /* -- Load more messages -- */
  const handleLoadMore = useCallback(() => {
    const prevPage = currentPage - 1;
    if (prevPage < 1) return;

    const container = scrollRef.current;
    const prevScrollHeight = container?.scrollHeight ?? 0;

    startLoadMore(async () => {
      const result = await loadMoreMessages(sessionId, prevPage);
      if (result.success && result.data) {
        setMessages((prev) => [...result.data!, ...prev]);
        setCurrentPage(prevPage);

        requestAnimationFrame(() => {
          if (container) {
            container.scrollTop =
              container.scrollHeight - prevScrollHeight;
          }
        });
      }
    });
  }, [currentPage, sessionId]);

  /* -- Optimistic message add -- */
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

  /* -- Handoff state change -- */
  const handleHandoffChange = useCallback((active: boolean) => {
    setHandoff(active);
  }, []);

  /* -- Date header helper -- */
  const startDate =
    messages.length > 0 ? formatDate(messages[0].createdAt, "en-US") : "";

  return (
    <div className="flex h-full flex-col">
      {/* Header bar */}
      <header className="flex shrink-0 items-center gap-3 bg-surface/80 px-6 py-4 backdrop-blur-xl">
        <Link href="/conversations" className="lg:hidden">
          <Button variant="ghost" size="icon-sm">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>

        {/* Lead name */}
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-full",
              agentVisual.bgLight,
              agentVisual.text,
            )}
          >
            <AgentIcon className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-on-surface leading-tight">
              {leadName ?? t("unknown")}
            </h2>
            <span
              className={cn(
                "inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider",
                agentVisual.text,
              )}
            >
              <AgentIcon className="h-3 w-3" />
              {agentVisual.label}
            </span>
          </div>
        </div>

        {/* Start date */}
        {startDate && (
          <span className="ml-auto text-xs text-on-surface-variant">
            {t("startedAt", { date: startDate })}
          </span>
        )}
      </header>

      {/* Reconnecting indicator */}
      {wsState === "reconnecting" && (
        <div className="flex items-center justify-center gap-2 bg-warning-muted px-4 py-1.5 text-xs font-medium text-warning">
          <span className="h-2 w-2 animate-pulse rounded-full bg-warning" />
          {t("reconnecting")}
        </div>
      )}

      {/* Messages — scrollable */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl px-6 py-6 2xl:max-w-4xl">
          {/* Load more button */}
          {hasMore && (
            <div className="mb-6 flex justify-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLoadMore}
                disabled={isLoadingMore}
                className="text-on-surface-variant"
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
              </Button>
            </div>
          )}

          {/* Message bubbles */}
          <div className="space-y-4">
            {messages.map((message) => {
              const isAssistant = message.role === "assistant";
              const msgVisual = getAgentVisual(
                isAssistant ? message.agent : "lead",
                t,
              );
              const MsgIcon = msgVisual.icon;

              return (
                <div
                  key={message.id}
                  className={cn(
                    "flex",
                    isAssistant ? "justify-start" : "justify-end",
                  )}
                >
                  {/* Assistant avatar */}
                  {isAssistant && (
                    <div
                      className={cn(
                        "mr-3 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                        msgVisual.bgLight,
                        msgVisual.text,
                      )}
                    >
                      <MsgIcon className="h-4 w-4" />
                    </div>
                  )}

                  <div
                    className={cn(
                      "max-w-[70%] space-y-1",
                      !isAssistant && "flex flex-col items-end",
                    )}
                  >
                    <div
                      className={cn(
                        "px-4 py-3 text-sm leading-relaxed text-on-surface",
                        isAssistant
                          ? "rounded-2xl rounded-tl-none bg-surface-container-lowest ghost-border"
                          : "rounded-2xl rounded-tr-none bg-primary/8",
                      )}
                    >
                      {/* Sender label */}
                      {isAssistant && (
                        <p
                          className={cn(
                            "mb-1 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider",
                            msgVisual.text,
                          )}
                        >
                          <MsgIcon className="h-2.5 w-2.5" />
                          {msgVisual.label}
                        </p>
                      )}

                      <p className="whitespace-pre-wrap">{message.content}</p>

                      {/* Appointment badge */}
                      {message.appointmentId && (
                        <div className="mt-2.5 inline-flex items-center gap-1.5 rounded-lg bg-success/10 px-2.5 py-1.5">
                          <Calendar className="h-3 w-3 text-success" />
                          <span className="text-[11px] font-medium text-success">
                            {t("appointmentCreated")}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Timestamp */}
                    <span className="text-[10px] text-on-surface-variant/60">
                      {formatTime(message.createdAt, "en-US")}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Input bar */}
      <ChatInput
        sessionId={sessionId}
        agent={agent}
        handoff={handoff}
        onHandoffChange={handleHandoffChange}
        onMessageSent={handleMessageSent}
        onMessageFailed={handleMessageFailed}
      />
    </div>
  );
}
