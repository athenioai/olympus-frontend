"use client";

import { useTranslations } from "next-intl";
import { motion } from "motion/react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Sparkles,
  Zap,
  DollarSign,
  AlertTriangle,
  Flame,
  Snowflake,
  Clock,
  CalendarDays,
  Users,
  MessageSquare,
  Receipt,
  Trophy,
  ArrowRight,
  Coffee,
  CheckCircle2,
  Inbox,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { fadeInUp, staggerContainer } from "@/lib/motion";
import type { FinanceDashboard } from "@/lib/services";

interface Props {
  readonly data: FinanceDashboard;
}

const BRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const BRL_COMPACT = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", notation: "compact", maximumFractionDigits: 1 });

function greetingKey(): "morning" | "afternoon" | "evening" {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 18) return "afternoon";
  return "evening";
}

function fmtChartDate(d: string): string {
  const p = d.split("-");
  return `${p[2]}/${p[1]}`;
}

function dueLabel(dueDate: string, isOverdue: boolean, t: ReturnType<typeof useTranslations>): string {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const due = new Date(dueDate + "T00:00:00");
  const diff = Math.round((due.getTime() - now.getTime()) / 86_400_000);

  if (isOverdue) return t("today.overdue", { days: Math.abs(diff) });
  if (diff === 0) return t("today.duesToday");
  if (diff === 1) return t("today.duesTomorrow");
  return t("today.duesIn", { days: diff });
}

// ---------------------------------------------------------------------------
// Status banner — picks highest priority message
// ---------------------------------------------------------------------------

function getStatusMessage(data: FinanceDashboard, t: ReturnType<typeof useTranslations>): {
  text: string;
  variant: "danger" | "warning" | "info" | "success" | "neutral";
} {
  if (data.overdueInvoices > 0) {
    return { text: t("status.overdue", { count: data.overdueInvoices, amount: BRL.format(data.overdueAmount) }), variant: "danger" };
  }
  if (data.hotLeadsWaiting > 0) {
    return { text: t("status.hotLeads", { count: data.hotLeadsWaiting }), variant: "warning" };
  }
  if (data.todayAppointments.length > 0) {
    return { text: t("status.todayAppointments", { count: data.todayAppointments.length }), variant: "info" };
  }
  if (data.revenueGrowth > 0) {
    return { text: t("status.growing", { value: data.revenueGrowth.toFixed(1) }), variant: "success" };
  }
  return { text: t("status.stable"), variant: "neutral" };
}

const STATUS_STYLES = {
  danger: "bg-danger/8 text-danger",
  warning: "bg-warning/8 text-warning",
  info: "bg-teal/8 text-teal",
  success: "bg-success/8 text-success",
  neutral: "bg-primary/6 text-on-surface-variant",
};

const STATUS_ICONS = {
  danger: AlertTriangle,
  warning: Flame,
  info: CalendarDays,
  success: TrendingUp,
  neutral: Sparkles,
};

// ---------------------------------------------------------------------------
// Radial progress
// ---------------------------------------------------------------------------

