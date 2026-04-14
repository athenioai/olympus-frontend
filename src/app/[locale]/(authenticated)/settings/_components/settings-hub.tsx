"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { updateCalendarConfig, updatePrepaymentSetting } from "../actions";
import { updateAgentConfig } from "../agent-actions";
import type {
  CalendarConfig,
  AgentConfig,
  PrepaymentSetting,
  BusinessHour,
} from "@/lib/services";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Tab = "calendar" | "agent";

interface SettingsHubProps {
  readonly calendarConfig: CalendarConfig;
  readonly agentConfig: AgentConfig;
  readonly prepaymentSetting: PrepaymentSetting;
}

// ---------------------------------------------------------------------------
// Calendar settings section
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
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [slotDuration, setSlotDuration] = useState(
    String(config.slot_duration_minutes),
  );
  const [minAdvance, setMinAdvance] = useState(
    String(config.min_advance_hours),
  );
  const [minCancelAdvance, setMinCancelAdvance] = useState(
    String(config.min_cancel_advance_hours),
  );
  const [businessHours, setBusinessHours] = useState<BusinessHour[]>(
    config.business_hours,
  );
  const [prepaymentEnabled, setPrepaymentEnabled] = useState(prepayment.enabled);

  function handleBusinessHourChange(index: number, field: "day" | "schedule", value: string) {
    setBusinessHours((prev) =>
      prev.map((bh, i) => (i === index ? { ...bh, [field]: value } : bh)),
    );
  }

  function handleSave() {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const [configResult, prepaymentResult] = await Promise.all([
        updateCalendarConfig({
          business_hours: businessHours,
          slot_duration_minutes: Number(slotDuration),
          min_advance_hours: Number(minAdvance),
          min_cancel_advance_hours: Number(minCancelAdvance),
        }),
        updatePrepaymentSetting({ enabled: prepaymentEnabled }),
      ]);

      if (!configResult.success) {
        setError(configResult.error ?? tc("error"));
        return;
      }
      if (!prepaymentResult.success) {
        setError(prepaymentResult.error ?? tc("error"));
        return;
      }

      setMessage(t("saved"));
    });
  }

  return (
    <div className="space-y-6">
      {/* Business hours */}
      <div className="space-y-3">
        <h3 className="font-display text-sm font-bold tracking-tight text-on-surface">
          {t("calendar.businessHours")}
        </h3>
        <div className="space-y-2">
          {businessHours.map((bh, i) => (
            <div className="flex gap-3" key={i}>
              <input
                className="h-10 w-28 rounded-xl bg-surface-container-high px-3 text-sm text-on-surface outline-none transition-colors focus:bg-surface-container-lowest focus:ring-1 focus:ring-primary/30"
                onChange={(e) =>
                  handleBusinessHourChange(i, "day", e.target.value)
                }
                value={bh.day}
              />
              <input
                className="h-10 flex-1 rounded-xl bg-surface-container-high px-3 text-sm text-on-surface outline-none transition-colors focus:bg-surface-container-lowest focus:ring-1 focus:ring-primary/30"
                onChange={(e) =>
                  handleBusinessHourChange(i, "schedule", e.target.value)
                }
                placeholder="08:00-18:00"
                value={bh.schedule}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Slot duration */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-on-surface" htmlFor="slot-duration">
          {t("calendar.slotDuration")}
        </label>
        <input
          className="h-10 w-full rounded-xl bg-surface-container-high px-4 text-sm text-on-surface outline-none transition-colors focus:bg-surface-container-lowest focus:ring-1 focus:ring-primary/30 sm:w-48"
          id="slot-duration"
          min={5}
          max={480}
          onChange={(e) => setSlotDuration(e.target.value)}
          type="number"
          value={slotDuration}
        />
      </div>

      {/* Min advance */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-on-surface" htmlFor="min-advance">
          {t("calendar.minAdvance")}
        </label>
        <input
          className="h-10 w-full rounded-xl bg-surface-container-high px-4 text-sm text-on-surface outline-none transition-colors focus:bg-surface-container-lowest focus:ring-1 focus:ring-primary/30 sm:w-48"
          id="min-advance"
          min={0}
          max={720}
          onChange={(e) => setMinAdvance(e.target.value)}
          type="number"
          value={minAdvance}
        />
      </div>

      {/* Min cancel advance */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-on-surface" htmlFor="min-cancel">
          {t("calendar.minCancelAdvance")}
        </label>
        <input
          className="h-10 w-full rounded-xl bg-surface-container-high px-4 text-sm text-on-surface outline-none transition-colors focus:bg-surface-container-lowest focus:ring-1 focus:ring-primary/30 sm:w-48"
          id="min-cancel"
          min={0}
          max={720}
          onChange={(e) => setMinCancelAdvance(e.target.value)}
          type="number"
          value={minCancelAdvance}
        />
      </div>

      {/* Prepayment toggle */}
      <div className="flex items-center gap-3">
        <button
          className={cn(
            "relative h-6 w-11 rounded-full transition-colors",
            prepaymentEnabled ? "bg-primary" : "bg-surface-container-high",
          )}
          onClick={() => setPrepaymentEnabled(!prepaymentEnabled)}
          type="button"
        >
          <span
            className={cn(
              "absolute top-0.5 h-5 w-5 rounded-full bg-surface-container-lowest shadow-ambient transition-transform",
              prepaymentEnabled ? "left-[22px]" : "left-0.5",
            )}
          />
        </button>
        <span className="text-sm font-medium text-on-surface">
          Prepayment
        </span>
      </div>

      {/* Feedback */}
      {error && (
        <div className="rounded-lg bg-danger-muted px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}
      {message && (
        <div className="rounded-lg bg-success-muted px-4 py-3 text-sm text-success">
          {message}
        </div>
      )}

      {/* Save */}
      <button
        className="h-10 rounded-xl bg-primary px-6 text-sm font-bold text-on-primary transition-opacity hover:opacity-90 disabled:opacity-60"
        disabled={isPending}
        onClick={handleSave}
        type="button"
      >
        {isPending ? tc("loading") : tc("save")}
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Agent settings section
// ---------------------------------------------------------------------------

function AgentSettings({ config }: { readonly config: AgentConfig }) {
  const t = useTranslations("settings");
  const tc = useTranslations("common");
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [agentName, setAgentName] = useState(config.agentName);
  const [tone, setTone] = useState<"friendly" | "formal" | "casual">(config.tone);
  const [customInstructions, setCustomInstructions] = useState(
    config.customInstructions ?? "",
  );

  function handleSave() {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const result = await updateAgentConfig({
        agentName,
        tone,
        customInstructions: customInstructions.trim() || null,
      });

      if (result.success) {
        setMessage(t("saved"));
      } else {
        setError(result.error ?? tc("error"));
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Agent name */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-on-surface" htmlFor="agent-name">
          {t("agent.name")}
        </label>
        <input
          className="h-10 w-full rounded-xl bg-surface-container-high px-4 text-sm text-on-surface outline-none transition-colors focus:bg-surface-container-lowest focus:ring-1 focus:ring-primary/30 sm:w-80"
          id="agent-name"
          maxLength={100}
          onChange={(e) => setAgentName(e.target.value)}
          value={agentName}
        />
      </div>

      {/* Tone */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-on-surface" htmlFor="agent-tone">
          {t("agent.tone")}
        </label>
        <select
          className="h-10 w-full rounded-xl bg-surface-container-high px-4 text-sm text-on-surface outline-none transition-colors focus:bg-surface-container-lowest focus:ring-1 focus:ring-primary/30 sm:w-48"
          id="agent-tone"
          onChange={(e) =>
            setTone(e.target.value as "friendly" | "formal" | "casual")
          }
          value={tone}
        >
          <option value="friendly">{t("agent.tones.friendly")}</option>
          <option value="formal">{t("agent.tones.formal")}</option>
          <option value="casual">{t("agent.tones.casual")}</option>
        </select>
      </div>

      {/* Custom instructions */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-on-surface" htmlFor="agent-instructions">
          {t("agent.customInstructions")}
        </label>
        <textarea
          className="min-h-[120px] w-full rounded-xl bg-surface-container-high px-4 py-3 text-sm text-on-surface outline-none transition-colors placeholder:text-on-surface-variant/60 focus:bg-surface-container-lowest focus:ring-1 focus:ring-primary/30"
          id="agent-instructions"
          maxLength={2000}
          onChange={(e) => setCustomInstructions(e.target.value)}
          placeholder={t("agent.customInstructionsPlaceholder")}
          value={customInstructions}
        />
      </div>

      {/* Feedback */}
      {error && (
        <div className="rounded-lg bg-danger-muted px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}
      {message && (
        <div className="rounded-lg bg-success-muted px-4 py-3 text-sm text-success">
          {message}
        </div>
      )}

      {/* Save */}
      <button
        className="h-10 rounded-xl bg-primary px-6 text-sm font-bold text-on-primary transition-opacity hover:opacity-90 disabled:opacity-60"
        disabled={isPending}
        onClick={handleSave}
        type="button"
      >
        {isPending ? tc("loading") : tc("save")}
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function SettingsHub({
  calendarConfig,
  agentConfig,
  prepaymentSetting,
}: SettingsHubProps) {
  const t = useTranslations("settings");
  const [activeTab, setActiveTab] = useState<Tab>("calendar");

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      {/* Title */}
      <h1 className="font-display text-3xl font-extrabold tracking-tight text-on-surface">
        {t("title")}
      </h1>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl bg-surface-container-high p-1">
        <button
          className={cn(
            "rounded-lg px-4 py-2 text-sm font-medium transition-colors",
            activeTab === "calendar"
              ? "bg-surface-container-lowest text-on-surface shadow-ambient"
              : "text-on-surface-variant hover:text-on-surface",
          )}
          onClick={() => setActiveTab("calendar")}
          type="button"
        >
          {t("tabs.calendar")}
        </button>
        <button
          className={cn(
            "rounded-lg px-4 py-2 text-sm font-medium transition-colors",
            activeTab === "agent"
              ? "bg-surface-container-lowest text-on-surface shadow-ambient"
              : "text-on-surface-variant hover:text-on-surface",
          )}
          onClick={() => setActiveTab("agent")}
          type="button"
        >
          {t("tabs.agent")}
        </button>
      </div>

      {/* Content */}
      <div className="rounded-xl bg-surface-container-lowest p-8">
        {activeTab === "calendar" ? (
          <CalendarSettings config={calendarConfig} prepayment={prepaymentSetting} />
        ) : (
          <AgentSettings config={agentConfig} />
        )}
      </div>
    </div>
  );
}
