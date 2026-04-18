import type {
  AdminAppointment,
  AdminCalendarConfig,
  AdminChat,
  AdminChatMessage,
  AdminUserPublic,
  UpdateCalendarConfigPayload,
  UserDashboardSummary,
  UserRole,
  WorkType,
} from "./admin-types";

export interface CreateAdminUserPayload {
  readonly name: string;
  readonly email: string;
  readonly planId?: string;
  readonly workType: WorkType;
}

export interface UpdateAdminUserPayload {
  readonly name?: string;
  readonly email?: string;
  readonly planId?: string;
  readonly workType?: WorkType;
  readonly role?: UserRole;
}

export interface SeedHolidaysPayload {
  readonly years?: readonly number[];
}

export interface IAdminUserService {
  create(payload: CreateAdminUserPayload): Promise<AdminUserPublic>;
  list(): Promise<readonly AdminUserPublic[]>;
  getById(id: string): Promise<AdminUserPublic>;
  update(
    id: string,
    payload: UpdateAdminUserPayload,
  ): Promise<AdminUserPublic>;
  seedHolidays(payload?: SeedHolidaysPayload): Promise<unknown>;
  getDashboard(id: string): Promise<UserDashboardSummary>;
  getAppointments(id: string): Promise<readonly AdminAppointment[]>;
  getChats(id: string): Promise<readonly AdminChat[]>;
  getChatMessages(
    id: string,
    sessionId: string,
  ): Promise<readonly AdminChatMessage[]>;
  getCalendarConfig(id: string): Promise<AdminCalendarConfig | null>;
  updateCalendarConfig(
    id: string,
    payload: UpdateCalendarConfigPayload,
  ): Promise<AdminCalendarConfig>;
}
