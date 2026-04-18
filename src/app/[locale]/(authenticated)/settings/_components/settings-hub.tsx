"use client";

import { useState, useEffect, useTransition, useCallback } from "react";
import { useTranslations } from "next-intl";
import { CalendarDays, Bot, Building2, Radio, ExternalLink, Loader2, Trash2, Zap, HelpCircle, CalendarOff } from "lucide-react";
import { WhatsAppIcon, TelegramIcon, InstagramIcon, SmsIcon } from "@/components/icons/channel-icons";
import { toast } from "sonner";
import { TelegramWizard } from "./telegram-wizard";
import { BusinessProfileSettings } from "./business-profile-settings";
import { BusinessFaqSettings } from "./business-faq-settings";
import { BusinessExceptionSettings } from "./business-exception-settings";
import { cn } from "@/lib/utils";
import { updateCalendarConfig, updatePrepaymentSetting, listChannels, disconnectChannel } from "../actions";
import { fetchBusinessProfile } from "../business-profile-actions";
import { updateAgentConfig } from "../agent-actions";
import { API_URL as API_URL_CHANNELS } from "@/lib/env";
import type { ChannelAccount } from "@/lib/services";
import type {
  CalendarConfig,
  AgentConfig,
  PrepaymentSetting,
  BusinessHourEntry,
} from "@/lib/services";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Tab = "profile" | "agent" | "calendar" | "faqs" | "exceptions" | "channels";

interface SettingsHubProps {
  readonly calendarConfig: CalendarConfig;
  readonly agentConfig: AgentConfig;
  readonly prepaymentSetting: PrepaymentSetting;
  readonly userId: string;
}

// ---------------------------------------------------------------------------
// Calendar settings
// ---------------------------------------------------------------------------

