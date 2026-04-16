"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Link from "next/link";
import { Mail, Phone, Flame, Thermometer, Snowflake } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/format";
import type { LeadPublic } from "@/lib/services/interfaces/lead-service";

interface LeadCardProps {
  readonly lead: LeadPublic;
}

const TEMP_CONFIG = {
  hot: { icon: Flame, color: "text-danger", bg: "bg-danger/10" },
  warm: { icon: Thermometer, color: "text-warning", bg: "bg-warning/10" },
  cold: { icon: Snowflake, color: "text-on-surface-variant", bg: "bg-surface-container-high" },
} as const;

/**
 * Compact draggable card for a lead in the Kanban board.
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

  const temp = TEMP_CONFIG[lead.temperature];
  const TempIcon = temp.icon;

  return (
    <Link
      ref={setNodeRef}
      style={style}
      href={`/crm/${lead.id}`}
      {...attributes}
      {...listeners}
      onClick={(e) => {
        if (isDragging) e.preventDefault();
      }}
      draggable={false}
      className={cn(
        "group block rounded-xl bg-surface-container-lowest p-3.5 transition-all duration-150",
        "hover:shadow-ambient cursor-grab active:cursor-grabbing",
        isDragging &&
          "z-50 rotate-[2deg] scale-[1.02] shadow-ambient-strong opacity-90",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="min-w-0 flex-1 truncate text-[13px] font-semibold text-on-surface">
          {lead.name}
        </p>
        <div className="flex shrink-0 items-center gap-1.5">
          <div className={cn("flex h-5 w-5 items-center justify-center rounded-full", temp.bg)}>
            <TempIcon className={cn("h-3 w-3", temp.color)} />
          </div>
          <span className="text-[11px] text-on-surface-variant">
            {formatRelativeTime(lead.updatedAt)}
          </span>
        </div>
      </div>

      <div className="mt-2 space-y-1">
        {lead.email && (
          <div className="flex items-center gap-1.5">
            <Mail className="h-3 w-3 shrink-0 text-on-surface-variant" />
            <span className="truncate text-[12px] text-on-surface-variant">
              {lead.email}
            </span>
          </div>
        )}
        {lead.phone && (
          <div className="flex items-center gap-1.5">
            <Phone className="h-3 w-3 shrink-0 text-on-surface-variant" />
            <span className="truncate text-[12px] text-on-surface-variant">
              {lead.phone}
            </span>
          </div>
        )}
        {lead.channel && (
          <span className="inline-block rounded-md bg-surface-container-high px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-on-surface-variant">
            {lead.channel}
          </span>
        )}
      </div>
    </Link>
  );
}
