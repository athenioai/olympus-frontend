// Service instances
export { authService } from "./auth-service";
export { authFetch } from "./auth-fetch";
export { chatService } from "./chat-service";
export { leadService } from "./lead-service";
export { financeService } from "./finance-service";
export { appointmentService } from "./appointment-service";
export { agentConfigService } from "./agent-config-service";
export { calendarConfigService } from "./calendar-config-service";
export { channelAccountService } from "./channel-account-service";
export { businessProfileService } from "./business-profile-service";
export { businessFaqService } from "./business-faq-service";
export { businessExceptionService } from "./business-exception-service";

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
  PaginatedMessages,
  ListSessionsParams,
  ListMessagesParams,
  IChatService,
} from "./interfaces/chat-service";

// Lead types
export type {
  LeadStatus,
  LeadTemperature,
  LeadChannel,
  TimelineEntryType,
  LeadPublic,
  BoardColumnCount,
  PaginatedColumnResponse,
  CreateLeadPayload,
  UpdateLeadPayload,
  ListLeadsParams,
  PaginatedLeadResponse,
  TimelineMessage,
  TimelineAppointment,
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
  Service,
  Product,
  Invoice,
  FinanceDashboard,
  Pagination as FinancePagination,
  PaginatedResponse as FinancePaginatedResponse,
  ListServicesParams,
  ListProductsParams,
  PrepaymentSetting,
  IFinanceService,
} from "./interfaces/finance-service";

// Appointment types
export type {
  Appointment,
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
  CreateExceptionPayload,
  UpdateExceptionPayload,
  IBusinessExceptionService,
} from "./interfaces/business-exception-service";
