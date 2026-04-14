"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Mail, Phone } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/format";
import type { LeadPublic } from "@/lib/services/interfaces/lead-service";

interface LeadCardProps {
  readonly lead: LeadPublic;
}

/**
 * Compact draggable card for a lead in the Kanban board.
 * Shows name, email, relative time, and optional phone icon.
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

  return (
    <a
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
        <span className="shrink-0 text-[11px] text-on-surface-variant">
          {formatRelativeTime(lead.updated_at)}
        </span>
      </div>

      <div className="mt-2 space-y-1">
        <div className="flex items-center gap-1.5">
          <Mail className="h-3 w-3 shrink-0 text-on-surface-variant" />
          <span className="truncate text-[12px] text-on-surface-variant">
            {lead.email}
          </span>
        </div>
        {lead.phone && (
          <div className="flex items-center gap-1.5">
            <Phone className="h-3 w-3 shrink-0 text-on-surface-variant" />
            <span className="truncate text-[12px] text-on-surface-variant">
              {lead.phone}
            </span>
          </div>
        )}
      </div>
    </a>
  );
}
