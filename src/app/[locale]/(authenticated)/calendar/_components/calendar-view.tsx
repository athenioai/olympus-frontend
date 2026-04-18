"use client";

import { useMemo } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatTime, getMonday, addDays, formatISODate } from "@/lib/format";
import type { Appointment } from "@/lib/services";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ViewMode = "day" | "week" | "month";

interface CalendarViewProps {
  readonly appointments: readonly Appointment[];
  readonly currentDate: string;
  readonly currentView: ViewMode;
  readonly currentStatus?: "confirmed" | "cancelled";
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const HOUR_START = 6;
const HOUR_END = 22;
const HOURS = Array.from({ length: HOUR_END - HOUR_START }, (_, i) => i + HOUR_START);

const WEEKDAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Format an hour number as a time label (e.g., "08:00").
 * @param hour - Hour number (0-23)
 * @returns Formatted time string
 */
function formatHourLabel(hour: number): string {
  return `${String(hour).padStart(2, "0")}:00`;
}

/**
 * Parse a time string (HH:MM) to get the hour as a number.
 * @param time - Time string like "14:30"
 * @returns Hour number
 */
function getHourFromTime(time: string): number {
  return parseInt(time.split(":")[0] ?? "0", 10);
}

/**
 * Get all dates in a month as a 2D array of weeks.
 * @param year - Year number
 * @param month - Month number (0-indexed)
 * @returns Array of weeks, each containing 7 Date objects
 */
function getMonthGrid(year: number, month: number): Date[][] {
  const firstDay = new Date(year, month, 1);
  const monday = getMonday(firstDay);
  const weeks: Date[][] = [];

  let current = new Date(monday);
  for (let w = 0; w < 6; w++) {
    const week: Date[] = [];
    for (let d = 0; d < 7; d++) {
      week.push(new Date(current));
      current = addDays(current, 1);
    }
    weeks.push(week);

    // Stop if we've passed the end of the month
    if (current.getMonth() !== month && w >= 3) break;
  }

  return weeks;
}

// ---------------------------------------------------------------------------
// Status badge
// ---------------------------------------------------------------------------

function StatusBadge({ status }: { readonly status: "confirmed" | "cancelled" }) {
  const t = useTranslations("calendar");
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium",
        status === "confirmed"
          ? "bg-success-muted text-success"
          : "bg-danger-muted text-danger",
      )}
    >
      {t(`status.${status}`)}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Appointment card
// ---------------------------------------------------------------------------

