"use client";

import { useCallback, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import {
  Clock,
  Flame,
  PlusCircle,
  SendHorizontal,
  Smile,
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
    case "horos": return Clock;
    case "kairos": return Zap;
    default: return Flame;
  }
}

function getAiLabel(agent: string, t: ReturnType<typeof useTranslations>) {
  switch (agent) {
    case "horos": return t("agents.horos");
    case "kairos": return t("agents.kairos");
    default: return agent;
  }
}

function getAiTextColor(agent: string) {
  switch (agent) {
    case "horos": return "text-teal";
    case "kairos": return "text-primary";
    default: return "text-on-surface-variant";
  }
}

/* ---------- Component ---------- */

interface ChatInputProps {
  readonly chatId: string;
  readonly agent: string;
  readonly handoff: boolean;
  readonly onHandoffChange: (active: boolean) => void;
  readonly onMessageSent: (message: ChatMessage) => void;
  readonly onMessageFailed: (messageId: string) => void;
}

export function ChatInput({
  chatId,
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
      chatId: chatId,
      sender: "human",
      content,
      createdAt: new Date().toISOString(),
      deletedAt: null,
    };

    setInputValue("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    onMessageSent(optimisticMessage);
    setIsSending(true);

    const result = await sendMessageToLead(chatId, content);
    setIsSending(false);

    if (!result.success) {
      onMessageFailed(optimisticMessage.id);
    }
  }

  async function handleTakeover() {
    const result = await activateHandoff(chatId);
    if (result.success) {
      onHandoffChange(true);
      requestAnimationFrame(() => textareaRef.current?.focus());
    }
  }

  async function handleReturn() {
    const result = await deactivateHandoff(chatId);
    if (result.success) {
      onHandoffChange(false);
    }
  }

  /* -- AI mode (handoff not active) -- */
  if (!handoff) {
    return (
      <footer className="shrink-0 border-t border-on-surface-variant/10 bg-surface-container-lowest p-6">
        <div className="mx-auto max-w-4xl">
          {/* Disabled input area */}
          <div className="flex items-end gap-3 opacity-50">
            <div className="flex flex-1 items-end rounded-2xl bg-surface-container-high p-2">
              <button className="p-2 text-on-surface-variant" disabled type="button">
                <PlusCircle className="h-5 w-5" />
              </button>
              <textarea
                className="flex-1 resize-none border-none bg-transparent py-2 text-sm text-on-surface outline-none placeholder:text-on-surface-variant/60 focus:ring-0"
                disabled
                placeholder={t("handoff.deactivated") + ". " + t("handoff.activate") + "..."}
                rows={1}
              />
              <button className="p-2 text-on-surface-variant" disabled type="button">
                <Smile className="h-5 w-5" />
              </button>
            </div>
            <button
              className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-container-high text-on-surface-variant"
              disabled
              type="button"
            >
              <SendHorizontal className="h-5 w-5" />
            </button>
          </div>

          {/* Handoff controls */}
          <div className="mt-4 flex items-center justify-between">
            <p className="text-[10px] font-medium uppercase tracking-[0.1em] text-on-surface-variant/60">
              {t("aiManaging", { agent: aiLabel })}
            </p>
            <button
              className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold uppercase tracking-wider text-primary transition-colors hover:bg-primary/8"
              onClick={handleTakeover}
              type="button"
            >
              {t("handoff.activate")}
              <div className="relative ml-1 h-5 w-10 rounded-full bg-surface-container-highest p-0.5">
                <div className="h-4 w-4 rounded-full bg-white shadow-sm" />
              </div>
            </button>
          </div>
        </div>
      </footer>
    );
  }

  /* -- Human mode (handoff active) -- */
  return (
    <footer className="shrink-0 border-t border-on-surface-variant/10 bg-surface-container-lowest p-6">
      <div className="mx-auto max-w-4xl">
        {/* Active input */}
        <div className="flex items-end gap-3">
          <div className="flex flex-1 items-end rounded-2xl bg-surface-container-high p-2">
            <button className="p-2 text-on-surface-variant transition-colors hover:text-on-surface" type="button">
              <PlusCircle className="h-5 w-5" />
            </button>
            <textarea
              ref={textareaRef}
              className="flex-1 resize-none border-none bg-transparent py-2 text-sm text-on-surface outline-none placeholder:text-on-surface-variant/60 focus:ring-0"
              onChange={handleTextareaInput}
              onKeyDown={handleKeyDown}
              placeholder={t("messagePlaceholder")}
              rows={1}
              style={{ maxHeight: 120 }}
              value={inputValue}
            />
            <button className="p-2 text-on-surface-variant transition-colors hover:text-on-surface" type="button">
              <Smile className="h-5 w-5" />
            </button>
          </div>
          <button
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-on-primary transition-all hover:brightness-110 disabled:opacity-25"
            disabled={!inputValue.trim() || isSending}
            onClick={handleSend}
            type="button"
          >
            <SendHorizontal className="h-5 w-5" />
          </button>
        </div>

        {/* Handoff controls */}
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold text-primary">
            <UserCheck className="h-4 w-4" />
            {t("youAreResponding")}
          </div>
          <button
            className={cn(
              "flex items-center gap-1.5 text-xs font-medium transition-colors hover:opacity-80",
              aiTextColor,
            )}
            onClick={handleReturn}
            type="button"
          >
            <AiIcon className="h-3.5 w-3.5" />
            {t("returnTo", { agent: aiLabel })}
          </button>
        </div>
      </div>
    </footer>
  );
}
