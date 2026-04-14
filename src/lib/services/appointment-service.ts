import { authFetch } from "./auth-fetch";
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
    if (params?.date_from) searchParams.set("date_from", params.date_from);
    if (params?.date_to) searchParams.set("date_to", params.date_to);
    if (params?.user_id) searchParams.set("user_id", params.user_id);

    const query = searchParams.toString();
    const path = query ? `/appointments?${query}` : "/appointments";

    const response = await authFetch(path);

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(
        errorData?.message ?? "Failed to list appointments",
      );
    }

    return response.json();
  }

  /**
   * Get a single appointment by ID.
   * @param id - The appointment ID
   * @returns The appointment data
   * @throws Error if the appointment is not found or request fails
   */
  async getById(id: string): Promise<Appointment> {
    const response = await authFetch(`/appointments/${id}`);

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(
        errorData?.message ?? "Failed to fetch appointment",
      );
    }

    return response.json();
  }
}

export const appointmentService = new AppointmentService();
