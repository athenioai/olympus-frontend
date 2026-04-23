/**
 * Cache revalidation times (in seconds) and tag names.
 * Used across services for consistent caching strategy.
 */

export const CACHE_TIMES = {
  dashboard: 60,        // 1 min — data changes moderately
  calendar: 30,         // 30s — appointments are time-sensitive
  crm: 30,              // 30s — leads are dynamic
  conversations: 0,     // no cache — real-time data via WebSocket
  services: 120,        // 2 min — catalog changes rarely
  products: 120,        // 2 min — catalog changes rarely
  settings: 300,        // 5 min — rarely changes, revalidated on save
  businessVerticals: 60 * 60 * 24, // 24h — catalog is static
  adminDashboard: 60,   // 1 min — platform metrics
  adminUsers: 30,       // 30s — list changes on create/edit
  adminUserDetail: 30,  // 30s — detail tabs
  adminPlans: 300,      // 5 min — catalog
  adminSubscriptions: 60,
  adminInvoices: 30,
  adminAvatars: 300,    // 5 min — rarely changes
} as const;

export const CACHE_TAGS = {
  dashboard: "dashboard",
  appointments: "appointments",
  leads: "leads",
  leadsBoard: "leads-board",
  conversations: "conversations",
  services: "services",
  products: "products",
  calendarConfig: "calendar-config",
  agentConfig: "agent-config",
  prepayment: "prepayment",
  businessProfile: "business-profile",
  businessScore: "business-score",
  businessFaqs: "business-faqs",
  businessExceptions: "business-exceptions",
  businessVerticals: "business-verticals",
  adminDashboard: "admin-dashboard",
  adminUsers: "admin-users",
  adminUserDetail: "admin-user-detail",
  adminPlans: "admin-plans",
  adminSubscriptions: "admin-subscriptions",
  adminInvoices: "admin-invoices",
  adminInvoiceSummary: "admin-invoice-summary",
  adminAvatars: "admin-avatars",
} as const;
