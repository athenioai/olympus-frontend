/**
 * Shared enums and response shapes for admin endpoints.
 * Mirrors the "Admin API Contract — Olympus Backend" document.
 */

export type UserRole = "admin" | "user";
export type WorkType = "services" | "sales" | "hybrid";
export type SubscriptionStatus = "active" | "suspended" | "cancelled";
export type AdminInvoiceStatus =
  | "pending"
  | "paid"
  | "overdue"
  | "cancelled";
export type LateInterestType = "simple" | "compound";
export type AppointmentStatus =
  | "confirmed"
  | "cancelled"
  | "attended"
  | "no_show";

export interface AdminUserPublic {
  readonly id: string;
  readonly name: string | null;
  readonly email: string;
  readonly role: UserRole;
  readonly planId: string | null;
  readonly contractUrl: string | null;
  readonly onboardingSlug: string | null;
  readonly workType: WorkType;
  readonly createdAt: string;
}

export interface PlanPublic {
  readonly id: string;
  readonly name: string;
  readonly cost: number;
  readonly createdAt: string;
}

export interface SubscriptionPublic {
  readonly id: string;
  readonly userId: string;
  readonly planId: string;
  readonly status: SubscriptionStatus;
  readonly billingDay: number;
  readonly cancelledAt: string | null;
  readonly createdAt: string;
}

export interface AdminInvoicePublic {
  readonly id: string;
  readonly userId: string;
  readonly subscriptionId: string | null;
  readonly amount: number;
  readonly description: string | null;
  readonly status: AdminInvoiceStatus;
  readonly dueDate: string;
  readonly paidAt: string | null;
  readonly lateFeePercent: number;
  readonly lateInterestType: string;
  readonly lateInterestPercent: number;
  readonly paymentLink: string | null;
  readonly createdAt: string;
}

export interface AgentAvatarAdmin {
  readonly id: string;
  readonly name: string;
  readonly imageUrl: string;
  readonly sortOrder: number;
  readonly isActive: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface AdminAppointment {
  readonly id: string;
  readonly userId: string;
  readonly leadId: string;
  readonly serviceId: string;
  readonly date: string;
  readonly startTime: string;
  readonly endTime: string;
  readonly status: AppointmentStatus;
  readonly notes: string | null;
  readonly createdAt: string;
  readonly cancelledAt: string | null;
}

export interface AdminChat {
  readonly id: string;
  readonly userId: string;
  readonly leadId: string;
  readonly handoff: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface AdminChatMessage {
  readonly id: string;
  readonly chatId: string;
  readonly sender: string;
  readonly content: string;
  readonly createdAt: string;
  readonly deletedAt: string | null;
}

export interface AdminTimeRange {
  readonly start: string;
  readonly end: string;
}

export interface AdminBusinessHourEntry {
  readonly day: string;
  readonly ranges: readonly AdminTimeRange[];
}

export interface AdminCalendarConfig {
  readonly id: string;
  readonly userId: string;
  readonly businessHours: readonly AdminBusinessHourEntry[];
  readonly slotDurationMinutes: number;
  readonly minAdvanceMinutes: number;
  readonly minCancelAdvanceMinutes: number;
  readonly updatedAt: string;
}

/**
 * Contract update (2026-04-18): PUT /admin/users/:id/calendar-config now
 * mirrors the user-facing `UpdateCalendarConfigParams` shape. businessHours
 * is an array of {day, ranges:[{start,end}]} instead of one property per
 * weekday. slotDurationMinutes narrowed to 10..240 (was 5..480).
 */
export interface UpdateCalendarConfigPayload {
  readonly businessHours?: readonly AdminBusinessHourEntry[];
  readonly slotDurationMinutes?: number;
  readonly minAdvanceMinutes?: number;
  readonly minCancelAdvanceMinutes?: number;
}

export interface UserDashboardSummary {
  readonly totalLeads: number;
  readonly totalAppointments: number;
  readonly totalChats: number;
}

export interface PlatformMetrics {
  readonly totalUsers: number;
  readonly activeUsers: number;
  readonly mrr: number;
  readonly appointmentsThisMonth: number;
  readonly totalLeads: number;
  readonly activeChats: number;
}

export interface AdminInvoiceSummary {
  readonly mrr: number;
  readonly totalInvoices: number;
  readonly pendingInvoices: number;
  readonly paidInvoices: number;
}
