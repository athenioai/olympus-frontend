"use client";

import { useTranslations } from "next-intl";
import { motion } from "motion/react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  DollarSign,
  Clock,
  AlertTriangle,
  TrendingUp,
  MessageSquare,
  CalendarDays,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { fadeInUp, staggerContainer } from "@/lib/motion";
import type { FinanceDashboard } from "@/lib/services";

interface DashboardViewProps {
  readonly data: FinanceDashboard;
}

const BRL_FORMAT = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const COMPACT_BRL_FORMAT = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  notation: "compact",
  maximumFractionDigits: 1,
});

/**
 * Determine the time-of-day greeting key based on current hour.
 * @returns Translation key suffix: "morning" | "afternoon" | "evening"
 */
function getGreetingKey(): "morning" | "afternoon" | "evening" {
  const hour = new Date().getHours();
  if (hour < 12) return "morning";
  if (hour < 18) return "afternoon";
  return "evening";
}

/**
 * Format a daily revenue date string (YYYY-MM-DD) as "DD/MM".
 * @param dateStr - ISO date string
 * @returns Formatted short date
 */
function formatChartDate(dateStr: string): string {
  const parts = dateStr.split("-");
  return `${parts[2]}/${parts[1]}`;
}

interface MetricCardProps {
  readonly label: string;
  readonly value: string;
  readonly icon: React.ComponentType<{ className?: string }>;
  readonly variant?: "default" | "warning" | "danger";
}

function MetricCard({
  label,
  value,
  icon: Icon,
  variant = "default",
}: MetricCardProps) {
  const iconColorClass = cn(
    "h-5 w-5",
    variant === "danger" && "text-danger",
    variant === "warning" && "text-warning",
    variant === "default" && "text-primary",
  );

  const iconBgClass = cn(
    "flex h-10 w-10 items-center justify-center rounded-xl",
    variant === "danger" && "bg-danger-muted",
    variant === "warning" && "bg-warning-muted",
    variant === "default" && "bg-primary/8",
  );

  return (
    <motion.div
      className="flex min-h-[160px] flex-col justify-between rounded-xl bg-surface-container-lowest p-8 transition-transform hover:-translate-y-0.5"
      variants={fadeInUp}
    >
      <div className="flex items-center justify-between">
        <span className="font-body text-sm font-medium tracking-tight text-on-surface-variant">
          {label}
        </span>
        <div className={iconBgClass}>
          <Icon className={iconColorClass} />
        </div>
      </div>
      <span className="font-display text-4xl font-extrabold tracking-tighter text-on-surface">
        {value}
      </span>
    </motion.div>
  );
}

interface OperationalCardProps {
  readonly label: string;
  readonly value: number;
  readonly icon: React.ComponentType<{ className?: string }>;
}

function OperationalCard({ label, value, icon: Icon }: OperationalCardProps) {
  return (
    <motion.div
      className="flex items-center gap-4 rounded-xl bg-surface-container-lowest p-6 transition-colors hover:bg-surface-container-low"
      variants={fadeInUp}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/8">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <div>
        <span className="block font-display text-2xl font-extrabold tracking-tighter text-on-surface">
          {value}
        </span>
        <span className="font-body text-sm text-on-surface-variant">
          {label}
        </span>
      </div>
    </motion.div>
  );
}

/**
 * Custom tooltip for the daily revenue area chart.
 */
function ChartTooltip({
  active,
  payload,
  label,
}: {
  readonly active?: boolean;
  readonly payload?: ReadonlyArray<{ readonly value?: number }>;
  readonly label?: string;
}) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-lg bg-surface-container-lowest px-4 py-3 shadow-ambient">
      <p className="mb-1 font-body text-xs text-on-surface-variant">
        {label}
      </p>
      <p className="font-display text-sm font-bold text-on-surface">
        {BRL_FORMAT.format(payload[0]?.value ?? 0)}
      </p>
    </div>
  );
}

