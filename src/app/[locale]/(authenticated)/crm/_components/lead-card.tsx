"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import { Tooltip } from "@/components/ui/tooltip";
import type {
  LeadBoardItem,
  LeadStatus,
  LeadTemperature,
} from "@/lib/services/interfaces/lead-service";
import { ChannelBadge } from "./channel-badge";
import { LeadCustomFieldsInline } from "./lead-custom-fields-inline";
import { LeadMessagePreview } from "./lead-message-preview";
import { TagChips } from "./tag-chips";

interface LeadCardProps {
  readonly lead: LeadBoardItem;
}

const STALE_THRESHOLD_DAYS = 7;
const TERMINAL_STATUSES: readonly LeadStatus[] = ["converted", "lost"];

const TEMP_BORDER: Record<LeadTemperature, string> = {
  hot: "before:bg-danger",
  warm: "before:bg-warning",
  cold: "before:bg-[#3b82f6]",
};

function daysSince(iso: string): number {
  const diff = Date.now() - new Date(iso).getTime();
  return Math.floor(diff / 86_400_000);
}

function isStale(lead: LeadBoardItem): boolean {
  if (TERMINAL_STATUSES.includes(lead.status)) return false;
  return daysSince(lead.updatedAt) >= STALE_THRESHOLD_DAYS;
}

/**
 * Rich draggable card for a lead on the Kanban board.
 *
 * Layout (top → bottom):
 * 1. Avatar + name + channel icon
 * 2. Last message preview (truncated + relative timestamp)
 * 3. Tag chips (up to 3 + overflow counter)
 * 4. Inline custom fields (up to 2, formatted per type)
 *
 * A colored left border encodes temperature. A floating danger badge marks
 * stale leads (no activity > 7 days, non-terminal statuses only).
 */
export function LeadCard({ lead }: LeadCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: lead.id, data: { lead } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const stale = isStale(lead);

  return (
    <Link
      ref={setNodeRef}
      style={style}
      href={`/leads/${lead.id}`}
      {...attributes}
      {...listeners}
      onClick={(e) => {
        if (isDragging) e.preventDefault();
      }}
      draggable={false}
      className={cn(
        "group relative block overflow-hidden rounded-xl bg-surface-container-lowest p-3.5 pl-4 transition-all duration-200",
        "before:absolute before:left-0 before:top-0 before:bottom-0 before:w-[3px]",
        TEMP_BORDER[lead.temperature],
        "cursor-grab hover:bg-surface-container-low active:cursor-grabbing",
        stale && "ring-1 ring-danger/30",
        isDragging &&
          "z-50 rotate-[2deg] scale-[1.02] shadow-ambient-strong opacity-90",
      )}
    >
      {stale && (
        <Tooltip content={`Sem atividade há ${daysSince(lead.updatedAt)} dias`}>
          <span
            aria-label={`Parado há ${daysSince(lead.updatedAt)} dias`}
            className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-danger text-white shadow-ambient"
          >
            <AlertCircle className="h-2.5 w-2.5" />
          </span>
        </Tooltip>
      )}

      <div className="flex items-start gap-2.5">
        <Avatar
          className="sm:h-10 sm:w-10"
          id={lead.id}
          name={lead.name}
          size={36}
          src={lead.avatarUrl}
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className="min-w-0 flex-1 truncate text-[13px] font-semibold text-on-surface">
              {lead.name}
            </p>
            {lead.channel && <ChannelBadge channel={lead.channel} />}
          </div>
          {lead.lastMessage && (
            <div className="mt-0.5">
              <LeadMessagePreview message={lead.lastMessage} />
            </div>
          )}
        </div>
      </div>

      {(lead.tags.length > 0 || lead.customFields.length > 0) && (
        <div className="mt-2.5 space-y-1.5">
          {lead.tags.length > 0 && <TagChips tags={lead.tags} />}
          {lead.customFields.length > 0 && (
            <LeadCustomFieldsInline fields={lead.customFields} />
          )}
        </div>
      )}
    </Link>
  );
}
