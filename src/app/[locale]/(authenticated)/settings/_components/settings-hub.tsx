"use client";

import { useState, useEffect, useTransition, useCallback } from "react";
import { useTranslations } from "next-intl";
import { CalendarDays, Bot, Settings2, Radio, MessageCircle, Send, Camera, Smartphone, ExternalLink, Loader2, Trash2 } from "lucide-react";
import { TelegramWizard } from "./telegram-wizard";
import { cn } from "@/lib/utils";
import { updateCalendarConfig, updatePrepaymentSetting, listChannels, disconnectChannel } from "../actions";
import { updateAgentConfig } from "../agent-actions";
import type { ChannelAccount } from "@/lib/services";
import type {
  CalendarConfig,
  AgentConfig,
  PrepaymentSetting,
  BusinessHour,
} from "@/lib/services";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Tab = "calendar" | "agent" | "channels";

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
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [slotHours, setSlotHours] = useState(String(Math.floor(config.slotDurationMinutes / 60)));
  const [slotMinutes, setSlotMinutes] = useState(String(config.slotDurationMinutes % 60));
  const [advanceHours, setAdvanceHours] = useState(String(config.minAdvanceHours));
  const [advanceMinutes, setAdvanceMinutes] = useState("0");
  const [cancelHours, setCancelHours] = useState(String(config.minCancelAdvanceHours));
  const [cancelMinutes, setCancelMinutes] = useState("0");
  const [businessHours, setBusinessHours] = useState<BusinessHour[]>(
    config.businessHours,
  );
  const [prepaymentEnabled, setPrepaymentEnabled] = useState(prepayment.requirePrepayment);

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
          businessHours,
          slotDurationMinutes: Number(slotHours) * 60 + Number(slotMinutes),
          minAdvanceHours: Number(advanceHours),
          minCancelAdvanceHours: Number(cancelHours),
        }),
        updatePrepaymentSetting({ requirePrepayment: prepaymentEnabled }),
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
    <div className="space-y-8">
      {/* Business hours */}
      <section>
        <h3 className="font-display text-base font-bold tracking-tight text-on-surface">
          {t("calendar.businessHours")}
        </h3>
        <p className="mt-1 text-[13px] text-on-surface-variant">
          Configure os dias e horários de atendimento.
        </p>
        <div className="mt-4 space-y-2">
          {businessHours.map((bh, i) => (
            <div className="flex items-center gap-3" key={i}>
              <span className="w-28 shrink-0 text-sm font-medium text-on-surface">
                {t(`calendar.days.${bh.day}`)}
              </span>
              <input
                className="h-10 flex-1 rounded-xl bg-surface-container-high px-3 text-sm text-on-surface outline-none transition-colors focus:bg-surface-container-lowest focus:ring-1 focus:ring-primary/30"
                onChange={(e) => handleBusinessHourChange(i, "schedule", e.target.value)}
                placeholder="09:00 to 18:00"
                value={bh.schedule}
              />
            </div>
          ))}
        </div>
      </section>

      <div className="h-px bg-surface-container-high" />

      {/* Slot & advance settings */}
      <section>
        <h3 className="font-display text-base font-bold tracking-tight text-on-surface">
          Agendamento
        </h3>
        <p className="mt-1 text-[13px] text-on-surface-variant">
          Configure a duração dos slots e antecedência mínima.
        </p>
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

      <div className="h-px bg-surface-container-high" />

      {/* Prepayment */}
      <section>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-display text-base font-bold tracking-tight text-on-surface">
              Pré-pagamento
            </h3>
            <p className="mt-1 text-[13px] text-on-surface-variant">
              Exigir pagamento antecipado para agendar.
            </p>
          </div>
          <button
            className={cn(
              "relative h-7 w-12 rounded-full transition-colors duration-200",
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
        </div>
      </section>

      {/* Feedback & save */}
      <div className="space-y-3 pt-2">
        {error && (
          <div className="rounded-xl bg-danger-muted px-4 py-3 text-sm text-danger">{error}</div>
        )}
        {message && (
          <div className="rounded-xl bg-success-muted px-4 py-3 text-sm text-success">{message}</div>
        )}
        <button
          className="h-10 rounded-xl bg-primary px-6 text-sm font-bold text-on-primary transition-opacity hover:opacity-90 disabled:opacity-60"
          disabled={isPending}
          onClick={handleSave}
          type="button"
        >
          {isPending ? tc("loading") : tc("save")}
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Agent settings
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
    <div className="space-y-8">
      {/* Agent identity */}
      <section>
        <h3 className="font-display text-base font-bold tracking-tight text-on-surface">
          Identidade do agente
        </h3>
        <p className="mt-1 text-[13px] text-on-surface-variant">
          Configure o nome e personalidade do seu assistente virtual.
        </p>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-[13px] font-medium text-on-surface-variant" htmlFor="agent-name">
              {t("agent.name")}
            </label>
            <input
              className="h-10 w-full rounded-xl bg-surface-container-high px-4 text-sm text-on-surface outline-none transition-colors focus:bg-surface-container-lowest focus:ring-1 focus:ring-primary/30"
              id="agent-name"
              maxLength={100}
              onChange={(e) => setAgentName(e.target.value)}
              value={agentName}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[13px] font-medium text-on-surface-variant" htmlFor="agent-tone">
              {t("agent.tone")}
            </label>
            <select
              className="h-10 w-full rounded-xl bg-surface-container-high px-4 text-sm text-on-surface outline-none transition-colors focus:bg-surface-container-lowest focus:ring-1 focus:ring-primary/30"
              id="agent-tone"
              onChange={(e) => setTone(e.target.value as "friendly" | "formal" | "casual")}
              value={tone}
            >
              <option value="friendly">{t("agent.tones.friendly")}</option>
              <option value="formal">{t("agent.tones.formal")}</option>
              <option value="casual">{t("agent.tones.casual")}</option>
            </select>
          </div>
        </div>
      </section>

      <div className="h-px bg-surface-container-high" />

      {/* Instructions */}
      <section>
        <h3 className="font-display text-base font-bold tracking-tight text-on-surface">
          {t("agent.customInstructions")}
        </h3>
        <p className="mt-1 text-[13px] text-on-surface-variant">
          Instruções adicionais para o comportamento do agente.
        </p>
        <textarea
          className="mt-4 min-h-[160px] w-full rounded-xl bg-surface-container-high px-4 py-3 text-sm text-on-surface outline-none transition-colors placeholder:text-on-surface-variant/50 focus:bg-surface-container-lowest focus:ring-1 focus:ring-primary/30"
          id="agent-instructions"
          maxLength={2000}
          onChange={(e) => setCustomInstructions(e.target.value)}
          placeholder={t("agent.customInstructionsPlaceholder")}
          value={customInstructions}
        />
      </section>

      {/* Feedback & save */}
      <div className="space-y-3 pt-2">
        {error && (
          <div className="rounded-xl bg-danger-muted px-4 py-3 text-sm text-danger">{error}</div>
        )}
        {message && (
          <div className="rounded-xl bg-success-muted px-4 py-3 text-sm text-success">{message}</div>
        )}
        <button
          className="h-10 rounded-xl bg-primary px-6 text-sm font-bold text-on-primary transition-opacity hover:opacity-90 disabled:opacity-60"
          disabled={isPending}
          onClick={handleSave}
          type="button"
        >
          {isPending ? tc("loading") : tc("save")}
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Channels settings
// ---------------------------------------------------------------------------

const META_APP_ID = process.env.NEXT_PUBLIC_META_APP_ID ?? "";
const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const WHATSAPP_REDIRECT_URI = `${BACKEND_URL}/auth/whatsapp/callback`;
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
    <div className="flex items-start gap-5 rounded-xl bg-surface-container-low/40 p-5">
      <div className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-xl", iconBg)}>
        <Icon className={cn("h-6 w-6", iconColor)} />
      </div>
      <div className="min-w-0 flex-1">
        <h4 className="text-sm font-semibold text-on-surface">{name}</h4>
        <p className="mt-0.5 text-[12px] leading-relaxed text-on-surface-variant">{description}</p>
      </div>
      <div className="shrink-0 pt-0.5">{action}</div>
    </div>
  );
}

