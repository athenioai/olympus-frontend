"use client";

import { formatRelativeTime } from "@/lib/format";
import { truncate } from "@/lib/truncate";
import type { LeadLastMessage } from "@/lib/services/interfaces/lead-service";

const PREVIEW_MAX = 60;

/**
 * Single-line preview of the lead's latest message.
 *
 * - Lead-sent messages render without a prefix (they're the norm).
 * - Agent/user/system messages show the sender name as a muted prefix,
 *   so the user can see "who said this last" at a glance.
 */
export function LeadMessagePreview({
  message,
}: {
  readonly message: LeadLastMessage;
}) {
  const isLead = message.sender === "lead";
  const prefix = isLead ? null : senderLabel(message.sender);

  return (
    <div className="flex items-baseline gap-2 text-[12px] leading-snug text-on-surface-variant">
      <p className="min-w-0 flex-1 truncate">
        {prefix && (
          <span className="text-on-surface-variant/70">{prefix}: </span>
        )}
        {truncate(message.content, PREVIEW_MAX)}
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
