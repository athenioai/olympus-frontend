export type AppointmentStatus =
  | "confirmed"
  | "cancelled"
  | "attended"
  | "no_show";

export interface Appointment {
  readonly id: string;
  readonly leadId: string;
  /** Null only while the lead hasn't completed the onboarding wizard. */
  readonly leadName: string | null;
  readonly leadPhone: string | null;
  readonly serviceId: string;
  /** Null when the backing service was removed after the appointment was created. */
  readonly serviceName: string | null;
  readonly date: string;
  readonly startTime: string;
  readonly endTime: string;
  readonly status: AppointmentStatus;
  readonly notes: string | null;
  readonly createdAt: string;
}

export interface PaginatedAppointments {
  readonly items: Appointment[];
  readonly total: number;
  readonly page: number;
  readonly limit: number;
}

export interface ListAppointmentsParams {
  readonly page?: number;
  readonly limit?: number;
  readonly status?: AppointmentStatus;
  readonly leadId?: string;
  readonly serviceId?: string;
  /** YYYY-MM-DD. */
  readonly dateFrom?: string;
  readonly dateTo?: string;
  /** ISO 8601 with offset. */
  readonly createdAfter?: string;
  readonly createdBefore?: string;
}

export interface CalendarDaySummary {
  readonly appointmentCount: number;
  readonly isException: boolean;
  readonly exceptionType: "closed" | "special_hours" | null;
  readonly exceptionReason: string | null;
}

export interface CalendarMonthSummary {
  /** Echo of the input, e.g. "2026-04". */
  readonly month: string;
  /** Keys are "YYYY-MM-DD". Days with no activity are omitted. */
  readonly days: Record<string, CalendarDaySummary>;
}

export interface IAppointmentService {
  list(params?: ListAppointmentsParams): Promise<PaginatedAppointments>;
  getById(id: string): Promise<Appointment>;
  getMonthSummary(month: string): Promise<CalendarMonthSummary>;
}
