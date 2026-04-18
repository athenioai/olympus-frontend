import { getTranslations } from "next-intl/server";
import {
  Activity,
  CalendarDays,
  MessageSquare,
  Sparkles,
  Users,
  Wallet,
} from "lucide-react";
import { adminDashboardService } from "@/lib/services";
import type { PlatformMetrics } from "@/lib/services";
import { formatBRL } from "../_lib/format";

export default async function AdminDashboardPage() {
  const t = await getTranslations("admin.dashboard");
  const tc = await getTranslations("common");

  let metrics: PlatformMetrics | null = null;
  let errorMessage: string | null = null;

  try {
    metrics = await adminDashboardService.getMetrics();
  } catch (err) {
    errorMessage = err instanceof Error ? err.message : tc("error");
  }

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-on-surface">
          {t("title")}
        </h1>
        <p className="text-sm text-on-surface-variant">{t("subtitle")}</p>
      </header>

      {errorMessage && (
        <div className="rounded-xl bg-danger-muted px-4 py-3 text-sm text-danger">
          {errorMessage}
        </div>
      )}

      {metrics && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <MetricCard
            icon={Users}
            label={t("totalUsers")}
            value={metrics.totalUsers.toLocaleString("pt-BR")}
          />
          <MetricCard
            icon={Activity}
            label={t("activeUsers")}
            value={metrics.activeUsers.toLocaleString("pt-BR")}
          />
          <MetricCard
            icon={Wallet}
            label={t("mrr")}
            value={formatBRL(metrics.mrr)}
          />
          <MetricCard
            icon={CalendarDays}
            label={t("appointmentsMonth")}
            value={metrics.appointmentsThisMonth.toLocaleString("pt-BR")}
          />
          <MetricCard
            icon={Sparkles}
            label={t("totalLeads")}
            value={metrics.totalLeads.toLocaleString("pt-BR")}
          />
          <MetricCard
            icon={MessageSquare}
            label={t("activeChats")}
            value={metrics.activeChats.toLocaleString("pt-BR")}
          />
        </div>
      )}
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
}: {
  readonly icon: React.ComponentType<{ className?: string }>;
  readonly label: string;
  readonly value: string;
}) {
  return (
    <div className="rounded-xl bg-surface-container-lowest p-5 shadow-ambient">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant">
          {label}
        </p>
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <p className="mt-3 font-display text-3xl font-extrabold text-on-surface">
        {value}
      </p>
    </div>
  );
}
