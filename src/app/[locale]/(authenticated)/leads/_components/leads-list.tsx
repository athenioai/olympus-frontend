"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { motion } from "motion/react";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Flame,
  Thermometer,
  Snowflake,
  Mail,
  Phone,
  Loader2,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/format";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { STAGE_PAST_PILL, stageDotClass } from "@/lib/stage-palette";
import type {
  LeadPublic,
  LeadStatus,
  LeadTemperature,
  PaginatedLeadResponse,
} from "@/lib/services/interfaces/lead-service";

const STATUSES: readonly LeadStatus[] = [
  "new",
  "contacted",
  "qualified",
  "converted",
  "lost",
];
const TEMPERATURES: readonly LeadTemperature[] = ["hot", "warm", "cold"];

const TEMP_CONFIG: Record<
  LeadTemperature,
  { icon: LucideIcon; color: string; bg: string }
> = {
  hot: { icon: Flame, color: "text-danger", bg: "bg-danger/10" },
  warm: { icon: Thermometer, color: "text-warning", bg: "bg-warning/10" },
  cold: {
    icon: Snowflake,
    color: "text-on-surface-variant",
    bg: "bg-surface-container-high",
  },
};

interface Filters {
  readonly search?: string;
  readonly status?: LeadStatus;
  readonly temperature?: LeadTemperature;
}

interface LeadsListProps {
  readonly result: PaginatedLeadResponse;
  readonly filters: Filters;
  readonly page: number;
}

