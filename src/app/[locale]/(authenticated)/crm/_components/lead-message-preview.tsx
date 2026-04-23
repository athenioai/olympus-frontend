"use client";

import { formatRelativeTime } from "@/lib/format";
import { truncate } from "@/lib/truncate";
import type { LeadLastMessage } from "@/lib/services/interfaces/lead-service";

const PREVIEW_MAX = 60;

// Patterns that indicate the backend leaked a raw exception/HTTP error into
// the system message stream (e.g. "Unexpected error response (HTTP 400)").
// QA flagged these literals showing up on kanban cards — until the backend
// stops persisting them, we surface a friendly placeholder instead.
const TECHNICAL_ERROR_RE =
  /(?:^|\b)(?:unexpected\s+error|http\s+[45]\d{2}|traceback|exception\b|stack\s*trace|internal\s+server\s+error|error\s*:\s*)/i;

function isTechnicalError(content: string): boolean {
  return TECHNICAL_ERROR_RE.test(content);
}

/**
 * Single-line preview of the lead's latest message.
 *
 * - Lead-sent messages render without a prefix (they're the norm).
 * - Agent/user/system messages show the sender name as a muted prefix,
 *   so the user can see "who said this last" at a glance.
 * - System messages containing raw backend errors are replaced with a
 *   friendly fallback so internal stack details don't leak to users.
 */
export function LeadMessagePreview({
  message,
}: {
  readonly message: LeadLastMessage;
}) {
  const isLead = message.sender === "lead";
  const prefix = isLead ? null : senderLabel(message.sender);
  const isSystemError =
    message.sender === "system" && isTechnicalError(message.content);
  const content = isSystemError
    ? "Falha interna do agente"
    : truncate(message.content, PREVIEW_MAX);

  return (
    <div className="flex items-baseline gap-2 text-[12px] leading-snug text-on-surface-variant">
      <p className="min-w-0 flex-1 truncate">
        {prefix && (
          <span className="text-on-surface-variant/70">{prefix}: </span>
        )}
        {content}
      </p>
      <span
        className="shrink-0 text-[11px] tabular-nums text-on-surface-variant/70"
        title={message.createdAt}
      >
        {formatRelativeTime(message.createdAt)}
      </span>
    </div>
  );
}

function senderLabel(sender: string): string {
  if (sender === "user") return "Você";
  if (sender === "system") return "Sistema";
  return sender; // branded agent name like "Luna"
}
