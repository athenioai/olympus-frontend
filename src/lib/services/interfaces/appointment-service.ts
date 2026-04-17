export interface Appointment {
  readonly id: string;
  readonly serviceId: string;
  readonly date: string;
  readonly startTime: string;
  readonly endTime: string;
  readonly status: "confirmed" | "cancelled";
  readonly createdAt: string;
}

export interface PaginatedAppointments {
  readonly data: Appointment[];
  readonly total: number;
  readonly page: number;
  readonly limit: number;
}

export interface ListAppointmentsParams {
  readonly page?: number;
  readonly limit?: number;
  readonly status?: "confirmed" | "cancelled";
  readonly dateFrom?: string;
  readonly dateTo?: string;
}

export interface IAppointmentService {
  list(params?: ListAppointmentsParams): Promise<PaginatedAppointments>;
  getById(id: string): Promise<Appointment>;
}
