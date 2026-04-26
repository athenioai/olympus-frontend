import type {
  AdminAppointment,
  AdminCalendarConfig,
  AdminChat,
  AdminChatMessage,
  AdminUserPublic,
  UpdateCalendarConfigPayload,
  UserDashboardSummary,
  UserRole,
} from "./admin-types";

export type OnboardingStatus = "pending" | "completed";

export interface AdminUserOption {
  readonly id: string;
  readonly email: string;
  readonly name: string | null;
}

export interface ListAdminUsersParams {
  readonly page?: number;
  readonly limit?: number;
  readonly search?: string;
  readonly role?: UserRole;
  readonly onboardingStatus?: OnboardingStatus;
}

export interface PaginatedAdminUsers {
  readonly items: readonly AdminUserPublic[];
  readonly total: number;
  readonly page: number;
  readonly limit: number;
}

export interface CreateAdminUserPayload {
  readonly email: string;
}

export interface UpdateAdminUserPayload {
  readonly name?: string;
  readonly email?: string;
  readonly role?: UserRole;
}

export interface SeedHolidaysPayload {
  readonly years?: readonly number[];
}

export interface IAdminUserService {
  create(payload: CreateAdminUserPayload): Promise<AdminUserPublic>;
  list(params?: ListAdminUsersParams): Promise<PaginatedAdminUsers>;
  listOptions(): Promise<readonly AdminUserOption[]>;
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
    chatId: string,
  ): Promise<readonly AdminChatMessage[]>;
  getCalendarConfig(id: string): Promise<AdminCalendarConfig | null>;
  updateCalendarConfig(
    id: string,
    payload: UpdateCalendarConfigPayload,
  ): Promise<AdminCalendarConfig>;
}
