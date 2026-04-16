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
  channels: 300,        // 5 min — rarely changes
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
  channels: "channels",
} as const;
