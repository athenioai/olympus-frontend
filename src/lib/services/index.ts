// Service instances
export { authService } from "./auth-service";
export { authFetch } from "./auth-fetch";
export { chatService } from "./chat-service";
export { leadService } from "./lead-service";
export { financeService } from "./finance-service";
export { adsService } from "./ads-service";
export { appointmentService } from "./appointment-service";
export { agentConfigService } from "./agent-config-service";
export { calendarConfigService } from "./calendar-config-service";
export { channelAccountService } from "./channel-account-service";
export { businessProfileService } from "./business-profile-service";
export { businessFaqService } from "./business-faq-service";
export { businessExceptionService } from "./business-exception-service";
export { signupService } from "./signup-service";
export { onboardingService } from "./onboarding-service";
export { userService } from "./user-service";
export { businessVerticalService } from "./business-vertical-service";
export { adminUserService } from "./admin-user-service";
export { adminDashboardService } from "./admin-dashboard-service";
export { adminPlanService } from "./admin-plan-service";
export { adminSubscriptionService } from "./admin-subscription-service";
export { adminInvoiceService } from "./admin-invoice-service";
export { adminAgentAvatarService } from "./admin-agent-avatar-service";

// Auth types
export type {
  AuthUser,
  LoginResponse,
  IAuthService,
} from "./interfaces/auth-service";

// Chat types
export type {
  ChatSession,
  ChatMessage,
  PaginatedSessions,
  ChatMessagesCursorPage,
  ListSessionsParams,
  GetMessagesParams,
  IChatService,
} from "./interfaces/chat-service";

// Lead types
export type {
  LeadStatus,
  LeadTemperature,
  LeadChannel,
  LeadCustomFieldType,
  TimelineEntryType,
  LeadPublic,
  LeadBoardItem,
  LeadTag,
  LeadLastMessage,
  LeadCustomFieldValue,
  BoardColumnCount,
  PaginatedColumnResponse,
  CreateLeadPayload,
  UpdateLeadPayload,
  ListLeadsParams,
  PaginatedLeadResponse,
  TimelineMessage,
  TimelineStatusChange,
  TimelineEntry,
  TimelineParams,
  ILeadService,
} from "./interfaces/lead-service";

// Finance types
export type {
  DailyDataPoint,
  TodayAppointment,
  LeadToFollowUp,
  PendingInvoiceDueSoon,
  BestService,
  ActiveSpecialDiscount,
  CatalogItemPublic,
  CreateCatalogPayload,
  Service,
  Product,
  Invoice,
  FinanceDashboard,
  PaginatedResponse as FinancePaginatedResponse,
  ListCatalogParams,
  ListServicesParams,
  ListProductsParams,
  PrepaymentSetting,
  UpdateCatalogPayload,
  IFinanceService,
} from "./interfaces/finance-service";

// Ads types
export type {
  Ad,
  AdItem,
  AdItemRef,
  AdItemType,
  AdPublic,
  CreateAdPayload,
  IAdsService,
  ListAdsParams,
  UpdateAdPayload,
} from "./interfaces/ads-service";

// Appointment types
export type {
  Appointment,
  CalendarDaySummary,
  CalendarMonthSummary,
  PaginatedAppointments,
  ListAppointmentsParams,
  IAppointmentService,
} from "./interfaces/appointment-service";

// Agent config types
export type {
  AgentConfig,
  UpdateAgentConfigParams,
  IAgentConfigService,
} from "./interfaces/agent-config-service";

// Calendar config types
// Channel account types
export type {
  ChannelAccount,
  ChannelStatus,
  CreateChannelAccountPayload,
  IChannelAccountService,
} from "./interfaces/channel-account-service";

export type {
  TimeRange,
  BusinessHourEntry,
  CalendarConfig,
  UpdateCalendarConfigParams,
  ICalendarConfigService,
} from "./interfaces/calendar-config-service";

// Business profile types
export type {
  ServiceModality,
  SocialPlatform,
  ScoreTier,
  WorkType,
  BusinessProfile,
  BusinessAddress,
  BusinessSocialLink,
  BusinessServiceArea,
  ScoreResult,
  BusinessProfileView,
  UpdateBusinessProfilePayload,
  UpdateAddressPayload,
  CreateSocialLinkPayload,
  CreateServiceAreaPayload,
  IBusinessProfileService,
} from "./interfaces/business-profile-service";

// Business FAQ types
export type {
  BusinessFaq,
  CreateFaqPayload,
  UpdateFaqPayload,
  IBusinessFaqService,
} from "./interfaces/business-faq-service";

// Business exception types
export type {
  ExceptionType,
  BusinessExceptionRange,
  BusinessException,
  PaginatedBusinessExceptions,
  ListBusinessExceptionsParams,
  CreateExceptionPayload,
  UpdateExceptionPayload,
  IBusinessExceptionService,
} from "./interfaces/business-exception-service";

// Signup types
export type {
  SignupBeginPayload,
  SignupBeginResponse,
  ISignupService,
} from "./interfaces/signup-service";

// Onboarding types
export type {
  OnboardingInfo,
  SetPasswordPayload,
  SetPasswordResponse,
  IOnboardingService,
} from "./interfaces/onboarding-service";

// User types
export type {
  UpdateUserPayload,
  IUserService,
} from "./interfaces/user-service";

// Business vertical types
export type {
  BusinessVertical,
  IBusinessVerticalService,
} from "./interfaces/business-vertical-service";

// Admin shared types
export type {
  AdminAppointment,
  AdminBusinessHourEntry,
  AdminCalendarConfig,
  AdminChat,
  AdminChatMessage,
  AdminInvoicePublic,
  AdminInvoiceStatus,
  AdminInvoiceSummary,
  AdminTimeRange,
  AdminUserPublic,
  AgentAvatarAdmin,
  AppointmentStatus,
  LateInterestType,
  PlanPublic,
  PlatformMetrics,
  SubscriptionPublic,
  SubscriptionStatus,
  UpdateCalendarConfigPayload,
  UserDashboardSummary,
  UserRole,
} from "./interfaces/admin-types";

// Admin service interfaces
export type {
  AdminUserOption,
  CreateAdminUserPayload,
  IAdminUserService,
  ListAdminUsersParams,
  OnboardingStatus,
  PaginatedAdminUsers,
  SeedHolidaysPayload,
  UpdateAdminUserPayload,
} from "./interfaces/admin-user-service";
export type { IAdminDashboardService } from "./interfaces/admin-dashboard-service";
export type {
  CreatePlanPayload,
  IAdminPlanService,
  ListAdminPlansParams,
  PaginatedAdminPlans,
  PlanOption,
  UpdatePlanPayload,
} from "./interfaces/admin-plan-service";
export type {
  IAdminSubscriptionService,
  ListAdminSubscriptionsParams,
  PaginatedAdminSubscriptions,
  UpdateSubscriptionStatusPayload,
} from "./interfaces/admin-subscription-service";
export type {
  CreateInvoicePayload,
  IAdminInvoiceService,
  ListAdminInvoicesParams,
  PaginatedAdminInvoices,
} from "./interfaces/admin-invoice-service";
export type {
  CreateAgentAvatarPayload,
  IAdminAgentAvatarService,
  ListAdminAgentAvatarsParams,
} from "./interfaces/admin-agent-avatar-service";
