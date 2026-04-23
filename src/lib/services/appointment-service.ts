import { authFetch } from "./auth-fetch";
import { unwrapEnvelope } from "@/lib/api-envelope";
import { CACHE_TIMES, CACHE_TAGS } from "@/lib/cache-config";
import type {
  Appointment,
  CalendarMonthSummary,
  IAppointmentService,
  ListAppointmentsParams,
  PaginatedAppointments,
} from "./interfaces/appointment-service";

class AppointmentService implements IAppointmentService {
  async list(
    params?: ListAppointmentsParams,
  ): Promise<PaginatedAppointments> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set("page", String(params.page));
    if (params?.limit) searchParams.set("limit", String(params.limit));
    if (params?.status) searchParams.set("status", params.status);
    if (params?.leadId) searchParams.set("leadId", params.leadId);
    if (params?.serviceId) searchParams.set("serviceId", params.serviceId);
    if (params?.dateFrom) searchParams.set("dateFrom", params.dateFrom);
    if (params?.dateTo) searchParams.set("dateTo", params.dateTo);
    if (params?.createdAfter) {
      searchParams.set("createdAfter", params.createdAfter);
    }
    if (params?.createdBefore) {
      searchParams.set("createdBefore", params.createdBefore);
    }

    const query = searchParams.toString();
    const path = query ? `/appointments?${query}` : "/appointments";

    const response = await authFetch(path, {
      revalidate: CACHE_TIMES.calendar,
      tags: [CACHE_TAGS.appointments],
    });
    return unwrapEnvelope<PaginatedAppointments>(response);
  }

  async getById(id: string): Promise<Appointment> {
    const response = await authFetch(`/appointments/${id}`);
    return unwrapEnvelope<Appointment>(response);
  }

  async getMonthSummary(month: string): Promise<CalendarMonthSummary> {
    const response = await authFetch(
      `/calendar/month?month=${encodeURIComponent(month)}`,
      {
        revalidate: CACHE_TIMES.calendar,
        tags: [CACHE_TAGS.appointments],
      },
    );
    return unwrapEnvelope<CalendarMonthSummary>(response);
  }
}

export const appointmentService = new AppointmentService();