function AppointmentCard({ appointment }: { readonly appointment: Appointment }) {
  return (
    <div
      className={cn(
        "rounded-lg p-2 text-xs transition-colors",
        appointment.status === "confirmed"
          ? "bg-primary/8 text-on-surface"
          : "bg-danger-muted text-on-surface-variant line-through",
      )}
    >
      <div className="font-medium">
        {appointment.startTime.slice(0, 5)} - {appointment.endTime.slice(0, 5)}
      </div>
      <div className="text-on-surface-variant">
        {appointment.status === "confirmed" ? "Confirmado" : "Cancelado"}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Day view
// ---------------------------------------------------------------------------

function DayView({
  appointments,
  date,
}: {
  readonly appointments: readonly Appointment[];
  readonly date: string;
}) {
  const t = useTranslations("calendar");
  const dayAppointments = appointments.filter((a) => a.date === date);

  return (
    <div className="flex min-h-0 flex-1 flex-col rounded-xl bg-surface-container-lowest">
      <div className="flex-1 overflow-y-auto">
        {HOURS.map((hour) => {
          const hourApps = dayAppointments.filter(
            (a) => getHourFromTime(a.startTime) === hour,
          );

          return (
            <div
              className="flex min-h-[64px] border-b border-surface-container-high/30 last:border-b-0"
              key={hour}
            >
              <div className="w-16 shrink-0 px-3 py-2 text-xs text-on-surface-variant">
                {formatHourLabel(hour)}
              </div>
              <div className="flex-1 space-y-1 px-2 py-1">
                {hourApps.map((app) => (
                  <AppointmentCard appointment={app} key={app.id} />
                ))}
              </div>
            </div>
          );
        })}
        {dayAppointments.length === 0 && (
          <div className="flex min-h-[200px] items-center justify-center">
            <p className="text-sm text-on-surface-variant">{t("noAppointments")}</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Week view
// ---------------------------------------------------------------------------

function WeekView({
  appointments,
  weekStart,
}: {
  readonly appointments: readonly Appointment[];
  readonly weekStart: Date;
}) {
  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart],
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-x-auto rounded-xl bg-surface-container-lowest">
      <div className="min-w-[800px]">
        {/* Header — sticky */}
        <div className="sticky top-0 z-10 grid grid-cols-[64px_repeat(7,1fr)] bg-surface-container-lowest">
          <div className="px-3 py-3" />
          {days.map((day, i) => {
            const iso = formatISODate(day);
            const isToday = iso === formatISODate(new Date());
            return (
              <div
                className={cn(
                  "px-2 py-3 text-center text-xs font-semibold uppercase tracking-wider",
                  isToday ? "text-primary" : "text-on-surface-variant",
                )}
                key={iso}
              >
                <span>{WEEKDAY_KEYS[i]}</span>
                <span
                  className={cn(
                    "ml-1.5 inline-flex h-6 w-6 items-center justify-center rounded-full text-xs",
                    isToday && "bg-primary text-on-primary",
                  )}
                >
                  {day.getDate()}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Time grid — scrollable */}
      <div className="min-w-[800px] flex-1 overflow-y-auto">
        {HOURS.map((hour) => (
          <div
            className="grid min-h-[52px] grid-cols-[64px_repeat(7,1fr)] border-t border-surface-container-high/30"
            key={hour}
          >
            <div className="px-3 py-1 text-xs text-on-surface-variant">
              {formatHourLabel(hour)}
            </div>
            {days.map((day) => {
              const iso = formatISODate(day);
              const cellApps = appointments.filter(
                (a) => a.date === iso && getHourFromTime(a.startTime) === hour,
              );
              return (
                <div className="space-y-1 px-1 py-1" key={iso}>
                  {cellApps.map((app) => (
                    <AppointmentCard appointment={app} key={app.id} />
                  ))}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Month view
// ---------------------------------------------------------------------------

function MonthView({
  appointments,
  year,
  month,
}: {
  readonly appointments: readonly Appointment[];
  readonly year: number;
  readonly month: number;
}) {
  const weeks = useMemo(() => getMonthGrid(year, month), [year, month]);

  return (
    <div className="overflow-x-auto rounded-xl bg-surface-container-lowest">
      <div className="min-w-[600px]">
        {/* Header */}
        <div className="grid grid-cols-7">
          {WEEKDAY_KEYS.map((day) => (
            <div
              className="px-2 py-3 text-center text-xs font-semibold uppercase tracking-wider text-on-surface-variant"
              key={day}
            >
              {day}
            </div>
          ))}
        </div>

        {/* Weeks */}
        {weeks.map((week, wi) => (
          <div className="grid grid-cols-7 border-t border-surface-container-high/30" key={wi}>
            {week.map((day) => {
              const iso = formatISODate(day);
              const isCurrentMonth = day.getMonth() === month;
              const isToday = iso === formatISODate(new Date());
              const dayApps = appointments.filter((a) => a.date === iso);

              return (
                <div
                  className={cn(
                    "min-h-[80px] p-2",
                    !isCurrentMonth && "opacity-40",
                  )}
                  key={iso}
                >
                  <span
                    className={cn(
                      "inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium",
                      isToday
                        ? "bg-primary text-on-primary"
                        : "text-on-surface",
                    )}
                  >
                    {day.getDate()}
                  </span>
                  <div className="mt-1 space-y-0.5">
                    {dayApps.slice(0, 3).map((app) => (
                      <div
                        className={cn(
                          "truncate rounded px-1 py-0.5 text-[10px] font-medium",
                          app.status === "confirmed"
                            ? "bg-primary/8 text-primary"
                            : "bg-danger-muted text-danger",
                        )}
                        key={app.id}
                      >
                        {app.startTime.slice(0, 5)} - {app.endTime.slice(0, 5)}
                      </div>
                    ))}
                    {dayApps.length > 3 && (
                      <div className="text-[10px] text-on-surface-variant">
                        +{dayApps.length - 3}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function CalendarView({
  appointments,
  currentDate,
  currentView,
  currentStatus,
}: CalendarViewProps) {
  const t = useTranslations("calendar");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const dateObj = useMemo(() => new Date(currentDate + "T00:00:00"), [currentDate]);

  /**
   * Update URL search params for navigation.
   */
  function updateParams(updates: Record<string, string | undefined>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value === undefined || value === "") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    }
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  }

  function navigateDate(direction: -1 | 1) {
    let newDate: Date;
    if (currentView === "day") {
      newDate = addDays(dateObj, direction);
    } else if (currentView === "week") {
      newDate = addDays(dateObj, direction * 7);
    } else {
      newDate = new Date(dateObj);
      newDate.setMonth(newDate.getMonth() + direction);
    }
    updateParams({ date: formatISODate(newDate) });
  }

  function handleViewChange(view: ViewMode) {
    updateParams({ view });
  }

  function handleStatusFilter(status: string) {
    updateParams({
      status: status === "all" ? undefined : status,
    });
  }

  // Date display label
  const dateLabel = useMemo(() => {
    if (currentView === "day") {
      return dateObj.toLocaleDateString("pt-BR", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    }
    if (currentView === "week") {
      const monday = getMonday(dateObj);
      const sunday = addDays(monday, 6);
      return `${monday.getDate()}/${monday.getMonth() + 1} - ${sunday.getDate()}/${sunday.getMonth() + 1}/${sunday.getFullYear()}`;
    }
    return dateObj.toLocaleDateString("pt-BR", {
      month: "long",
      year: "numeric",
    });
  }, [dateObj, currentView]);

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-4" style={{ height: "calc(100vh - 8rem)" }}>
      {/* Title */}
      <h1 className="shrink-0 font-display text-3xl font-extrabold tracking-tight text-on-surface">
        {t("title")}
      </h1>

      {/* Controls */}
      <div className="mt-6 flex shrink-0 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* View tabs */}
        <div className="flex gap-1 rounded-xl bg-surface-container-high p-1">
          {(["day", "week", "month"] as const).map((view) => (
            <button
              className={cn(
                "rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                currentView === view
                  ? "bg-surface-container-lowest text-on-surface ring-1 ring-black/5"
                  : "text-on-surface-variant hover:text-on-surface",
              )}
              key={view}
              onClick={() => handleViewChange(view)}
              type="button"
            >
              {t(`views.${view}`)}
            </button>
          ))}
        </div>

        {/* Status filter */}
        <div className="flex gap-1 rounded-xl bg-surface-container-high p-1">
          {(["all", "confirmed", "cancelled"] as const).map((status) => (
            <button
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                (currentStatus ?? "all") === status
                  ? "bg-surface-container-lowest text-on-surface ring-1 ring-black/5"
                  : "text-on-surface-variant hover:text-on-surface",
              )}
              key={status}
              onClick={() => handleStatusFilter(status)}
              type="button"
            >
              {status === "all" ? "All" : t(`status.${status}`)}
            </button>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div className="mt-4 flex shrink-0 items-center gap-4">
        <button
          className="rounded-lg p-2 text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface"
          onClick={() => navigateDate(-1)}
          type="button"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h2 className="font-display text-lg font-bold capitalize tracking-tight text-on-surface">
          {dateLabel}
        </h2>
        <button
          className="rounded-lg p-2 text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface"
          onClick={() => navigateDate(1)}
          type="button"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Calendar content — fills remaining space */}
      {currentView === "day" && (
        <DayView appointments={appointments} date={currentDate} />
      )}
      {currentView === "week" && (
        <WeekView
          appointments={appointments}
          weekStart={getMonday(dateObj)}
        />
      )}
      {currentView === "month" && (
        <MonthView
          appointments={appointments}
          month={dateObj.getMonth()}
          year={dateObj.getFullYear()}
        />
      )}
    </div>
  );
}
