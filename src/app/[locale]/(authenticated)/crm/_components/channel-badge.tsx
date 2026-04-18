"use client";

import { MessageCircle, Send } from "lucide-react";
import type { LeadChannel } from "@/lib/services/interfaces/lead-service";

const CONFIG = {
  whatsapp: { icon: MessageCircle, label: "WhatsApp", color: "text-[#25D366]" },
  telegram: { icon: Send, label: "Telegram", color: "text-[#26A5E4]" },
} as const;

/**
 * Tiny channel indicator — shows a brand-colored icon for WhatsApp/Telegram.
 * Returns null for leads without a channel.
 */
export function ChannelBadge({ channel }: { readonly channel: LeadChannel }) {
  if (!channel) return null;
  const cfg = CONFIG[channel];
  const Icon = cfg.icon;
  return (
    <span className={cfg.color} title={cfg.label}>
      <Icon className="h-3.5 w-3.5" />
    </span>
  );
}
