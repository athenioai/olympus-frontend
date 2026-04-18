"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  ArrowLeft,
  Calendar,
  CalendarDays,
  ClipboardCopy,
  ExternalLink,
  MessageSquare,
  Users as UsersIcon,
} from "lucide-react";
import { toast } from "sonner";
import type {
  AdminAppointment,
  AdminCalendarConfig,
  AdminChat,
  AdminChatMessage,
  AdminUserPublic,
  UpdateCalendarConfigPayload,
  UserDashboardSummary,
} from "@/lib/services";
import { formatDate, formatDateTime } from "../../../_lib/format";
import {
  loadChatMessagesAction,
  updateCalendarConfigAction,
} from "../actions";

type TabKey = "overview" | "appointments" | "chats" | "calendar";

interface UserDetailViewProps {
  readonly user: AdminUserPublic;
  readonly initialDashboard: UserDashboardSummary | null;
  readonly initialAppointments: readonly AdminAppointment[];
  readonly initialChats: readonly AdminChat[];
  readonly initialCalendarConfig: AdminCalendarConfig | null;
}

export function UserDetailView({
  user,
  initialDashboard,
  initialAppointments,
  initialChats,
  initialCalendarConfig,
}: UserDetailViewProps) {
  const t = useTranslations("admin.users");
  const tc = useTranslations("admin.common");
  const [tab, setTab] = useState<TabKey>("overview");

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Link
          className="flex items-center gap-2 text-sm font-semibold text-on-surface-variant hover:text-on-surface"
          href="/admin/users"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("detail.backToList")}
        </Link>
        <div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-on-surface">
            {user.name ?? user.email}
          </h1>
          <p className="text-sm text-on-surface-variant">{user.email}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <TabButton
          active={tab === "overview"}
          label={t("detail.overview")}
          onClick={() => setTab("overview")}
        />
        <TabButton
          active={tab === "appointments"}
          label={t("detail.appointments")}
          onClick={() => setTab("appointments")}
        />
        <TabButton
          active={tab === "chats"}
          label={t("detail.chats")}
          onClick={() => setTab("chats")}
        />
        <TabButton
          active={tab === "calendar"}
          label={t("detail.calendar")}
          onClick={() => setTab("calendar")}
        />
      </div>

      {tab === "overview" && (
        <OverviewPanel dashboard={initialDashboard} user={user} />
      )}
      {tab === "appointments" && (
        <AppointmentsPanel appointments={initialAppointments} />
      )}
      {tab === "chats" && (
        <ChatsPanel chats={initialChats} userId={user.id} />
      )}
      {tab === "calendar" && (
        <CalendarPanel
          initialConfig={initialCalendarConfig}
          tc={tc}
          userId={user.id}
        />
      )}
    </div>
  );
}

function TabButton({
  active,
  label,
  onClick,
}: {
  readonly active: boolean;
  readonly label: string;
  readonly onClick: () => void;
}) {
  return (
    <button
      className={`h-10 rounded-xl px-4 text-sm font-semibold transition-colors ${
        active
          ? "bg-primary/8 text-primary"
          : "bg-surface-container-high text-on-surface-variant hover:text-on-surface"
      }`}
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
  );
}

