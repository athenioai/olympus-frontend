import { appointmentService } from "@/lib/services";
import { getMonday, addDays, formatISODate } from "@/lib/format";
import { CalendarView } from "./_components/calendar-view";

interface CalendarPageProps {
  readonly searchParams: Promise<{
    view?: string;
    date?: string;
    status?: string;
  }>;
}

/**
 * Calendar page — Server Component that fetches appointments
 * based on the current view and date range, then delegates
 * rendering to the client CalendarView.
 */
export default async function CalendarPage({ searchParams }: CalendarPageProps) {
  const params = await searchParams;

  const view = (params.view === "day" || params.view === "month")
    ? params.view
    : "week";

  const today = formatISODate(new Date());
  const dateStr = params.date ?? today;
  const dateObj = new Date(dateStr + "T00:00:00");

  const status =
    params.status === "confirmed" || params.status === "cancelled"
      ? params.status
      : undefined;

  // Compute date range based on view
  let dateFrom: string;
  let dateTo: string;

  if (view === "day") {
    dateFrom = dateStr;
    dateTo = dateStr;
  } else if (view === "week") {
    const monday = getMonday(dateObj);
    dateFrom = formatISODate(monday);
    dateTo = formatISODate(addDays(monday, 6));
  } else {
    // month view: first day to last day of month
    const firstOfMonth = new Date(dateObj.getFullYear(), dateObj.getMonth(), 1);
    const lastOfMonth = new Date(dateObj.getFullYear(), dateObj.getMonth() + 1, 0);
    // Extend to include full weeks in the grid
    dateFrom = formatISODate(getMonday(firstOfMonth));
    dateTo = formatISODate(addDays(lastOfMonth, 6 - lastOfMonth.getDay() || 7));
  }

  try {
    const result = await appointmentService.list({
      dateFrom,
      dateTo,
      status,
      limit: 100,
    });

    return (
      <CalendarView
        appointments={result.items}
        currentDate={dateStr}
        currentStatus={status}
        currentView={view}
      />
    );
  } catch (err) {
    console.error("[CALENDAR ERROR]", err);
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-sm text-on-surface-variant">
          Failed to load calendar data. Please try again later.
        </p>
      </div>
    );
  }
}
