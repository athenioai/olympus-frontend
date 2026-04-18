"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "motion/react";
import {
  ArrowRight,
  Clock,
  UserRound,
  UserCheck,
  Bot,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { DURATION, EASING } from "@/lib/motion";
import { formatDateTime } from "@/lib/format";
import {
  STAGE_PAST_PILL,
  stageCurrentClass,
  stageDotClass,
} from "@/lib/stage-palette";
import type {
  TimelineEntry,
  TimelineEntryType,
  TimelineMessage,
  TimelineStatusChange,
} from "@/lib/services/interfaces/lead-service";

type FilterValue = "all" | TimelineEntryType;

const FILTERS: ReadonlyArray<{ value: FilterValue; labelKey: string }> = [
  { value: "all", labelKey: "filters.all" },
  { value: "message", labelKey: "filters.messages" },
  { value: "status_change", labelKey: "filters.status" },
];

interface AgentVisual {
  readonly icon: LucideIcon;
  readonly bg: string;
  readonly color: string;
  readonly labelKey: string | null;
}

function getMessageVisual(sender: string): AgentVisual {
  const normalized = sender.toLowerCase();
  if (normalized === "lead") {
    return {
      icon: UserRound,
      bg: "bg-on-surface-variant/10",
      color: "text-on-surface-variant",
      labelKey: "agents.lead",
    };
  }
  if (normalized === "human") {
    return {
      icon: UserCheck,
      bg: "bg-[#8b5cf6]/10",
      color: "text-[#8b5cf6]",
      labelKey: "agents.human",
    };
  }
  // Any other sender = the user's configured agent name (e.g. "Luna")
  return { icon: Bot, bg: "bg-teal/10", color: "text-teal", labelKey: null };
}

interface MessageGroup {
  readonly kind: "messages";
  readonly sender: string;
  readonly createdAt: string;
  readonly messages: readonly TimelineMessage[];
}

interface StatusEntry {
  readonly kind: "status";
  readonly createdAt: string;
  readonly change: TimelineStatusChange;
}

type Group = MessageGroup | StatusEntry;

function groupEntries(entries: readonly TimelineEntry[]): Group[] {
  const groups: Group[] = [];

  for (const entry of entries) {
    const last = groups[groups.length - 1];

    if (entry.type === "message") {
      const msg = entry.data as TimelineMessage;
      if (last?.kind === "messages" && last.sender === msg.sender) {
        groups[groups.length - 1] = {
          ...last,
          createdAt: entry.createdAt,
          messages: [...last.messages, msg],
        };
      } else {
        groups.push({
          kind: "messages",
          sender: msg.sender,
          createdAt: entry.createdAt,
          messages: [msg],
        });
      }
      continue;
    }

    groups.push({
      kind: "status",
      createdAt: entry.createdAt,
      change: entry.data as TimelineStatusChange,
    });
  }

  return groups;
}

interface TimelineViewProps {
  readonly entries: readonly TimelineEntry[];
  readonly leadName: string;
}

/**
 * Renders a vertical timeline of lead events with filtering, consecutive
 * message grouping, agent-specific icons, and auto-scroll to latest.
 */
export function TimelineView({ entries, leadName }: TimelineViewProps) {
  const t = useTranslations("crm");
  const [filter, setFilter] = useState<FilterValue>("all");
  const scrollRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(
    () => (filter === "all" ? entries : entries.filter((e) => e.type === filter)),
    [entries, filter],
  );

  const groups = useMemo(() => groupEntries(filtered), [filtered]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [filter, entries]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <FilterTabs value={filter} onChange={setFilter} />

      <div className="flex-1 overflow-y-auto pr-2" ref={scrollRef}>
        {groups.length === 0 ? (
          <EmptyState hint={t("filters.emptyHint")} message={t("filters.empty")} />
        ) : (
          <div className="relative space-y-8">
            <div className="absolute left-[15px] top-4 bottom-4 w-px bg-surface-container-high" />
            {groups.map((group, idx) => (
              <GroupRow group={group} idx={idx} key={keyFor(group, idx)} leadName={leadName} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function keyFor(group: Group, idx: number): string {
  if (group.kind === "messages") return `msg-${group.createdAt}-${idx}`;
  return `status-${group.change.id}-${idx}`;
}

function FilterTabs({
  value,
  onChange,
}: {
  readonly value: FilterValue;
  readonly onChange: (v: FilterValue) => void;
}) {
  const t = useTranslations("crm");

  return (
    <div className="mb-3 flex shrink-0 gap-1.5">
      {FILTERS.map((f) => {
        const active = value === f.value;
        return (
          <button
            className={cn(
              "rounded-full px-3 py-1 text-[12px] font-medium transition-colors",
              active
                ? "bg-primary text-on-primary"
                : "bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest",
            )}
            key={f.value}
            onClick={() => onChange(f.value)}
            type="button"
          >
            {t(f.labelKey)}
          </button>
        );
      })}
    </div>
  );
}

function EmptyState({ message, hint }: { readonly message: string; readonly hint?: string }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-container-high">
        <Clock className="h-6 w-6 text-on-surface-variant/50" />
      </div>
      <p className="font-display text-base font-bold text-on-surface">{message}</p>
      {hint && (
        <p className="mt-1 max-w-sm text-[13px] leading-relaxed text-on-surface-variant">
          {hint}
        </p>
      )}
    </div>
  );
}

function GroupRow({
  group,
  idx,
  leadName,
}: {
  readonly group: Group;
  readonly idx: number;
  readonly leadName: string;
}) {
  return (
    <motion.div
      animate={{ opacity: 1, x: 0 }}
      className="relative flex gap-3"
      initial={{ opacity: 0, x: -8 }}
      transition={{
        duration: DURATION.fast,
        delay: Math.min(idx * 0.03, 0.3),
        ease: EASING.out,
      }}
    >
      {group.kind === "messages" && (
        <>
          <MessageGroupIcon group={group} />
          <div className="min-w-0 flex-1 pt-0.5">
            <MessageGroupCard group={group} leadName={leadName} />
          </div>
        </>
      )}
      {group.kind === "status" && (
        <>
          <StatusChainIcon />
          <div className="min-w-0 flex-1 pt-0.5">
            <StatusEntry change={group.change} createdAt={group.createdAt} />
          </div>
        </>
      )}
    </motion.div>
  );
}

function MessageGroupIcon({ group }: { readonly group: MessageGroup }) {
  const visual = getMessageVisual(group.sender);
  const Icon = visual.icon;
  return (
    <div
      className={cn(
        "relative z-10 flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full",
        visual.bg,
      )}
    >
      <Icon className={cn("h-3.5 w-3.5", visual.color)} />
    </div>
  );
}

function StatusChainIcon() {
  return (
    <div className="relative z-10 flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full bg-primary/10">
      <ArrowRight className="h-3.5 w-3.5 text-primary" />
    </div>
  );
}

function MessageGroupCard({
  group,
  leadName,
}: {
  readonly group: MessageGroup;
  readonly leadName: string;
}) {
  const t = useTranslations("crm");
  const visual = getMessageVisual(group.sender);
  const HeaderIcon = visual.icon;
  const lastMessage = group.messages[group.messages.length - 1]!;
  const displayName =
    group.sender.toLowerCase() === "lead"
      ? leadName
      : visual.labelKey
        ? t(visual.labelKey)
        : group.sender;
  const dateValue = group.createdAt ?? lastMessage.createdAt;
  const parsedDate = new Date(dateValue);
  const isValidDate = !Number.isNaN(parsedDate.getTime());

  const bubbles = group.messages.flatMap((m) =>
    m.content
      .split(/\[BREAK\]/i)
      .map((p) => p.trim())
      .filter(Boolean),
  );

  return (
    <div>
      <div className="flex items-center gap-2 px-1">
        <HeaderIcon className={cn("h-3 w-3", visual.color)} />
        <span className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">
          {displayName}
        </span>
        {isValidDate && (
          <span className="text-[11px] tabular-nums text-on-surface-variant">
            {formatDateTime(dateValue, "pt-BR")}
          </span>
        )}
      </div>
      <div className="mt-1.5 space-y-1.5">
        {bubbles.map((text, i) => (
          <div className="rounded-xl bg-surface-container-low px-3 py-2" key={i}>
            <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-on-surface-variant">
              {text}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

const STAGE_RANK: Record<string, number> = {
  new: 0,
  contacted: 1,
  qualified: 2,
  converted: 3,
};

function DirectionalArrow({ from, to }: { readonly from: string; readonly to: string }) {
  if (to === "lost") {
    return <TrendingDown className="h-3.5 w-3.5 text-danger" />;
  }
  const fromRank = STAGE_RANK[from];
  const toRank = STAGE_RANK[to];
  if (fromRank !== undefined && toRank !== undefined) {
    if (toRank > fromRank) return <TrendingUp className="h-3.5 w-3.5 text-success" />;
    if (toRank < fromRank) return <TrendingDown className="h-3.5 w-3.5 text-warning" />;
  }
  return <ArrowRight className="h-3 w-3 text-on-surface-variant" />;
}

const KNOWN_AGENT_KEYS = ["horos", "kairos", "human", "lead"] as const;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function resolveChangedBy(
  value: string,
  t: ReturnType<typeof useTranslations>,
): string | null {
  const normalized = value.trim().toLowerCase();
  if ((KNOWN_AGENT_KEYS as readonly string[]).includes(normalized)) {
    return t(`agents.${normalized}`);
  }
  if (UUID_RE.test(value.trim())) return null;
  return value;
}

const CREATED_PILL =
  "border border-dashed border-on-surface-variant/30 bg-transparent text-on-surface-variant/70";

function StatusEntry({
  change,
  createdAt,
}: {
  readonly change: TimelineStatusChange;
  readonly createdAt: string;
}) {
  const t = useTranslations("crm");

  const getStatusLabel = (status: string) => {
    const keys = ["new", "contacted", "qualified", "converted", "lost"] as const;
    type StageKey = (typeof keys)[number];
    if (keys.includes(status as StageKey)) {
      return t(`stages.${status as StageKey}`);
    }
    return status;
  };

  const isCreation = !change.oldStatus;
  const newPill = stageCurrentClass(change.newStatus);
  const changedByLabel = change.changedBy ? resolveChangedBy(change.changedBy, t) : null;
  const dateValue = createdAt ?? change.createdAt;
  const parsedDate = new Date(dateValue);
  const isValidDate = !Number.isNaN(parsedDate.getTime());

  return (
    <div>
      <div className="flex items-center gap-2 px-1">
        <ArrowRight className="h-3 w-3 text-primary" />
        <span className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">
          {t("statusChangeHeader")}
        </span>
        {isValidDate && (
          <span className="text-[11px] tabular-nums text-on-surface-variant">
            {formatDateTime(dateValue, "pt-BR")}
          </span>
        )}
      </div>
      <div className="mt-1.5 flex flex-wrap items-center gap-2">
        {isCreation ? (
          <span className={cn("rounded-full px-2.5 py-1 text-[12px] font-medium", CREATED_PILL)}>
            {t("stages.created")}
          </span>
        ) : (
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-medium",
              STAGE_PAST_PILL,
            )}
          >
            <span className={cn("h-1.5 w-1.5 rounded-full", stageDotClass(change.oldStatus!))} />
            {getStatusLabel(change.oldStatus!)}
          </span>
        )}
        <DirectionalArrow from={change.oldStatus ?? ""} to={change.newStatus} />
        <motion.span
          animate={{ scale: [0.92, 1.06, 1] }}
          transition={{ duration: 0.55, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
        >
          <span className={cn("rounded-full px-2.5 py-1 text-[12px] font-bold", newPill)}>
            {getStatusLabel(change.newStatus)}
          </span>
        </motion.span>
        {changedByLabel && (
          <span className="text-[11px] text-on-surface-variant">
            por {changedByLabel}
          </span>
        )}
      </div>
    </div>
  );
}
