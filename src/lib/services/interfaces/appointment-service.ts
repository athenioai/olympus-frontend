export interface Appointment {
  readonly id: string;
  readonly sessionId: string;
  readonly leadName: string;
  readonly serviceType: string;
  readonly date: string;
  readonly startTime: string;
  readonly endTime: string;
  readonly status: "confirmed" | "cancelled";
  readonly createdAt: string;
}

export interface AppointmentPagination {
  readonly page: number;
  readonly limit: number;
  readonly total: number;
}

export interface PaginatedAppointments {
  readonly data: Appointment[];
  readonly pagination: AppointmentPagination;
}

export interface ListAppointmentsParams {
  readonly page?: number;
  readonly limit?: number;
  readonly status?: "confirmed" | "cancelled";
  readonly date_from?: string;
  readonly date_to?: string;
  readonly user_id?: string;
}

export interface IAppointmentService {
  list(params?: ListAppointmentsParams): Promise<PaginatedAppointments>;
  getById(id: string): Promise<Appointment>;
}
