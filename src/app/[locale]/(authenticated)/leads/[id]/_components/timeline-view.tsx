"use client";

import { motion } from "motion/react";
import {
  MessageSquare,
  Calendar,
  ArrowRight,
  Bot,
  Clock,
  UserRound,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { DURATION, EASING } from "@/lib/motion";
import { formatDate, formatTime } from "@/lib/format";
import type {
  TimelineEntry,
  TimelineEntryType,
  TimelineMessage,
  TimelineAppointment,
  TimelineStatusChange,
} from "@/lib/services/interfaces/lead-service";

interface TimelineViewProps {
  readonly entries: readonly TimelineEntry[];
}

/**
 * Renders a vertical timeline of lead events: messages, appointments, status changes.
 */
export function TimelineView({ entries }: TimelineViewProps) {
  const t = useTranslations("crm");

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-container-high">
          <Clock className="h-6 w-6 text-on-surface-variant/50" />
        </div>
        <p className="mt-3 font-display text-sm font-semibold text-on-surface-variant">
          {t("timeline")}
        </p>
      </div>
    );
  }

  return (
    <div className="relative space-y-0">
      {/* Vertical line */}
      <div className="absolute left-[15px] top-2 bottom-2 w-px bg-surface-container-high" />

      {entries.map((entry, idx) => (
        <motion.div
          key={`${entry.type}-${entry.timestamp}-${idx}`}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{
            duration: DURATION.fast,
            delay: Math.min(idx * 0.03, 0.3),
            ease: EASING.out,
          }}
          className="relative flex gap-3 py-2"
        >
          <TimelineIcon type={entry.type} />
          <div className="min-w-0 flex-1 pt-0.5">
            <TimelineContent entry={entry} />
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function TimelineIcon({ type }: { readonly type: TimelineEntryType }) {
  const config = {
    message: { icon: MessageSquare, bg: "bg-teal/10", color: "text-teal" },
    appointment: {
      icon: Calendar,
      bg: "bg-[#8b5cf6]/10",
      color: "text-[#8b5cf6]",
    },
    status_change: {
      icon: ArrowRight,
      bg: "bg-primary/10",
      color: "text-primary",
    },
  }[type];

  const Icon = config.icon;

  return (
    <div
      className={cn(
        "relative z-10 flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full",
        config.bg,
      )}
    >
      <Icon className={cn("h-3.5 w-3.5", config.color)} />
    </div>
  );
}

function TimelineContent({
  entry,
}: {
  readonly entry: TimelineEntry;
}) {
  switch (entry.type) {
    case "message":
      return <MessageEntry data={entry.data as TimelineMessage} />;
    case "appointment":
      return <AppointmentEntry data={entry.data as TimelineAppointment} />;
    case "status_change":
      return <StatusChangeEntry data={entry.data as TimelineStatusChange} />;
  }
}

function MessageEntry({ data }: { readonly data: TimelineMessage }) {
  const isLead = data.role === "lead";
  const agentLabel =
    data.agent === "human"
      ? "Humano"
      : data.agent.charAt(0).toUpperCase() + data.agent.slice(1);

  return (
    <div className="rounded-xl bg-surface-container-low p-3">
      <div className="flex items-center gap-2">
        {isLead ? (
          <UserRound className="h-3 w-3 text-on-surface-variant" />
        ) : (
          <Bot className="h-3 w-3 text-teal" />
        )}
        <span className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">
          {isLead ? "Lead" : agentLabel}
        </span>
        <span className="text-[11px] text-on-surface-variant">
          {formatTime(data.created_at, "pt-BR")}
        </span>
      </div>
      <p className="mt-1.5 text-[13px] leading-relaxed text-on-surface-variant">
        {data.content}
      </p>
    </div>
  );
}

function AppointmentEntry({
  data,
}: {
  readonly data: TimelineAppointment;
}) {
  const t = useTranslations("calendar");
  const isCancelled = data.status === "cancelled";

  return (
    <div
      className={cn(
        "rounded-xl p-3",
        isCancelled
          ? "bg-danger-muted"
          : "bg-[#8b5cf6]/[0.04]",
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-medium text-on-surface">
          {data.service_type}
        </span>
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-[11px] font-medium",
            isCancelled
              ? "bg-danger/10 text-danger"
              : "bg-success/10 text-success",
          )}
        >
          {isCancelled ? t("status.cancelled") : t("status.confirmed")}
        </span>
      </div>
      <p className="mt-1 text-[12px] text-on-surface-variant">
        {formatDate(data.date, "pt-BR")} &middot; {data.start_time} -{" "}
        {data.end_time}
      </p>
    </div>
  );
}

function StatusChangeEntry({
  data,
}: {
  readonly data: TimelineStatusChange;
}) {
  const t = useTranslations("crm");

  const getStatusLabel = (status: string) => {
    const keys = [
      "new",
      "contacted",
      "qualified",
      "converted",
      "lost",
    ] as const;
    type StageKey = (typeof keys)[number];
    if (keys.includes(status as StageKey)) {
      return t(`stages.${status as StageKey}`);
    }
    return status;
  };

  return (
    <div className="flex items-center gap-2 py-1">
      <span className="rounded-full bg-surface-container-high px-2.5 py-1 text-[12px] font-medium text-on-surface-variant">
        {getStatusLabel(data.old_status)}
      </span>
      <ArrowRight className="h-3 w-3 text-on-surface-variant" />
      <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[12px] font-medium text-primary">
        {getStatusLabel(data.new_status)}
      </span>
      <span className="ml-auto text-[11px] text-on-surface-variant">
        {formatTime(data.changed_at, "pt-BR")}
      </span>
    </div>
  );
}