export function DashboardView({ data }: DashboardViewProps) {
  const t = useTranslations("dashboard");
  const greetingKey = getGreetingKey();

  const chartData = data.dailyRevenue.map((entry) => ({
    date: formatChartDate(entry.date),
    amount: entry.amount,
  }));

  const roiDisplay =
    data.roi !== null
      ? `${data.roi >= 0 ? "+" : ""}${data.roi.toFixed(0)}%`
      : "N/A";

  return (
    <motion.div
      animate="visible"
      className="mx-auto max-w-7xl space-y-10"
      initial="hidden"
      variants={staggerContainer}
    >
      {/* Greeting */}
      <motion.section variants={fadeInUp}>
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-on-surface">
          {t(`greeting.${greetingKey}`)}
        </h1>
      </motion.section>

      {/* Financial Metrics */}
      <motion.section
        className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4"
        variants={staggerContainer}
      >
        <MetricCard
          icon={DollarSign}
          label={t("revenue")}
          value={BRL_FORMAT.format(data.revenueThisMonth)}
        />
        <MetricCard
          icon={Clock}
          label={t("pending")}
          value={BRL_FORMAT.format(data.pendingAmount)}
          variant="warning"
        />
        <MetricCard
          icon={AlertTriangle}
          label={t("overdue")}
          value={BRL_FORMAT.format(data.overdueAmount)}
          variant="danger"
        />
        <MetricCard
          icon={TrendingUp}
          label={t("averageTicket")}
          value={BRL_FORMAT.format(data.averageTicket)}
        />
      </motion.section>

      {/* Operational Metrics */}
      <motion.section
        className="grid grid-cols-1 gap-6 sm:grid-cols-3"
        variants={staggerContainer}
      >
        <OperationalCard
          icon={MessageSquare}
          label={t("conversations")}
          value={data.conversationsThisMonth}
        />
        <OperationalCard
          icon={CalendarDays}
          label={t("appointments")}
          value={data.appointmentsThisMonth}
        />
        <OperationalCard
          icon={Users}
          label={t("leads")}
          value={data.leadsThisMonth}
        />
      </motion.section>

      {/* Daily Revenue Chart + ROI */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        {/* Chart */}
        <motion.section
          className="rounded-xl bg-surface-container-lowest p-8 lg:col-span-3"
          variants={fadeInUp}
        >
          <h2 className="mb-6 font-display text-lg font-bold tracking-tight text-on-surface">
            {t("dailyRevenue")}
          </h2>
          <div className="h-[280px] w-full">
            <ResponsiveContainer height="100%" width="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient
                    id="revenueGradient"
                    x1="0"
                    x2="0"
                    y1="0"
                    y2="1"
                  >
                    <stop
                      offset="0%"
                      stopColor="var(--color-primary)"
                      stopOpacity={0.15}
                    />
                    <stop
                      offset="100%"
                      stopColor="var(--color-primary)"
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  stroke="var(--color-surface-container-high)"
                  strokeDasharray="3 3"
                  vertical={false}
                />
                <XAxis
                  axisLine={false}
                  dataKey="date"
                  fontSize={12}
                  stroke="var(--color-on-surface-variant)"
                  tickLine={false}
                  tickMargin={8}
                />
                <YAxis
                  axisLine={false}
                  fontSize={12}
                  stroke="var(--color-on-surface-variant)"
                  tickFormatter={(value: number) =>
                    COMPACT_BRL_FORMAT.format(value)
                  }
                  tickLine={false}
                  tickMargin={8}
                  width={72}
                />
                <Tooltip content={<ChartTooltip />} />
                <Area
                  dataKey="amount"
                  fill="url(#revenueGradient)"
                  stroke="var(--color-primary)"
                  strokeWidth={2}
                  type="monotone"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.section>

        {/* ROI Card */}
        <motion.section
          className="flex flex-col items-center justify-center rounded-xl bg-surface-container-lowest p-8"
          variants={fadeInUp}
        >
          <span className="mb-2 font-body text-sm font-medium text-on-surface-variant">
            {t("roi")}
          </span>
          <span
            className={cn(
              "font-display text-5xl font-extrabold tracking-tighter",
              data.roi !== null && data.roi > 0
                ? "text-success"
                : data.roi !== null && data.roi < 0
                  ? "text-danger"
                  : "text-on-surface-variant",
            )}
          >
            {roiDisplay}
          </span>
        </motion.section>
      </div>
    </motion.div>
  );
}