function ChannelsSettings({ userId }: { readonly userId: string }) {
  const t = useTranslations("settings");
  const [telegramWizardOpen, setTelegramWizardOpen] = useState(false);
  const [channels, setChannels] = useState<ChannelAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  const loadChannels = useCallback(async () => {
    const result = await listChannels();
    if (result.success && result.data) {
      setChannels(result.data);
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
    <div className="space-y-8">
      <section>
        <h3 className="font-display text-base font-bold tracking-tight text-on-surface">
          {t("channels.title")}
        </h3>
        <p className="mt-1 text-[13px] text-on-surface-variant">
          {t("channels.subtitle")}
        </p>
      </section>

      <div className="space-y-3">
        <ChannelCard
          icon={MessageCircle}
          iconBg="bg-[#25D366]/10"
          iconColor="text-[#25D366]"
          name={t("channels.whatsapp.name")}
          description={t("channels.whatsapp.description")}
          action={renderAction(
            whatsappAccount,
            META_APP_ID ? (
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
          icon={Send}
          iconBg="bg-[#0088cc]/10"
          iconColor="text-[#0088cc]"
          name={t("channels.telegram.name")}
          description={t("channels.telegram.description")}
          action={renderAction(
            telegramAccount,
            <button
              className="flex h-9 items-center gap-2 rounded-xl bg-[#0088cc] px-4 text-[13px] font-bold text-white transition-opacity hover:opacity-90"
              onClick={() => setTelegramWizardOpen(true)}
              type="button"
            >
              {t("channels.telegram.connect")}
            </button>,
            t("channels.telegram.connected"),
          )}
        />

        <TelegramWizard
          open={telegramWizardOpen}
          onClose={() => setTelegramWizardOpen(false)}
          onConnected={loadChannels}
        />

        <ChannelCard
          icon={Camera}
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
          icon={Smartphone}
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
  { key: "calendar", icon: CalendarDays, labelKey: "tabs.calendar" },
  { key: "agent", icon: Bot, labelKey: "tabs.agent" },
  { key: "channels", icon: Radio, labelKey: "tabs.channels" },
];

export function SettingsHub({
  calendarConfig,
  agentConfig,
  prepaymentSetting,
  userId,
}: SettingsHubProps) {
  const t = useTranslations("settings");
  const [activeTab, setActiveTab] = useState<Tab>("calendar");

  return (
    <div className="mx-auto max-w-7xl">
      {/* Header */}
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/8">
          <Settings2 className="h-5 w-5 text-primary" />
        </div>
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-on-surface">
          {t("title")}
        </h1>
      </div>

      {/* Layout: sidebar tabs + content */}
      <div className="flex gap-8">
        {/* Left nav */}
        <nav className="w-48 shrink-0 space-y-1">
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
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                type="button"
              >
                <tab.icon className={cn("h-4.5 w-4.5", isActive ? "text-primary" : "text-on-surface-variant")} />
                {t(tab.labelKey)}
              </button>
            );
          })}
        </nav>

        {/* Content */}
        <div className="min-w-0 flex-1 rounded-xl bg-surface-container-lowest p-8">
          {activeTab === "calendar" && (
            <CalendarSettings config={calendarConfig} prepayment={prepaymentSetting} />
          )}
          {activeTab === "agent" && (
            <AgentSettings config={agentConfig} />
          )}
          {activeTab === "channels" && (
            <ChannelsSettings userId={userId} />
          )}
        </div>
      </div>
    </div>
  );
}
