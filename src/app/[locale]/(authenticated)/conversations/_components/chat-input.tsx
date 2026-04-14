"use client";

import { useCallback, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import {
  Clock,
  Flame,
  SendHorizontal,
  UserCheck,
  UserRound,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  sendMessageToLead,
  activateHandoff,
  deactivateHandoff,
} from "../actions";
import type { ChatMessage } from "@/lib/services/interfaces/chat-service";

/* ---------- Agent helpers ---------- */

function getAiIcon(agent: string) {
  switch (agent) {
    case "horos":
      return Clock;
    case "kairos":
      return Zap;
    default:
      return Flame;
  }
}

function getAiLabel(agent: string, t: ReturnType<typeof useTranslations>) {
  switch (agent) {
    case "horos":
      return t("agents.horos");
    case "kairos":
      return t("agents.kairos");
    default:
      return agent;
  }
}

function getAiTextColor(agent: string) {
  switch (agent) {
    case "horos":
      return "text-teal";
    case "kairos":
      return "text-primary";
    default:
      return "text-on-surface-variant";
  }
}

/* ---------- Component ---------- */

interface ChatInputProps {
  readonly sessionId: string;
  readonly agent: string;
  readonly handoff: boolean;
  readonly onHandoffChange: (active: boolean) => void;
  readonly onMessageSent: (message: ChatMessage) => void;
  readonly onMessageFailed: (messageId: string) => void;
}

export function ChatInput({
  sessionId,
  agent,
  handoff,
  onHandoffChange,
  onMessageSent,
  onMessageFailed,
}: ChatInputProps) {
  const t = useTranslations("conversations");
  const [inputValue, setInputValue] = useState("");
  const [isSending, setIsSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const AiIcon = getAiIcon(agent);
  const aiLabel = getAiLabel(agent, t);
  const aiTextColor = getAiTextColor(agent);

  const handleTextareaInput = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setInputValue(e.target.value);
      const el = e.target;
      el.style.height = "auto";
      el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
    },
    [],
  );

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  async function handleSend() {
    const content = inputValue.trim();
    if (!content || isSending) return;

    const optimisticMessage: ChatMessage = {
      id: crypto.randomUUID(),
      sessionId,
      agent: "human",
      role: "assistant",
      content,
      appointmentId: null,
      createdAt: new Date().toISOString(),
    };

    setInputValue("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    onMessageSent(optimisticMessage);
    setIsSending(true);

    const result = await sendMessageToLead(sessionId, content);
    setIsSending(false);

    if (!result.success) {
      onMessageFailed(optimisticMessage.id);
    }
  }

  async function handleTakeover() {
    const result = await activateHandoff(sessionId);
    if (result.success) {
      onHandoffChange(true);
      requestAnimationFrame(() => textareaRef.current?.focus());
    }
  }

  async function handleReturn() {
    const result = await deactivateHandoff(sessionId);
    if (result.success) {
      onHandoffChange(false);
    }
  }

  /* -- AI mode (handoff not active) -- */
  if (!handoff) {
    return (
      <footer className="shrink-0 bg-surface-container-lowest">
        <div className="flex items-center justify-between px-6 py-4">
          <div
            className={cn(
              "flex items-center gap-2 text-sm font-medium",
              aiTextColor,
            )}
          >
            <AiIcon className="h-4 w-4" />
            <span>{t("responding", { agent: aiLabel })}</span>
          </div>
          <button
            onClick={handleTakeover}
            className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-medium text-primary ring-1 ring-primary/20 transition-all duration-200 hover:bg-primary/8 hover:ring-primary/40"
            type="button"
          >
            <UserRound className="h-4 w-4" />
            {t("takeOver")}
          </button>
        </div>
        <p className="pb-3 text-center text-[10px] font-medium uppercase tracking-[0.1em] text-on-surface-variant/60">
          {t("aiManaging", { agent: aiLabel })}
        </p>
      </footer>
    );
  }

  /* -- Human mode (handoff active) -- */
  return (
    <footer className="shrink-0 bg-surface-container-lowest">
      {/* Status strip */}
      <div className="flex items-center justify-between bg-primary/[0.04] px-6 py-2">
        <div className="flex items-center gap-2 text-sm font-semibold text-primary">
          <UserCheck className="h-4 w-4" />
          {t("youAreResponding")}
        </div>
        <button
          onClick={handleReturn}
          className={cn(
            "flex items-center gap-1.5 text-xs font-medium transition-colors hover:opacity-80",
            aiTextColor,
          )}
          type="button"
        >
          <AiIcon className="h-3.5 w-3.5" />
          {t("returnTo", { agent: aiLabel })}
        </button>
      </div>

      {/* Input area */}
      <div className="flex items-end gap-3 px-6 py-3">
        <textarea
          ref={textareaRef}
          value={inputValue}
          onChange={handleTextareaInput}
          onKeyDown={handleKeyDown}
          placeholder={t("messagePlaceholder")}
          rows={1}
          className="flex-1 resize-none rounded-2xl bg-surface-container-high px-4 py-3 text-sm leading-relaxed text-on-surface outline-none placeholder:text-on-surface-variant/60 transition-all focus:ring-1 focus:ring-primary/25 focus:bg-surface-container-lowest"
          style={{ maxHeight: 120 }}
        />
        <button
          onClick={handleSend}
          disabled={!inputValue.trim() || isSending}
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-on-primary transition-all duration-150 hover:brightness-110 disabled:opacity-25 disabled:hover:brightness-100"
          type="button"
        >
          <SendHorizontal className="h-4 w-4" />
        </button>
      </div>
    </footer>
  );
}