export function LeadsList({ result, filters, page }: LeadsListProps) {
  const t = useTranslations("crm.list");
  const tStages = useTranslations("crm.stages");
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [searchDraft, setSearchDraft] = useState(filters.search ?? "");

  useEffect(() => {
    setSearchDraft(filters.search ?? "");
  }, [filters.search]);

  function pushWithParams(update: Record<string, string | undefined>) {
    const params = new URLSearchParams();
    const next = { ...filters, page: String(page), ...update };
    if (next.search) params.set("search", next.search);
    if (next.status) params.set("status", next.status);
    if (next.temperature) params.set("temperature", next.temperature);
    if (next.page && next.page !== "1") params.set("page", next.page);

    const qs = params.toString();
    startTransition(() => {
      router.push(qs ? `${pathname}?${qs}` : pathname);
    });
  }

  // Debounced search — 300ms after last keystroke
  useEffect(() => {
    const current = filters.search ?? "";
    if (searchDraft === current) return;

    const handle = window.setTimeout(() => {
      pushWithParams({ search: searchDraft || undefined, page: "1" });
    }, 300);

    return () => window.clearTimeout(handle);
    // pushWithParams is stable enough for this use case; including it would re-fire on every render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchDraft]);

  const totalPages = Math.max(1, Math.ceil(result.total / result.limit));
  const from = result.total === 0 ? 0 : (result.page - 1) * result.limit + 1;
  const to = Math.min(result.page * result.limit, result.total);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-[2rem] font-extrabold leading-tight tracking-tight text-on-surface">
          {t("title")}
        </h1>
        <p className="mt-1 text-[13px] text-on-surface-variant">
          {t("subtitle", { count: result.total })}
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[260px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant/60" />
          <Input
            className="pl-9"
            onChange={(e) => setSearchDraft(e.target.value)}
            placeholder={t("searchPlaceholder")}
            type="search"
            value={searchDraft}
          />
        </div>

        <StatusSelect
          onChange={(v) => pushWithParams({ status: v, page: "1" })}
          placeholder={t("allStatuses")}
          value={filters.status}
          renderLabel={(s) => tStages(s)}
        />

        <TemperatureSelect
          onChange={(v) => pushWithParams({ temperature: v, page: "1" })}
          placeholder={t("allTemperatures")}
          value={filters.temperature}
          renderLabel={(temp) => t(`temperatures.${temp}`)}
        />

        {isPending && (
          <Loader2 className="h-4 w-4 animate-spin text-on-surface-variant" />
        )}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl bg-surface-container-lowest">
        {result.data.length === 0 ? (
          <EmptyState title={t("empty")} hint={t("emptyHint")} />
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-surface-container-high text-left">
                <Th>{t("columns.name")}</Th>
                <Th>{t("columns.status")}</Th>
                <Th>{t("columns.temperature")}</Th>
                <Th>{t("columns.contact")}</Th>
                <Th className="text-right">{t("columns.updated")}</Th>
              </tr>
            </thead>
            <tbody>
              {result.data.map((lead, idx) => (
                <LeadRow
                  idx={idx}
                  key={lead.id}
                  lead={lead}
                  stageLabel={tStages(lead.status)}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {result.total > 0 && (
        <div className="flex items-center justify-between text-[13px] text-on-surface-variant">
          <span className="tabular-nums">{t("pagination.showing", { from, to, total: result.total })}</span>
          <div className="flex items-center gap-2">
            <Button
              disabled={page <= 1 || isPending}
              onClick={() => pushWithParams({ page: String(page - 1) })}
              size="sm"
              variant="outline"
            >
              <ChevronLeft className="h-4 w-4" />
              {t("pagination.previous")}
            </Button>
            <span className="px-2 font-semibold tabular-nums text-on-surface">
              {page} / {totalPages}
            </span>
            <Button
              disabled={page >= totalPages || isPending}
              onClick={() => pushWithParams({ page: String(page + 1) })}
              size="sm"
              variant="outline"
            >
              {t("pagination.next")}
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function Th({ children, className }: { readonly children: React.ReactNode; readonly className?: string }) {
  return (
    <th
      className={cn(
        "px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-on-surface-variant",
        className,
      )}
    >
      {children}
    </th>
  );
}

function LeadRow({
  lead,
  idx,
  stageLabel,
}: {
  readonly lead: LeadPublic;
  readonly idx: number;
  readonly stageLabel: string;
}) {
  const temp = TEMP_CONFIG[lead.temperature];
  const TempIcon = temp.icon;
  const contact = lead.email ?? lead.phone;
  const ContactIcon = lead.email ? Mail : Phone;

  return (
    <motion.tr
      animate={{ opacity: 1, y: 0 }}
      className="border-b border-surface-container-high/50 transition-colors last:border-b-0 hover:bg-surface-container-low/50"
      initial={{ opacity: 0, y: 4 }}
      transition={{ delay: Math.min(idx * 0.02, 0.2), duration: 0.3 }}
    >
      <td className="px-4 py-3">
        <Link
          className="block font-semibold text-on-surface hover:text-primary"
          href={`/leads/${lead.id}`}
        >
          {lead.name}
        </Link>
      </td>
      <td className="px-4 py-3">
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold",
            STAGE_PAST_PILL,
          )}
        >
          <span className={cn("h-1.5 w-1.5 rounded-full", stageDotClass(lead.status))} />
          {stageLabel}
        </span>
      </td>
      <td className="px-4 py-3">
        <div className={cn("inline-flex items-center gap-1.5 rounded-full px-2 py-1", temp.bg)}>
          <TempIcon className={cn("h-3 w-3", temp.color)} />
          <span className={cn("text-[11px] font-semibold capitalize", temp.color)}>
            {lead.temperature}
          </span>
        </div>
      </td>
      <td className="px-4 py-3">
        {contact ? (
          <div className="flex items-center gap-1.5 text-[13px] text-on-surface-variant">
            <ContactIcon className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{contact}</span>
          </div>
        ) : (
          <span className="text-[12px] text-on-surface-variant/50">—</span>
        )}
      </td>
      <td className="px-4 py-3 text-right text-[12px] tabular-nums text-on-surface-variant">
        {formatRelativeTime(lead.updatedAt)}
      </td>
    </motion.tr>
  );
}

function StatusSelect({
  value,
  onChange,
  placeholder,
  renderLabel,
}: {
  readonly value?: LeadStatus;
  readonly onChange: (value: LeadStatus | undefined) => void;
  readonly placeholder: string;
  readonly renderLabel: (status: LeadStatus) => string;
}) {
  return (
    <select
      className="h-9 rounded-md border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
      onChange={(e) => onChange((e.target.value || undefined) as LeadStatus | undefined)}
      value={value ?? ""}
    >
      <option value="">{placeholder}</option>
      {STATUSES.map((s) => (
        <option key={s} value={s}>
          {renderLabel(s)}
        </option>
      ))}
    </select>
  );
}

function TemperatureSelect({
  value,
  onChange,
  placeholder,
  renderLabel,
}: {
  readonly value?: LeadTemperature;
  readonly onChange: (value: LeadTemperature | undefined) => void;
  readonly placeholder: string;
  readonly renderLabel: (temp: LeadTemperature) => string;
}) {
  return (
    <select
      className="h-9 rounded-md border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
      onChange={(e) =>
        onChange((e.target.value || undefined) as LeadTemperature | undefined)
      }
      value={value ?? ""}
    >
      <option value="">{placeholder}</option>
      {TEMPERATURES.map((t) => (
        <option key={t} value={t}>
          {renderLabel(t)}
        </option>
      ))}
    </select>
  );
}

function EmptyState({ title, hint }: { readonly title: string; readonly hint: string }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-container-high">
        <Users className="h-6 w-6 text-on-surface-variant/50" />
      </div>
      <p className="font-display text-base font-bold text-on-surface">{title}</p>
      <p className="mt-1 max-w-sm text-[13px] leading-relaxed text-on-surface-variant">
        {hint}
      </p>
    </div>
  );
}