function CalendarSettings({
  config,
  prepayment,
}: {
  readonly config: CalendarConfig;
  readonly prepayment: PrepaymentSetting;
}) {
  const t = useTranslations("settings");
  const tc = useTranslations("common");
  const [isPending, startTransition] = useTransition();

  const [slotHours, setSlotHours] = useState(String(Math.floor(config.slotDurationMinutes / 60)));
  const [slotMinutes, setSlotMinutes] = useState(String(config.slotDurationMinutes % 60));
  const [advanceHours, setAdvanceHours] = useState(String(Math.floor(config.minAdvanceMinutes / 60)));
  const [advanceMinutes, setAdvanceMinutes] = useState(String(config.minAdvanceMinutes % 60));
  const [cancelHours, setCancelHours] = useState(String(Math.floor(config.minCancelAdvanceMinutes / 60)));
  const [cancelMinutes, setCancelMinutes] = useState(String(config.minCancelAdvanceMinutes % 60));
  const [businessHours, setBusinessHours] = useState<BusinessHourEntry[]>(
    config.businessHours,
  );
  const [prepaymentEnabled, setPrepaymentEnabled] = useState(prepayment.requirePrepayment);

  function handleRangeChange(dayIndex: number, rangeIndex: number, field: "start" | "end", value: string) {
    setBusinessHours((prev) =>
      prev.map((bh, i) => {
        if (i !== dayIndex) return bh;
        const newRanges = bh.ranges.map((r, ri) =>
          ri === rangeIndex ? { ...r, [field]: value } : r,
        );
        return { ...bh, ranges: newRanges };
      }),
    );
  }

  function handleSave() {
    startTransition(async () => {
      const [configResult, prepaymentResult] = await Promise.all([
        updateCalendarConfig({
          businessHours,
          slotDurationMinutes: Number(slotHours) * 60 + Number(slotMinutes),
          minAdvanceMinutes: Number(advanceHours) * 60 + Number(advanceMinutes),
          minCancelAdvanceMinutes: Number(cancelHours) * 60 + Number(cancelMinutes),
        }),
        updatePrepaymentSetting({ requirePrepayment: prepaymentEnabled }),
      ]);

      if (!configResult.success) {
        toast.error(configResult.error ?? tc("error"));
        return;
      }
      if (!prepaymentResult.success) {
        toast.error(prepaymentResult.error ?? tc("error"));
        return;
      }

      toast.success(t("saved"));
    });
  }

  const activeDays = businessHours.filter((bh) => bh.ranges.length > 0).length;

  function handleDiscard() {
    setSlotHours(String(Math.floor(config.slotDurationMinutes / 60)));
    setSlotMinutes(String(config.slotDurationMinutes % 60));
    setAdvanceHours(String(Math.floor(config.minAdvanceMinutes / 60)));
    setAdvanceMinutes(String(config.minAdvanceMinutes % 60));
    setCancelHours(String(Math.floor(config.minCancelAdvanceMinutes / 60)));
    setCancelMinutes(String(config.minCancelAdvanceMinutes % 60));
    setBusinessHours(config.businessHours);
    setPrepaymentEnabled(prepayment.requirePrepayment);
  }

  return (
    <div className="space-y-10">
      {/* ── Hero ──────────────────────────────────────────── */}
      <div>
        <h2 className="font-display text-xl font-extrabold tracking-tight text-on-surface">
          {t("calendar.title")}
        </h2>
        <p className="mt-2 max-w-xl text-[14px] leading-relaxed text-on-surface-variant">
          {t("calendar.subtitle")}
        </p>
      </div>

      {/* ── Bento: Summary + Status ──────────────────────── */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        {/* Summary card */}
        <section className="rounded-xl bg-surface-container-low p-6 lg:col-span-8">
          <div className="flex items-start gap-5">
            <div className="hidden h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-surface-container-lowest sm:flex">
              <CalendarDays className="h-8 w-8 text-primary/30" />
            </div>
            <div className="flex-1 space-y-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/60">Dias ativos</span>
                <p className="mt-0.5 font-display text-3xl font-extrabold tracking-tighter text-on-surface">
                  {activeDays}<span className="text-base text-on-surface-variant/50"> / 7</span>
                </p>
              </div>
              <div className="flex gap-6">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/60">{t("calendar.slotDuration")}</span>
                  <p className="mt-0.5 font-display text-base font-bold text-on-surface">
                    {Number(slotHours) > 0 ? `${slotHours}h` : ""}{slotMinutes}min
                  </p>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/60">{t("calendar.minAdvance")}</span>
                  <p className="mt-0.5 font-display text-base font-bold text-on-surface">
                    {Number(advanceHours) > 0 ? `${advanceHours}h` : ""}{advanceMinutes}min
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Status card */}
        <section className="flex flex-col justify-between rounded-xl bg-primary p-6 text-on-primary lg:col-span-4">
          <div>
            <div className="mb-3 flex items-center justify-between">
              <CalendarDays className="h-6 w-6" />
              <span className="rounded-full bg-on-primary/10 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider">
                {t("calendar.status.active")}
              </span>
            </div>
            <h3 className="font-display text-base font-bold">
              {t("calendar.status.title")}
            </h3>
            <p className="mt-1.5 text-[12px] leading-relaxed text-on-primary/70">
              {t("calendar.status.description")}
            </p>
          </div>
          <div className="pt-4">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-on-primary/20">
              <div className="h-full rounded-full bg-on-primary" style={{ width: `${(activeDays / 7) * 100}%` }} />
            </div>
            <div className="mt-2 flex justify-between text-[10px] font-bold uppercase tracking-widest">
              <span>Cobertura</span>
              <span>{((activeDays / 7) * 100).toFixed(0)}%</span>
            </div>
          </div>
        </section>
      </div>

      {/* ── Business hours ───────────────────────────────── */}
      <section className="space-y-5">
        <div>
          <h3 className="font-display text-lg font-bold tracking-tight text-on-surface">
            {t("calendar.businessHours")}
          </h3>
          <p className="mt-1 text-[14px] text-on-surface-variant">
            {t("calendar.businessHoursDesc")}
          </p>
        </div>
        <div className="mt-4 space-y-2">
          {businessHours.map((bh, dayIdx) => {
            const isClosed = bh.ranges.length === 0;
            return (
              <div
                className={cn(
                  "flex items-center gap-4 rounded-xl p-4 transition-colors",
                  isClosed ? "bg-surface-container-low/30" : "bg-surface-container-low/60",
                )}
                key={dayIdx}
              >
                {/* Toggle */}
                <button
                  className={cn(
                    "relative h-6 w-10 shrink-0 rounded-full transition-colors duration-200",
                    isClosed ? "bg-surface-container-high" : "bg-primary",
                  )}
                  onClick={() => {
                    setBusinessHours((prev) =>
                      prev.map((entry, i) => {
                        if (i !== dayIdx) return entry;
                        return {
                          ...entry,
                          ranges: isClosed
                            ? [{ start: "09:00", end: "18:00" }]
                            : [],
                        };
                      }),
                    );
                  }}
                  type="button"
                >
                  <div
                    className={cn(
                      "absolute top-0.5 h-5 w-5 rounded-full bg-surface-container-lowest shadow-sm transition-transform duration-200",
                      isClosed ? "translate-x-0.5" : "translate-x-[18px]",
                    )}
                  />
                </button>

                {/* Day name */}
                <span className={cn(
                  "w-24 shrink-0 text-sm font-semibold",
                  isClosed ? "text-on-surface-variant/50" : "text-on-surface",
                )}>
                  {t(`calendar.days.${bh.day}`)}
                </span>

                {/* Ranges or closed label */}
                {isClosed ? (
                  <span className="text-[13px] text-on-surface-variant/40">Fechado</span>
                ) : (
                  <div className="flex flex-1 flex-wrap items-center gap-2">
                    {bh.ranges.map((range, rangeIdx) => (
                      <div className="flex items-center gap-1.5 rounded-lg border border-surface-container-high bg-surface-container-lowest/50 px-3 py-1.5" key={rangeIdx}>
                        <input
                          className="h-7 w-[60px] rounded-md bg-transparent px-1 text-center font-mono text-sm font-medium text-on-surface outline-none transition-all focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/20"
                          maxLength={5}
                          onChange={(e) => handleRangeChange(dayIdx, rangeIdx, "start", e.target.value)}
                          placeholder="09:00"
                          value={range.start}
                        />
                        <span className="text-xs text-on-surface-variant/40">–</span>
                        <input
                          className="h-7 w-[60px] rounded-md bg-transparent px-1 text-center font-mono text-sm font-medium text-on-surface outline-none transition-all focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/20"
                          maxLength={5}
                          onChange={(e) => handleRangeChange(dayIdx, rangeIdx, "end", e.target.value)}
                          placeholder="18:00"
                          value={range.end}
                        />
                        <button
                          className="ml-1 flex h-5 w-5 items-center justify-center rounded text-on-surface-variant/30 transition-colors hover:bg-danger-muted hover:text-danger"
                          onClick={() => {
                            setBusinessHours((prev) =>
                              prev.map((entry, i) => {
                                if (i !== dayIdx) return entry;
                                return {
                                  ...entry,
                                  ranges: entry.ranges.filter((_, ri) => ri !== rangeIdx),
                                };
                              }),
                            );
                          }}
                          type="button"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    {/* Add range button */}
                    <button
                      className="flex h-9 items-center gap-1 rounded-lg px-2.5 text-[11px] font-semibold text-primary transition-colors hover:bg-primary/5"
                      onClick={() => {
                        setBusinessHours((prev) =>
                          prev.map((entry, i) => {
                            if (i !== dayIdx) return entry;
                            return {
                              ...entry,
                              ranges: [...entry.ranges, { start: "13:00", end: "18:00" }],
                            };
                          }),
                        );
                      }}
                      type="button"
                    >
                      + Intervalo
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Scheduling rules ────────────────────────────── */}
      <section className="space-y-5 rounded-xl bg-surface-container-low p-8">
        <div>
          <h3 className="font-display text-lg font-bold tracking-tight text-on-surface">
            {t("calendar.scheduling")}
          </h3>
          <p className="mt-1 text-[14px] text-on-surface-variant">
            {t("calendar.schedulingDesc")}
          </p>
        </div>
        <div className="mt-4 space-y-5">
          <div className="flex items-start justify-between gap-6 rounded-xl bg-surface-container-low/40 p-4">
            <div>
              <label className="text-sm font-semibold text-on-surface">
                {t("calendar.slotDuration")}
              </label>
              <p className="mt-0.5 text-[12px] text-on-surface-variant">
                {t("calendar.slotDurationHint")}
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <input
                className="h-10 w-16 rounded-xl bg-surface-container-high px-2 text-center text-sm font-medium text-on-surface outline-none transition-colors focus:bg-surface-container-lowest focus:ring-1 focus:ring-primary/30"
                min={0}
                max={8}
                onChange={(e) => setSlotHours(e.target.value)}
                type="number"
                value={slotHours}
              />
              <span className="text-[13px] text-on-surface-variant">h</span>
              <input
                className="h-10 w-16 rounded-xl bg-surface-container-high px-2 text-center text-sm font-medium text-on-surface outline-none transition-colors focus:bg-surface-container-lowest focus:ring-1 focus:ring-primary/30"
                min={0}
                max={59}
                onChange={(e) => setSlotMinutes(e.target.value)}
                type="number"
                value={slotMinutes}
              />
              <span className="text-[13px] text-on-surface-variant">min</span>
            </div>
          </div>
          <div className="flex items-start justify-between gap-6 rounded-xl bg-surface-container-low/40 p-4">
            <div>
              <label className="text-sm font-semibold text-on-surface">
                {t("calendar.minAdvance")}
              </label>
              <p className="mt-0.5 text-[12px] text-on-surface-variant">
                {t("calendar.minAdvanceHint")}
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <input
                className="h-10 w-16 rounded-xl bg-surface-container-high px-2 text-center text-sm font-medium text-on-surface outline-none transition-colors focus:bg-surface-container-lowest focus:ring-1 focus:ring-primary/30"
                min={0}
                max={720}
                onChange={(e) => setAdvanceHours(e.target.value)}
                type="number"
                value={advanceHours}
              />
              <span className="text-[13px] text-on-surface-variant">h</span>
              <input
                className="h-10 w-16 rounded-xl bg-surface-container-high px-2 text-center text-sm font-medium text-on-surface outline-none transition-colors focus:bg-surface-container-lowest focus:ring-1 focus:ring-primary/30"
                min={0}
                max={59}
                onChange={(e) => setAdvanceMinutes(e.target.value)}
                type="number"
                value={advanceMinutes}
              />
              <span className="text-[13px] text-on-surface-variant">min</span>
            </div>
          </div>
          <div className="flex items-start justify-between gap-6 rounded-xl bg-surface-container-low/40 p-4">
            <div>
              <label className="text-sm font-semibold text-on-surface">
                {t("calendar.minCancelAdvance")}
              </label>
              <p className="mt-0.5 text-[12px] text-on-surface-variant">
                {t("calendar.minCancelAdvanceHint")}
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <input
                className="h-10 w-16 rounded-xl bg-surface-container-high px-2 text-center text-sm font-medium text-on-surface outline-none transition-colors focus:bg-surface-container-lowest focus:ring-1 focus:ring-primary/30"
                min={0}
                max={720}
                onChange={(e) => setCancelHours(e.target.value)}
                type="number"
                value={cancelHours}
              />
              <span className="text-[13px] text-on-surface-variant">h</span>
              <input
                className="h-10 w-16 rounded-xl bg-surface-container-high px-2 text-center text-sm font-medium text-on-surface outline-none transition-colors focus:bg-surface-container-lowest focus:ring-1 focus:ring-primary/30"
                min={0}
                max={59}
                onChange={(e) => setCancelMinutes(e.target.value)}
                type="number"
                value={cancelMinutes}
              />
              <span className="text-[13px] text-on-surface-variant">min</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Prepayment ───────────────────────────────────── */}
      <section className="flex items-center justify-between rounded-xl bg-surface-container-low p-8">
        <div>
          <h3 className="font-display text-lg font-bold tracking-tight text-on-surface">
            {t("calendar.prepayment")}
          </h3>
          <p className="mt-1 text-[13px] text-on-surface-variant">
            {t("calendar.prepaymentDesc")}
          </p>
        </div>
        <button
          className={cn(
            "relative h-7 w-12 shrink-0 rounded-full transition-colors duration-200",
            prepaymentEnabled ? "bg-primary" : "bg-surface-container-high",
          )}
          onClick={() => setPrepaymentEnabled(!prepaymentEnabled)}
          type="button"
        >
          <div
            className={cn(
              "absolute top-1 h-5 w-5 rounded-full bg-surface-container-lowest shadow-sm transition-transform duration-200",
              prepaymentEnabled ? "translate-x-6" : "translate-x-1",
            )}
          />
        </button>
      </section>

      {/* ── Footer Actions ───────────────────────────────── */}
      <div className="flex items-center justify-between border-t border-on-surface-variant/10 pt-8">
        <div className="flex items-center gap-2 text-on-surface-variant/40">
          <span className="text-[10px] font-bold uppercase tracking-widest">
            🗓️ Configuração da agenda
          </span>
        </div>
        <div className="flex items-center gap-4">
          <button
            className="rounded-xl px-8 py-3 text-sm font-bold text-on-surface-variant transition-colors hover:bg-surface-container-high"
            disabled={isPending}
            onClick={handleDiscard}
            type="button"
          >
            {t("calendar.discard")}
          </button>
          <button
            className="rounded-xl bg-primary px-10 py-3 font-display text-sm font-bold text-on-primary shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60"
            disabled={isPending}
            onClick={handleSave}
            type="button"
          >
            {isPending ? tc("loading") : t("calendar.save")}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Agent settings
// ---------------------------------------------------------------------------

const TONE_CONFIG = {
  friendly: {
    icon: "😊",
    color: "bg-teal/10 text-teal",
    border: "border-teal",
    shadow: "shadow-[0_24px_48px_-12px_rgba(79,209,197,0.08)]",
  },
  formal: {
    icon: "🛡️",
    color: "bg-primary/10 text-primary",
    border: "border-primary",
    shadow: "shadow-[0_24px_48px_-12px_rgba(137,81,0,0.08)]",
  },
  casual: {
    icon: "🎉",
    color: "bg-[#8b5cf6]/10 text-[#8b5cf6]",
    border: "border-[#8b5cf6]",
    shadow: "shadow-[0_24px_48px_-12px_rgba(139,92,246,0.08)]",
  },
} as const;

const MAX_INSTRUCTIONS = 2000;

function AgentSettings({ config }: { readonly config: AgentConfig }) {
  const t = useTranslations("settings");
  const tc = useTranslations("common");
  const [isPending, startTransition] = useTransition();

  const [agentName, setAgentName] = useState(config.agentName);
  const [profession, setProfession] = useState(config.profession ?? "");
  const [tone, setTone] = useState<"friendly" | "formal" | "casual">(config.tone);
  const [customInstructions, setCustomInstructions] = useState(
    config.customInstructions ?? "",
  );

  const charCount = customInstructions.length;
  const charPercent = Math.min((charCount / MAX_INSTRUCTIONS) * 100, 100);

  function handleSave() {
    startTransition(async () => {
      const result = await updateAgentConfig({
        agentName,
        tone,
        customInstructions: customInstructions.trim() || null,
        profession: profession.trim() || null,
      });

      if (result.success) {
        toast.success(t("saved"));
      } else {
        toast.error(result.error ?? tc("error"));
      }
    });
  }

  function handleDiscard() {
    setAgentName(config.agentName);
    setProfession(config.profession ?? "");
    setTone(config.tone);
    setCustomInstructions(config.customInstructions ?? "");
  }

  return (
    <div className="space-y-10">
      {/* ── Hero ──────────────────────────────────────────── */}
      <div>
        <h2 className="font-display text-xl font-extrabold tracking-tight text-on-surface">
          {t("agent.title")}
        </h2>
        <p className="mt-2 max-w-xl text-[14px] leading-relaxed text-on-surface-variant">
          {t("agent.subtitle")}
        </p>
      </div>

      {/* ── Bento: Identity + Status ─────────────────────── */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        {/* Identity card */}
        <section className="rounded-xl bg-surface-container-low p-6 lg:col-span-8">
          <div className="flex items-start gap-5">
            {/* Avatar */}
            <div className="relative hidden sm:block">
              <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl bg-surface-container-lowest">
                <Bot className="h-8 w-8 text-primary/30" />
              </div>
            </div>

            {/* Fields */}
            <div className="flex-1 space-y-4">
              <div className="space-y-1.5">
                <label className="ml-1 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/60">
                  {t("agent.name")}
                </label>
                <input
                  className="w-full rounded-xl bg-surface-container-high border-none px-4 py-3 text-sm font-medium text-on-surface outline-none transition-all placeholder:text-on-surface-variant/40 focus:ring-2 focus:ring-primary/20"
                  maxLength={100}
                  onChange={(e) => setAgentName(e.target.value)}
                  placeholder={t("agent.namePlaceholder")}
                  value={agentName}
                />
              </div>
              <div className="space-y-1.5">
                <label className="ml-1 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/60">
                  {t("agent.profession")}
                </label>
                <input
                  className="w-full rounded-xl bg-surface-container-high border-none px-4 py-3 text-sm font-medium text-on-surface outline-none transition-all placeholder:text-on-surface-variant/40 focus:ring-2 focus:ring-primary/20"
                  maxLength={100}
                  onChange={(e) => setProfession(e.target.value)}
                  placeholder={t("agent.professionPlaceholder")}
                  value={profession}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Status card */}
        <section className="flex flex-col justify-between rounded-xl bg-primary p-6 text-on-primary lg:col-span-4">
          <div>
            <div className="mb-3 flex items-center justify-between">
              <Zap className="h-6 w-6" />
              <span className="rounded-full bg-on-primary/10 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider">
                {t("agent.status.active")}
              </span>
            </div>
            <h3 className="font-display text-base font-bold">
              {t("agent.status.title")}
            </h3>
            <p className="mt-1.5 text-[12px] leading-relaxed text-on-primary/70">
              {t("agent.status.description")}
            </p>
          </div>
          <div className="pt-4">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-on-primary/20">
              <div className="h-full rounded-full bg-on-primary" style={{ width: "100%" }} />
            </div>
            <div className="mt-2 flex justify-between text-[10px] font-bold uppercase tracking-widest">
              <span>Online</span>
              <span>100%</span>
            </div>
          </div>
        </section>
      </div>

      {/* ── Tone of Voice ────────────────────────────────── */}
      <section className="space-y-6">
        <div>
          <h3 className="font-display text-lg font-bold tracking-tight text-on-surface">
            {t("agent.tone")}
          </h3>
          <p className="mt-1 text-[14px] text-on-surface-variant">
            {t("agent.toneSubtitle")}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {(["friendly", "formal", "casual"] as const).map((key) => {
            const isActive = tone === key;
            const cfg = TONE_CONFIG[key];
            return (
              <button
                className={cn(
                  "relative flex flex-col items-start overflow-hidden rounded-xl bg-surface-container-lowest p-8 text-left transition-all",
                  isActive
                    ? `border-2 ${cfg.border} ${cfg.shadow}`
                    : "border border-transparent hover:border-primary/15",
                )}
                key={key}
                onClick={() => setTone(key)}
                type="button"
              >
                {isActive && (
                  <div className="absolute right-0 top-0 rounded-bl-xl bg-primary px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-on-primary">
                    {t("agent.activeTone")}
                  </div>
                )}
                <div className={cn("mb-6 flex h-12 w-12 items-center justify-center rounded-full text-xl transition-transform", cfg.color, !isActive && "group-hover:scale-110")}>
                  {cfg.icon}
                </div>
                <h4 className="font-display text-lg font-bold text-on-surface">
                  {t(`agent.tones.${key}`)}
                </h4>
                <p className="mt-2 text-[13px] leading-relaxed text-on-surface-variant">
                  {t(`agent.tones.${key}Desc`)}
                </p>
                <div className="mt-6 flex items-center gap-2">
                  <div className={cn("h-3 w-3 rounded-full", isActive ? "bg-primary" : "border-2 border-on-surface-variant/30")} />
                  <span className={cn("text-xs font-bold", isActive ? "text-primary" : "text-on-surface-variant")}>
                    {isActive ? t("agent.activeTone") : t("agent.selectTone")}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* ── Operational Directives ────────────────────────── */}
      <section className="space-y-5 rounded-xl bg-surface-container-low p-8">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg font-bold tracking-tight text-on-surface">
            {t("agent.directives")}
          </h3>
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-on-surface-variant">
              {charCount} / {MAX_INSTRUCTIONS} {t("agent.characters")}
            </span>
            <div className="h-1 w-28 overflow-hidden rounded-full bg-surface-container-high">
              <div
                className={cn("h-full rounded-full transition-all", charPercent > 90 ? "bg-danger" : "bg-teal")}
                style={{ width: `${charPercent}%` }}
              />
            </div>
          </div>
        </div>

        <textarea
          className="w-full rounded-xl bg-surface-container-lowest border-none p-8 text-[15px] leading-relaxed text-on-surface-variant outline-none transition-all placeholder:text-on-surface-variant/40 focus:ring-2 focus:ring-primary/20 resize-none"
          maxLength={MAX_INSTRUCTIONS}
          onChange={(e) => setCustomInstructions(e.target.value)}
          placeholder={t("agent.directivesPlaceholder")}
          rows={8}
          value={customInstructions}
        />

        <div className="flex items-center gap-3 rounded-lg bg-teal/5 p-4">
          <span className="text-teal">ℹ️</span>
          <p className="text-xs font-medium text-on-surface-variant">
            {t("agent.directivesHint")}
          </p>
        </div>
      </section>

      {/* ── Footer Actions ───────────────────────────────── */}
      <div className="flex items-center justify-between border-t border-on-surface-variant/10 pt-8">
        <div className="flex items-center gap-2 text-on-surface-variant/40">
          <span className="text-[10px] font-bold uppercase tracking-widest">
            🔒 Configuração criptografada
          </span>
        </div>
        <div className="flex items-center gap-4">
          <button
            className="rounded-xl px-8 py-3 text-sm font-bold text-on-surface-variant transition-colors hover:bg-surface-container-high"
            disabled={isPending}
            onClick={handleDiscard}
            type="button"
          >
            {t("agent.discard")}
          </button>
          <button
            className="rounded-xl bg-primary px-10 py-3 font-display text-sm font-bold text-on-primary shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60"
            disabled={isPending}
            onClick={handleSave}
            type="button"
          >
            {isPending ? tc("loading") : t("agent.save")}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Channels settings
// ---------------------------------------------------------------------------

const META_APP_ID = process.env.NEXT_PUBLIC_META_APP_ID ?? "";
const WHATSAPP_REDIRECT_URI = `${API_URL_CHANNELS}/auth/whatsapp/callback`;
const WHATSAPP_SCOPES = [
  "public_profile",
  "business_management",
  "whatsapp_business_management",
  "whatsapp_business_messaging",
  "whatsapp_business_manage_events",
].join(",");

interface ChannelCardProps {
  readonly icon: React.ComponentType<{ className?: string }>;
  readonly iconBg: string;
  readonly iconColor: string;
  readonly name: string;
  readonly description: string;
  readonly action: React.ReactNode;
}

function ChannelCard({ icon: Icon, iconBg, iconColor, name, description, action }: ChannelCardProps) {
  return (
    <div className="flex items-center gap-4 rounded-xl bg-surface-container-low/40 p-4">
      <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", iconBg)}>
        <Icon className={cn("h-5 w-5", iconColor)} />
      </div>
      <div className="min-w-0 flex-1">
        <h4 className="text-sm font-semibold text-on-surface">{name}</h4>
        <p className="mt-0.5 text-[12px] leading-relaxed text-on-surface-variant">{description}</p>
      </div>
      <div className="shrink-0">{action}</div>
    </div>
  );
}

function ChannelsSettings({ userId }: { readonly userId: string }) {
  const t = useTranslations("settings");
  const [telegramWizardOpen, setTelegramWizardOpen] = useState(false);
  const [channels, setChannels] = useState<ChannelAccount[]>([]);
  const [canConnect, setCanConnect] = useState<boolean | null>(null);
  const [missingCount, setMissingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  const loadChannels = useCallback(async () => {
    const [channelsResult, profileResult] = await Promise.all([
      listChannels(),
      fetchBusinessProfile(),
    ]);
    if (channelsResult.success && channelsResult.data) {
      setChannels(channelsResult.data);
    }
    if (profileResult.success && profileResult.data) {
      setCanConnect(profileResult.data.score.canConnectChannel);
      setMissingCount(profileResult.data.score.missingRequired.length);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadChannels();
  }, [loadChannels]);

  const whatsappAccount = channels.find((c) => c.channel === "whatsapp");
  const telegramAccount = channels.find((c) => c.channel === "telegram");

  function handleConnectWhatsApp() {
    const state = btoa(JSON.stringify({ userId }));
    const url =
      `https://www.facebook.com/v21.0/dialog/oauth?` +
      `client_id=${META_APP_ID}` +
      `&redirect_uri=${encodeURIComponent(WHATSAPP_REDIRECT_URI)}` +
      `&scope=${WHATSAPP_SCOPES}` +
      `&state=${state}`;
    window.location.href = url;
  }

  function handleDisconnect(id: string) {
    startTransition(async () => {
      const result = await disconnectChannel(id);
      if (result.success) {
        setChannels((prev) => prev.filter((c) => c.id !== id));
      }
    });
  }

  function renderAction(
    account: ChannelAccount | undefined,
    connectButton: React.ReactNode,
    connectedLabel: string,
  ) {
    if (loading) return <Loader2 className="h-4 w-4 animate-spin text-on-surface-variant/40" />;
    if (account) {
      return (
        <div className="flex items-center gap-3">
          {account.accessToken && (
            <code className="rounded-lg bg-surface-container-high px-3 py-1.5 font-mono text-[11px] text-on-surface-variant">
              {account.accessToken}
            </code>
          )}
          <span className="rounded-lg bg-success/10 px-3 py-1.5 text-[12px] font-semibold text-success">
            {connectedLabel}
          </span>
          <button
            className="flex h-8 w-8 items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:bg-danger-muted hover:text-danger"
            disabled={isPending}
            onClick={() => handleDisconnect(account.id)}
            title={t("channels.telegram.disconnect")}
            type="button"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      );
    }
    return connectButton;
  }

  return (
    <div className="space-y-10">
      {/* ── Hero ──────────────────────────────────────────── */}
      <div>
        <h2 className="font-display text-xl font-extrabold tracking-tight text-on-surface">
          {t("channels.title")}
        </h2>
        <p className="mt-2 max-w-xl text-[14px] leading-relaxed text-on-surface-variant">
          {t("channels.subtitle")}
        </p>
      </div>

      {/* Blocked banner */}
      {canConnect === false && (
        <div className="flex items-center gap-4 rounded-xl border-l-4 border-warning bg-warning/6 p-5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-warning/12">
            <Building2 className="h-5 w-5 text-warning" />
          </div>
          <div className="flex-1">
            <span className="block text-[14px] font-bold text-on-surface">{t("channels.blocked")}</span>
            <span className="text-[12px] text-on-surface-variant">{t("channels.blockedDesc")}</span>
          </div>
          <button
            className="flex h-9 items-center gap-1.5 rounded-xl bg-warning/10 px-4 text-[13px] font-bold text-warning transition-colors hover:bg-warning/15"
            onClick={() => {
              const hub = document.querySelector("[data-tab-profile]") as HTMLButtonElement | null;
              hub?.click();
            }}
            type="button"
          >
            {t("channels.goToProfile")}
          </button>
        </div>
      )}

      <div className="space-y-3">
        <ChannelCard
          icon={WhatsAppIcon}
          iconBg="bg-[#25D366]/10"
          iconColor="text-[#25D366]"
          name={t("channels.whatsapp.name")}
          description={t("channels.whatsapp.description")}
          action={renderAction(
            whatsappAccount,
            canConnect === false ? (
              <span className="rounded-lg bg-surface-container-high px-3 py-1.5 text-[11px] font-medium text-on-surface-variant" title={t("channels.blocked")}>
                {t("channels.blocked")}
              </span>
            ) : META_APP_ID ? (
              <button
                className="flex h-9 items-center gap-2 rounded-xl bg-[#25D366] px-4 text-[13px] font-bold text-white transition-opacity hover:opacity-90"
                onClick={handleConnectWhatsApp}
                type="button"
              >
                {t("channels.whatsapp.connect")}
                <ExternalLink className="h-3.5 w-3.5" />
              </button>
            ) : (
              <span className="rounded-lg bg-surface-container-high px-3 py-1.5 text-[12px] font-medium text-on-surface-variant">
                {t("channels.whatsapp.notConnected")}
              </span>
            ),
            t("channels.whatsapp.connected"),
          )}
        />

        <ChannelCard
          icon={TelegramIcon}
          iconBg="bg-[#0088cc]/10"
          iconColor="text-[#0088cc]"
          name={t("channels.telegram.name")}
          description={t("channels.telegram.description")}
          action={renderAction(
            telegramAccount,
            canConnect === false ? (
              <span className="rounded-lg bg-surface-container-high px-3 py-1.5 text-[11px] font-medium text-on-surface-variant" title={t("channels.blocked")}>
                {t("channels.blocked")}
              </span>
            ) : (
              <button
                className="flex h-9 items-center gap-2 rounded-xl bg-[#0088cc] px-4 text-[13px] font-bold text-white transition-opacity hover:opacity-90"
                onClick={() => setTelegramWizardOpen(true)}
                type="button"
              >
                {t("channels.telegram.connect")}
              </button>
            ),
            t("channels.telegram.connected"),
          )}
        />

        <TelegramWizard
          open={telegramWizardOpen}
          onClose={() => setTelegramWizardOpen(false)}
          onConnected={loadChannels}
        />

        <ChannelCard
          icon={InstagramIcon}
          iconBg="bg-[#E1306C]/10"
          iconColor="text-[#E1306C]"
          name={t("channels.instagram.name")}
          description={t("channels.instagram.description")}
          action={
            <span className="rounded-lg bg-surface-container-high px-3 py-1.5 text-[12px] font-medium text-on-surface-variant">
              {t("channels.instagram.comingSoon")}
            </span>
          }
        />

        <ChannelCard
          icon={SmsIcon}
          iconBg="bg-on-surface-variant/8"
          iconColor="text-on-surface-variant"
          name={t("channels.sms.name")}
          description={t("channels.sms.description")}
          action={
            <span className="rounded-lg bg-surface-container-high px-3 py-1.5 text-[12px] font-medium text-on-surface-variant">
              {t("channels.sms.comingSoon")}
            </span>
          }
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const TABS: { key: Tab; icon: React.ComponentType<{ className?: string }>; labelKey: string }[] = [
  { key: "profile", icon: Building2, labelKey: "tabs.profile" },
  { key: "agent", icon: Bot, labelKey: "tabs.agent" },
  { key: "calendar", icon: CalendarDays, labelKey: "tabs.calendar" },
  { key: "faqs", icon: HelpCircle, labelKey: "tabs.faqs" },
  { key: "exceptions", icon: CalendarOff, labelKey: "tabs.exceptions" },
  { key: "channels", icon: Radio, labelKey: "tabs.channels" },
];

export function SettingsHub({
  calendarConfig,
  agentConfig,
  prepaymentSetting,
  userId,
}: SettingsHubProps) {
  const t = useTranslations("settings");
  const [activeTab, setActiveTab] = useState<Tab>("profile");

  return (
    <div className="-m-6 -mt-16 flex p-2 pt-6 lg:-m-8 lg:p-2 lg:pt-6" style={{ height: "100vh" }}>
      {/* Left nav — fixed sidebar */}
      <nav className="flex w-56 shrink-0 flex-col rounded-xl bg-surface px-4 pt-8">
        <div className="mb-8 flex items-center gap-3 px-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/8">
            <Building2 className="h-4 w-4 text-primary" />
          </div>
          <h1 className="font-display text-lg font-extrabold tracking-tight text-on-surface">
            {t("title")}
          </h1>
        </div>
        <div className="space-y-1">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary/8 text-primary"
                    : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface",
                )}
                data-tab-profile={tab.key === "profile" ? "" : undefined}
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                type="button"
              >
                <tab.icon className={cn("h-4 w-4", isActive ? "text-primary" : "text-on-surface-variant")} />
                {t(tab.labelKey)}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Content — scrollable */}
      <div className="min-w-0 flex-1 overflow-y-auto rounded-xl bg-surface-container-lowest">
        <div className="mx-auto max-w-5xl p-6 lg:p-8">
          {activeTab === "profile" && (
            <BusinessProfileSettings />
          )}
          {activeTab === "agent" && (
            <AgentSettings config={agentConfig} />
          )}
          {activeTab === "calendar" && (
            <CalendarSettings config={calendarConfig} prepayment={prepaymentSetting} />
          )}
          {activeTab === "faqs" && (
            <BusinessFaqSettings />
          )}
          {activeTab === "exceptions" && (
            <BusinessExceptionSettings />
          )}
          {activeTab === "channels" && (
            <ChannelsSettings userId={userId} />
          )}
        </div>
      </div>
    </div>
  );
}
