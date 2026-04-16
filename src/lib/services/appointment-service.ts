import { authFetch } from "./auth-fetch";
import { unwrapEnvelope } from "@/lib/api-envelope";
import type {
  Appointment,
  IAppointmentService,
  ListAppointmentsParams,
  PaginatedAppointments,
} from "./interfaces/appointment-service";

class AppointmentService implements IAppointmentService {
  /**
   * List appointments with optional filtering and pagination.
   * @param params - Optional filters: page, limit, status, date_from, date_to, user_id
   * @returns Paginated list of appointments
   * @throws Error if the request fails
   */
  async list(
    params?: ListAppointmentsParams,
  ): Promise<PaginatedAppointments> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set("page", String(params.page));
    if (params?.limit) searchParams.set("limit", String(params.limit));
    if (params?.status) searchParams.set("status", params.status);
    if (params?.dateFrom) searchParams.set("dateFrom", params.dateFrom);
    if (params?.dateTo) searchParams.set("dateTo", params.dateTo);

    const query = searchParams.toString();
    const path = query ? `/appointments?${query}` : "/appointments";

    const response = await authFetch(path);
    return unwrapEnvelope<PaginatedAppointments>(response);
  }

  /**
   * Get a single appointment by ID.
   * @param id - The appointment ID
   * @returns The appointment data
   * @throws Error if the appointment is not found or request fails
   */
  async getById(id: string): Promise<Appointment> {
    const response = await authFetch(`/appointments/${id}`);
    return unwrapEnvelope<Appointment>(response);
  }
}

export const appointmentService = new AppointmentService();