function RadialProgress({ value, size = 96, stroke = 8, label }: {
  readonly value: number; readonly size?: number; readonly stroke?: number; readonly label: string;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const off = c - (Math.min(value, 100) / 100) * c;
  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg className="-rotate-90" height={size} width={size}>
          <circle cx={size / 2} cy={size / 2} fill="none" r={r} stroke="var(--color-surface-container-high)" strokeWidth={stroke} />
          <motion.circle
            animate={{ strokeDashoffset: off }}
            cx={size / 2} cy={size / 2} fill="none"
            initial={{ strokeDashoffset: c }}
            r={r} stroke="var(--color-primary)" strokeDasharray={c} strokeLinecap="round" strokeWidth={stroke}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.4 }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-display text-lg font-extrabold tracking-tighter text-on-surface">{value.toFixed(0)}%</span>
        </div>
      </div>
      <span className="mt-1 text-[11px] font-medium text-on-surface-variant">{label}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Chart tooltip
// ---------------------------------------------------------------------------

function ChartTooltip({ active, payload, label }: {
  readonly active?: boolean; readonly payload?: ReadonlyArray<{ readonly value?: number }>; readonly label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg bg-surface-container-lowest px-4 py-3 shadow-ambient">
      <p className="mb-0.5 text-[11px] font-medium text-on-surface-variant">{label}</p>
      <p className="font-display text-sm font-bold text-on-surface">{BRL.format(payload[0]?.value ?? 0)}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Funnel bars
// ---------------------------------------------------------------------------

const FUNNEL_ORDER = ["new", "contacted", "qualified", "converted", "lost"] as const;
const FUNNEL_BG: Record<string, string> = {
  new: "bg-[#3b82f6]",       // Azul — curiosidade, novidade, potencial
  contacted: "bg-[#8b5cf6]", // Roxo — conexão, engajamento, progresso
  qualified: "bg-[#f59e0b]", // Dourado — valor, confiança, oportunidade quente
  converted: "bg-[#16a34a]", // Verde — sucesso, dinheiro, conquista
  lost: "bg-[#94a3b8]",      // Cinza frio — encerrado, neutro, sem tensão
};

function FunnelBars({ funnel, total, t }: {
  readonly funnel: FinanceDashboard["leadFunnel"]; readonly total: number; readonly t: ReturnType<typeof useTranslations>;
}) {
  const maxVal = Math.max(...Object.values(funnel).map((v) => v ?? 0), 1);

  return (
    <div className="space-y-1.5">
      {FUNNEL_ORDER.map((stage, i) => {
        const count = funnel[stage] ?? 0;
        const pct = (count / maxVal) * 100;

        const prevStage = i > 0 ? FUNNEL_ORDER[i - 1] : null;
        const prevCount = prevStage ? (funnel[prevStage] ?? 0) : 0;
        const dropRate = prevCount > 0 ? ((count / prevCount) * 100).toFixed(0) : null;

        return (
          <div className="flex items-center gap-3" key={stage}>
            <span className="w-24 text-right text-[12px] font-medium text-on-surface-variant">
              {t(`funnel.stages.${stage}`)}
            </span>
            <div className="relative h-6 flex-1 overflow-hidden rounded-md bg-surface-container-high/50">
              <motion.div
                animate={{ width: `${Math.max(pct, 4)}%` }}
                className={cn(
                  "flex h-full items-center rounded-md px-2.5",
                  count > 0 ? FUNNEL_BG[stage] : "bg-surface-container-high/80",
                )}
                initial={{ width: 0 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.15 + i * 0.07 }}
              >
                <span className={cn("text-[11px] font-bold", count > 0 ? "text-white" : "text-on-surface-variant/50")}>
                  {count}
                </span>
              </motion.div>
            </div>
            <span className="w-10 text-right text-[11px] font-medium text-on-surface-variant/60">
              {dropRate !== null ? `${dropRate}%` : ""}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

export function DashboardView({ data }: Props) {
  const t = useTranslations("dashboard");
  const status = getStatusMessage(data, t);
  const StatusIcon = STATUS_ICONS[status.variant];

  const chartData = data.charts.dailyRevenue.map((e) => ({ date: fmtChartDate(e.date), value: e.value }));
  const hasChartData = chartData.some((d) => d.value > 0);
  const isZeroRevenue = data.revenueThisMonth === 0;
  const urgencyCount = data.hotLeadsWaiting + data.overdueInvoices + data.leadsGoneCold;
  const showProjection = data.revenueProjection > 0;

  return (
    <motion.div animate="visible" className="mx-auto max-w-7xl space-y-8" initial="hidden" variants={staggerContainer}>

      {/* ═══ 1. HEADER ═══════════════════════════════════════ */}
      <motion.section className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between" variants={fadeInUp}>
        <div>
          <span className="font-body text-[11px] font-bold uppercase tracking-[0.2em] text-primary">{t("title")}</span>
          <h1 className="mt-1.5 font-display text-[2rem] font-extrabold leading-tight tracking-tight text-on-surface">
            {t(`greeting.${greetingKey()}`)}
          </h1>
        </div>
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className={cn("flex items-center gap-3 rounded-xl px-5 py-3", STATUS_STYLES[status.variant])}
          initial={{ opacity: 0, y: -8 }}
          transition={{ delay: 0.4, duration: 0.4 }}
        >
          <StatusIcon className="h-4 w-4 shrink-0" />
          <p className="text-[13px] font-semibold leading-snug">{status.text}</p>
        </motion.div>
      </motion.section>

      {/* ═══ 2. MOMENTUM ═════════════════════════════════════ */}
      <motion.section
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary-dim to-primary/80 p-8 text-on-primary"
        variants={fadeInUp}
      >
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-on-primary/[0.04]" />
        <div className="pointer-events-none absolute -bottom-20 -left-12 h-40 w-40 rounded-full bg-on-primary/[0.03]" />

        <div className="relative grid grid-cols-1 gap-8 lg:grid-cols-4 lg:items-end">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-on-primary/50" />
              <span className="text-[12px] font-semibold uppercase tracking-wider text-on-primary/50">{t("momentum.revenue")}</span>
            </div>
            <motion.p
              animate={{ opacity: 1, y: 0 }}
              className="mt-2 font-display text-5xl font-extrabold tracking-tighter lg:text-6xl"
              initial={{ opacity: 0, y: 20 }}
              transition={{ delay: 0.3, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
              {BRL.format(data.revenueThisMonth)}
            </motion.p>
            {isZeroRevenue ? (
              <p className="mt-3 text-[13px] font-medium text-on-primary/60">{t("momentum.emptyRevenue")}</p>
            ) : data.revenueGrowth !== 0 ? (
              <div className="mt-3 flex items-center gap-2">
                <span className={cn(
                  "inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold",
                  data.revenueGrowth > 0 ? "bg-on-primary/15 text-on-primary" : "bg-danger/30 text-on-primary",
                )}>
                  {data.revenueGrowth > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {data.revenueGrowth > 0 ? "+" : ""}{data.revenueGrowth.toFixed(1)}%
                </span>
                <span className="text-[12px] text-on-primary/50">{t("momentum.growth")}</span>
              </div>
            ) : null}
          </div>

          <div className="text-center">
            <span className="block text-[11px] font-semibold uppercase tracking-wider text-on-primary/50">{t("momentum.conversion")}</span>
            <span className="mt-1 block font-display text-3xl font-extrabold tracking-tight">{data.conversionRate.toFixed(0)}%</span>
          </div>
          <div className="text-center">
            <span className="block text-[11px] font-semibold uppercase tracking-wider text-on-primary/50">{t("momentum.avgTicket")}</span>
            <span className="mt-1 block font-display text-3xl font-extrabold tracking-tight">{BRL.format(data.averageTicket)}</span>
          </div>
        </div>
      </motion.section>

      {/* ═══ 3. URGENCY ══════════════════════════════════════ */}
      {urgencyCount > 0 && (
        <motion.section className="grid grid-cols-1 gap-3 sm:grid-cols-3" variants={staggerContainer}>
          {data.hotLeadsWaiting > 0 && (
            <motion.div className="flex items-center gap-4 rounded-xl border-l-4 border-warning bg-warning/6 p-5" variants={fadeInUp}>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-warning/12">
                <Flame className="h-5 w-5 text-warning" />
              </div>
              <div className="flex-1">
                <span className="block text-[14px] font-bold text-on-surface">{data.hotLeadsWaiting}</span>
                <span className="text-[12px] font-medium text-on-surface-variant">{t("urgency.hotLeads", { count: data.hotLeadsWaiting })}</span>
              </div>
              <ArrowRight className="h-4 w-4 text-warning/60" />
            </motion.div>
          )}
          {data.overdueInvoices > 0 && (
            <motion.div className="flex items-center gap-4 rounded-xl border-l-4 border-danger bg-danger/5 p-5" variants={fadeInUp}>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-danger/10">
                <AlertTriangle className="h-5 w-5 text-danger" />
              </div>
              <div className="flex-1">
                <span className="block text-[14px] font-bold text-on-surface">{data.overdueInvoices}</span>
                <span className="text-[12px] font-medium text-on-surface-variant">{t("urgency.overdueInvoices", { count: data.overdueInvoices })}</span>
                <span className="block text-[12px] font-semibold text-danger">{BRL.format(data.overdueAmount)} {t("urgency.overdueAmount")}</span>
              </div>
              <ArrowRight className="h-4 w-4 text-danger/60" />
            </motion.div>
          )}
          {data.leadsGoneCold > 0 && (
            <motion.div className="flex items-center gap-4 rounded-xl border-l-4 border-on-surface-variant/30 bg-surface-container-high/40 p-5" variants={fadeInUp}>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-surface-container-highest">
                <Snowflake className="h-5 w-5 text-on-surface-variant" />
              </div>
              <div className="flex-1">
                <span className="block text-[14px] font-bold text-on-surface">{data.leadsGoneCold}</span>
                <span className="text-[12px] font-medium text-on-surface-variant">{t("urgency.coldLeads", { count: data.leadsGoneCold })}</span>
                <span className="block text-[11px] text-on-surface-variant/70">{t("urgency.coldSubtitle")}</span>
              </div>
              <ArrowRight className="h-4 w-4 text-on-surface-variant/40" />
            </motion.div>
          )}
        </motion.section>
      )}

      {/* ═══ 4. TODAY ═════════════════════════════════════════ */}
      <motion.section variants={staggerContainer}>
        <motion.h2 className="mb-4 font-display text-lg font-bold tracking-tight text-on-surface" variants={fadeInUp}>
          {t("today.title")}
        </motion.h2>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">

          {/* Agenda */}
          <motion.div className="rounded-xl bg-surface-container-lowest p-5" variants={fadeInUp}>
            <div className="mb-4 flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-primary" />
              <span className="text-[13px] font-semibold text-on-surface">{t("today.appointments")}</span>
              {data.todayAppointments.length > 0 && (
                <span className="ml-auto rounded-md bg-primary/8 px-2 py-0.5 text-[11px] font-bold text-primary">{data.todayAppointments.length}</span>
              )}
            </div>
            {data.todayAppointments.length === 0 ? (
              <div className="flex flex-col items-center py-6 text-center">
                <Coffee className="mb-2 h-8 w-8 text-on-surface-variant/25" />
                <p className="text-[13px] leading-relaxed text-on-surface-variant">{t("today.emptyAppointments")}</p>
              </div>
            ) : (
              <div className="space-y-2">
                {data.todayAppointments.slice(0, 4).map((a) => (
                  <div className="flex items-center gap-3 rounded-lg bg-surface-container-low/40 p-3" key={a.id}>
                    <span className="w-12 shrink-0 text-center font-display text-[13px] font-bold text-primary">{a.startTime}</span>
                    <div className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-semibold text-on-surface">{a.leadName}</span>
                      <span className="text-[11px] text-on-surface-variant">{a.serviceName}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Follow-ups */}
          <motion.div className="rounded-xl bg-surface-container-lowest p-5" variants={fadeInUp}>
            <div className="mb-4 flex items-center gap-2">
              <Users className="h-4 w-4 text-teal" />
              <span className="text-[13px] font-semibold text-on-surface">{t("today.followUp")}</span>
              {data.leadsToFollowUp.length > 0 && (
                <span className="ml-auto rounded-md bg-teal/10 px-2 py-0.5 text-[11px] font-bold text-teal">{data.leadsToFollowUp.length}</span>
              )}
            </div>
            {data.leadsToFollowUp.length === 0 ? (
              <div className="flex flex-col items-center py-6 text-center">
                <CheckCircle2 className="mb-2 h-8 w-8 text-success/30" />
                <p className="text-[13px] leading-relaxed text-on-surface-variant">{t("today.emptyFollowUp")}</p>
              </div>
            ) : (
              <div className="space-y-2">
                {data.leadsToFollowUp.slice(0, 4).map((l) => (
                  <div className="flex items-center gap-3 rounded-lg bg-surface-container-low/40 p-3" key={l.id}>
                    <div className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                      l.temperature === "hot" ? "bg-warning/10" : "bg-teal/10",
                    )}>
                      <MessageSquare className={cn("h-3.5 w-3.5", l.temperature === "hot" ? "text-warning" : "text-teal")} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-semibold text-on-surface">{l.name}</span>
                      <span className="text-[11px] text-on-surface-variant">{l.channel} · {t("today.daysAgo", { days: l.daysSinceUpdate })}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Invoices due */}
          <motion.div className="rounded-xl bg-surface-container-lowest p-5" variants={fadeInUp}>
            <div className="mb-4 flex items-center gap-2">
              <Receipt className="h-4 w-4 text-warning" />
              <span className="text-[13px] font-semibold text-on-surface">{t("today.invoicesDue")}</span>
              {data.pendingInvoicesDueSoon.length > 0 && (
                <span className="ml-auto rounded-md bg-warning/10 px-2 py-0.5 text-[11px] font-bold text-warning">{data.pendingInvoicesDueSoon.length}</span>
              )}
            </div>
            {data.pendingInvoicesDueSoon.length === 0 ? (
              <div className="flex flex-col items-center py-6 text-center">
                <Inbox className="mb-2 h-8 w-8 text-on-surface-variant/25" />
                <p className="text-[13px] leading-relaxed text-on-surface-variant">{t("today.emptyInvoices")}</p>
              </div>
            ) : (
              <div className="space-y-2">
                {data.pendingInvoicesDueSoon.slice(0, 4).map((inv) => (
                  <div className="flex items-center gap-3 rounded-lg bg-surface-container-low/40 p-3" key={inv.id}>
                    <div className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                      inv.isOverdue ? "bg-danger/10" : "bg-warning/10",
                    )}>
                      <DollarSign className={cn("h-3.5 w-3.5", inv.isOverdue ? "text-danger" : "text-warning")} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-semibold text-on-surface">{inv.leadName}</span>
                      <span className="text-[11px] text-on-surface-variant">
                        {BRL.format(inv.finalAmount)} · <span className={inv.isOverdue ? "font-semibold text-danger" : ""}>{dueLabel(inv.dueDate, inv.isOverdue, t)}</span>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </motion.section>

      {/* ═══ 5 + 6. CHART + PROJECTION/FUNNEL/KPIS ══════════ */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">

        {/* Chart (3/5) */}
        <motion.section className="rounded-xl bg-surface-container-lowest p-8 lg:col-span-3" variants={fadeInUp}>
          <div className="mb-6 flex items-center justify-between">
            <h2 className="font-display text-base font-bold tracking-tight text-on-surface">{t("chart.title")}</h2>
            {data.revenueGrowth !== 0 && (
              <span className={cn(
                "inline-flex items-center gap-0.5 rounded-lg px-2 py-0.5 text-xs font-bold",
                data.revenueGrowth > 0 ? "bg-success/10 text-success" : "bg-danger/10 text-danger",
              )}>
                {data.revenueGrowth > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {data.revenueGrowth > 0 ? "+" : ""}{data.revenueGrowth.toFixed(1)}%
              </span>
            )}
          </div>
          {hasChartData ? (
            <div className="h-[260px] w-full">
              <ResponsiveContainer height="100%" width="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="revG" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.2} />
                      <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis axisLine={false} dataKey="date" fontSize={11} stroke="var(--color-on-surface-variant)" tickLine={false} tickMargin={8} />
                  <YAxis axisLine={false} fontSize={11} stroke="var(--color-on-surface-variant)" tickFormatter={(v: number) => BRL_COMPACT.format(v)} tickLine={false} tickMargin={8} width={64} />
                  <Tooltip content={<ChartTooltip />} />
                  <Area dataKey="value" fill="url(#revG)" stroke="var(--color-primary)" strokeWidth={2.5} type="monotone" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex h-[260px] flex-col items-center justify-center text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/6">
                <TrendingUp className="h-7 w-7 text-primary/30" />
              </div>
              <p className="max-w-xs text-[14px] font-medium leading-relaxed text-on-surface-variant">
                {t("chart.empty")}
              </p>
              <p className="mt-1 text-[12px] text-on-surface-variant/60">
                {t("chart.emptyHint")}
              </p>
            </div>
          )}
        </motion.section>

        {/* Right column (2/5) */}
        <div className="space-y-5 lg:col-span-2">

          {/* Projection */}
          {showProjection && (
            <motion.section className="relative overflow-hidden rounded-xl bg-gradient-to-br from-teal/10 via-teal/5 to-transparent p-6" variants={fadeInUp}>
              <div className="pointer-events-none absolute -bottom-8 -right-8 h-24 w-24 rounded-full bg-teal/5" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-teal">{t("projection.label")}</span>
              <motion.p
                animate={{ opacity: 1 }}
                className="mt-2 font-display text-3xl font-extrabold tracking-tighter text-on-surface"
                initial={{ opacity: 0 }}
                transition={{ delay: 0.5 }}
              >
                {BRL.format(data.revenueProjection)}
              </motion.p>
              {data.bestService && (
                <div className="mt-4 flex items-center gap-3 rounded-lg bg-surface-container-lowest/80 p-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal/10">
                    <Trophy className="h-4 w-4 text-teal" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-semibold text-on-surface">{data.bestService.serviceName}</span>
                    <span className="text-[11px] text-on-surface-variant">
                      {BRL.format(data.bestService.revenue)} · {data.bestService.percentage.toFixed(0)}% {t("projection.ofRevenue")}
                    </span>
                  </div>
                </div>
              )}
            </motion.section>
          )}

          {/* Funnel */}
          <motion.section className="rounded-xl bg-surface-container-lowest p-6" variants={fadeInUp}>
            <div className="mb-1 flex items-center justify-between">
              <h2 className="font-display text-base font-bold tracking-tight text-on-surface">{t("funnel.title")}</h2>
              <span className="font-display text-lg font-extrabold tracking-tight text-on-surface">{data.totalLeads}</span>
            </div>
            {data.newLeadsThisMonth > 0 && (
              <p className="mb-4 text-[12px] font-semibold text-success">{t("funnel.thisMonth", { count: data.newLeadsThisMonth })}</p>
            )}
            {!data.newLeadsThisMonth && <div className="mb-4" />}
            <FunnelBars funnel={data.leadFunnel} t={t} total={data.totalLeads} />
          </motion.section>

          {/* KPIs strip */}
          <motion.div className="flex items-center justify-around rounded-xl bg-surface-container-lowest p-5" variants={fadeInUp}>
            <RadialProgress label={t("kpis.collection")} value={data.collectionRate} />
            <div className="h-12 w-px bg-surface-container-high" />
            <div className="flex flex-col items-center">
              <span className="font-display text-2xl font-extrabold tracking-tighter text-on-surface">{data.invoiceCount}</span>
              <span className="text-[11px] text-on-surface-variant">{t("kpis.invoices")}</span>
            </div>
            <div className="h-12 w-px bg-surface-container-high" />
            <div className="flex flex-col items-center">
              <span className="font-display text-2xl font-extrabold tracking-tighter text-on-surface">
                {data.roi > 0 ? `${data.roi.toFixed(1)}x` : "—"}
              </span>
              <span className="text-[11px] text-on-surface-variant">{t("kpis.roi")}</span>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