function OverviewPanel({
  user,
  dashboard,
}: {
  readonly user: AdminUserPublic;
  readonly dashboard: UserDashboardSummary | null;
}) {
  const t = useTranslations("admin.users");
  const tc = useTranslations("admin.common");

  async function copySlug(slug: string) {
    try {
      await navigator.clipboard.writeText(slug);
      toast.success(t("detail.slugCopied"));
    } catch {
      toast.error(tc("loadError"));
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MetricTile
          icon={UsersIcon}
          label={t("metrics.totalLeads")}
          value={dashboard?.totalLeads ?? 0}
        />
        <MetricTile
          icon={CalendarDays}
          label={t("metrics.totalAppointments")}
          value={dashboard?.totalAppointments ?? 0}
        />
        <MetricTile
          icon={MessageSquare}
          label={t("metrics.totalChats")}
          value={dashboard?.totalChats ?? 0}
        />
      </div>

      <div className="space-y-3 rounded-xl bg-surface-container-lowest p-5 shadow-ambient">
        <InfoRow label={t("detail.onboardingSlug")}>
          {user.onboardingSlug ? (
            <div className="flex items-center gap-2 font-mono text-xs text-on-surface">
              <span>{user.onboardingSlug}</span>
              <button
                className="rounded-md p-1 text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
                onClick={() => copySlug(user.onboardingSlug ?? "")}
                type="button"
              >
                <ClipboardCopy className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <span className="text-xs text-on-surface-variant">
              {t("detail.noOnboardingSlug")}
            </span>
          )}
        </InfoRow>
        <InfoRow label={t("detail.contractUrl")}>
          {user.contractUrl ? (
            <a
              className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
              href={user.contractUrl}
              rel="noopener noreferrer"
              target="_blank"
            >
              {t("detail.openContract")}
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          ) : (
            <span className="text-xs text-on-surface-variant">
              {t("detail.noContract")}
            </span>
          )}
        </InfoRow>
      </div>
    </div>
  );
}

function MetricTile({
  icon: Icon,
  label,
  value,
}: {
  readonly icon: React.ComponentType<{ className?: string }>;
  readonly label: string;
  readonly value: number;
}) {
  return (
    <div className="rounded-xl bg-surface-container-lowest p-5 shadow-ambient">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant">
          {label}
        </p>
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <p className="mt-2 font-display text-3xl font-extrabold text-on-surface">
        {value.toLocaleString("pt-BR")}
      </p>
    </div>
  );
}

function InfoRow({
  label,
  children,
}: {
  readonly label: string;
  readonly children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant">
        {label}
      </span>
      <div>{children}</div>
    </div>
  );
}

function AppointmentsPanel({
  appointments,
}: {
  readonly appointments: readonly AdminAppointment[];
}) {
  const t = useTranslations("admin.users.appointments");

  if (appointments.length === 0) {
    return (
      <div className="rounded-xl bg-surface-container-lowest p-8 text-center text-sm text-on-surface-variant">
        {t("empty")}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl bg-surface-container-lowest shadow-ambient">
      <ul className="divide-y divide-surface-container-high">
        {appointments.map((appt) => (
          <li className="flex items-center justify-between px-5 py-3" key={appt.id}>
            <div>
              <p className="text-sm font-medium text-on-surface">
                {appt.date} · {appt.startTime} — {appt.endTime}
              </p>
              {appt.notes && (
                <p className="text-xs text-on-surface-variant">{appt.notes}</p>
              )}
            </div>
            <span className="rounded-full bg-surface-container-high px-3 py-1 text-xs font-semibold text-on-surface-variant">
              {t(`status.${appt.status}`)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ChatsPanel({
  chats,
  userId,
}: {
  readonly chats: readonly AdminChat[];
  readonly userId: string;
}) {
  const t = useTranslations("admin.users.chats");
  const [selected, setSelected] = useState<AdminChat | null>(null);
  const [messages, setMessages] = useState<readonly AdminChatMessage[]>([]);
  const [loading, setLoading] = useState(false);

  async function loadMessages(chat: AdminChat) {
    setSelected(chat);
    setLoading(true);
    const result = await loadChatMessagesAction(userId, chat.id);
    if (result.success && result.data) {
      setMessages(result.data);
    } else {
      setMessages([]);
    }
    setLoading(false);
  }

  if (chats.length === 0) {
    return (
      <div className="rounded-xl bg-surface-container-lowest p-8 text-center text-sm text-on-surface-variant">
        {t("empty")}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <div className="overflow-hidden rounded-xl bg-surface-container-lowest shadow-ambient lg:col-span-1">
        <ul className="divide-y divide-surface-container-high">
          {chats.map((chat) => (
            <li key={chat.id}>
              <button
                className={`flex w-full items-center justify-between gap-2 px-5 py-3 text-left transition-colors hover:bg-surface-container-high ${
                  selected?.id === chat.id ? "bg-surface-container-high" : ""
                }`}
                onClick={() => loadMessages(chat)}
                type="button"
              >
                <div>
                  <p className="text-sm font-medium text-on-surface">
                    {t("lead")} · {chat.leadId.slice(0, 8)}
                  </p>
                  <p className="text-xs text-on-surface-variant">
                    {formatDateTime(chat.updatedAt)}
                  </p>
                </div>
                {chat.handoff && (
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase text-primary">
                    {t("handoff")}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      </div>
      <div className="rounded-xl bg-surface-container-lowest p-5 shadow-ambient lg:col-span-2">
        <h3 className="mb-3 font-display text-sm font-semibold text-on-surface">
          {t("messagesTitle")}
        </h3>
        {!selected && (
          <p className="text-sm text-on-surface-variant">{t("openMessages")}</p>
        )}
        {selected && loading && (
          <p className="text-sm text-on-surface-variant">...</p>
        )}
        {selected && !loading && messages.length === 0 && (
          <p className="text-sm text-on-surface-variant">{t("noMessages")}</p>
        )}
        {selected && messages.length > 0 && (
          <ul className="space-y-2 text-sm">
            {messages.map((msg) => (
              <li
                className="rounded-lg bg-surface-container-high px-3 py-2"
                key={msg.id}
              >
                <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                  {msg.sender} · {formatDateTime(msg.createdAt)}
                </p>
                <p className="mt-1 text-on-surface">{msg.content}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function CalendarPanel({
  userId,
  initialConfig,
  tc,
}: {
  readonly userId: string;
  readonly initialConfig: AdminCalendarConfig | null;
  readonly tc: (key: string) => string;
}) {
  const t = useTranslations("admin.users.calendar");
  const [minAdvance, setMinAdvance] = useState<string>(
    String(initialConfig?.minAdvanceMinutes ?? 60),
  );
  const [minCancelAdvance, setMinCancelAdvance] = useState<string>(
    String(initialConfig?.minCancelAdvanceMinutes ?? 60),
  );
  const [slotDuration, setSlotDuration] = useState<string>(
    String(initialConfig?.slotDurationMinutes ?? 30),
  );
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const payload: UpdateCalendarConfigPayload = {
      minAdvanceMinutes: Number.parseInt(minAdvance, 10),
      minCancelAdvanceMinutes: Number.parseInt(minCancelAdvance, 10),
      slotDurationMinutes: Number.parseInt(slotDuration, 10),
    };

    startTransition(async () => {
      const result = await updateCalendarConfigAction(userId, payload);
      if (!result.success) {
        toast.error(result.error ?? tc("loadError"));
        return;
      }
      toast.success(t("saved"));
    });
  }

  if (!initialConfig) {
    return (
      <form
        className="space-y-4 rounded-xl bg-surface-container-lowest p-5 shadow-ambient"
        onSubmit={handleSubmit}
      >
        <div className="flex items-center gap-2 text-sm text-on-surface-variant">
          <Calendar className="h-4 w-4" />
          {t("empty")}
        </div>
        <CalendarFields
          minAdvance={minAdvance}
          minCancelAdvance={minCancelAdvance}
          setMinAdvance={setMinAdvance}
          setMinCancelAdvance={setMinCancelAdvance}
          setSlotDuration={setSlotDuration}
          slotDuration={slotDuration}
        />
        <SaveButton isPending={isPending} label={t("saveConfig")} />
      </form>
    );
  }

  return (
    <form
      className="space-y-4 rounded-xl bg-surface-container-lowest p-5 shadow-ambient"
      onSubmit={handleSubmit}
    >
      <CalendarFields
        minAdvance={minAdvance}
        minCancelAdvance={minCancelAdvance}
        setMinAdvance={setMinAdvance}
        setMinCancelAdvance={setMinCancelAdvance}
        setSlotDuration={setSlotDuration}
        slotDuration={slotDuration}
      />
      <p className="text-xs text-on-surface-variant">
        {`${t("saved").replace(/\.$/, "")} · ${formatDate(initialConfig.updatedAt)}`}
      </p>
      <SaveButton isPending={isPending} label={t("saveConfig")} />
    </form>
  );
}

function CalendarFields({
  minAdvance,
  setMinAdvance,
  minCancelAdvance,
  setMinCancelAdvance,
  slotDuration,
  setSlotDuration,
}: {
  readonly minAdvance: string;
  readonly setMinAdvance: (value: string) => void;
  readonly minCancelAdvance: string;
  readonly setMinCancelAdvance: (value: string) => void;
  readonly slotDuration: string;
  readonly setSlotDuration: (value: string) => void;
}) {
  const t = useTranslations("admin.users.calendar");
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <NumberField
        label={t("minAdvance")}
        onChange={setMinAdvance}
        value={minAdvance}
      />
      <NumberField
        label={t("minCancelAdvance")}
        onChange={setMinCancelAdvance}
        value={minCancelAdvance}
      />
      <NumberField
        label={t("slotDuration")}
        onChange={setSlotDuration}
        value={slotDuration}
      />
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
}: {
  readonly label: string;
  readonly value: string;
  readonly onChange: (value: string) => void;
}) {
  return (
    <label className="block space-y-1">
      <span className="font-display text-xs font-semibold text-on-surface">
        {label}
      </span>
      <input
        className="h-10 w-full rounded-lg bg-surface-container-high px-3 text-sm text-on-surface outline-none focus:bg-surface-container-lowest focus:ring-1 focus:ring-primary/30"
        min={0}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, ""))}
        type="text"
        value={value}
      />
    </label>
  );
}

function SaveButton({
  isPending,
  label,
}: {
  readonly isPending: boolean;
  readonly label: string;
}) {
  return (
    <div className="flex justify-end">
      <button
        className="h-10 rounded-xl bg-gradient-to-br from-primary to-primary-dim px-5 text-sm font-bold text-on-primary shadow-lg shadow-primary/10 disabled:opacity-60"
        disabled={isPending}
        type="submit"
      >
        {label}
      </button>
    </div>
  );
}
