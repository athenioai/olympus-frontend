# PROJECT EXTRACTION — Olympus Frontend

> Comprehensive knowledge extraction for SVVAP rebuild methodology.
> Generated: 2026-04-14

---

## 1. Overview

**Olympus** is an AI-powered SaaS dashboard for autonomous business management — a multi-tenant platform where each user (business owner) gets an AI agent that handles customer conversations, appointment scheduling, lead management, and invoicing. The frontend consumes a NestJS backend API via JWT-authenticated REST calls. Target users are Brazilian service-based businesses (salons, clinics, consultancies) who want AI to handle their customer pipeline end-to-end.

### Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js (App Router) | 16.2.1 |
| UI Library | React | 19.2.4 |
| Language | TypeScript (strict) | 5.x |
| Styling | Tailwind CSS v4 + shadcn/ui (base-nova) | 4.x |
| Validation | Zod | 4.3.6 |
| i18n | next-intl | 4.9.1 |
| Animation | Motion (Framer Motion) | 12.38.0 |
| Charts | Recharts | 3.8.1 |
| PDF | @react-pdf/renderer | 4.3.2 |
| Drag & Drop | @dnd-kit | 6.3.1 |
| Icons | Lucide React | 1.7.0 |
| Testing | Vitest + Testing Library | 4.1.2 |
| Toasts | Sonner | 2.0.7 |
| QR Codes | qrcode.react | 4.2.0 |
| Themes | next-themes | 0.4.6 |

---

## 1.1 Backend Compatibility Notes (NestJS Rebuild)

> **The Olympus Backend was rebuilt with NestJS.** The following changes affect the frontend:

### Response Envelope

ALL backend responses are now wrapped in a standard envelope:

```typescript
interface ApiResponse<T> {
  success: boolean
  data: T | null
  error: { code: string; message: string } | null
  meta: { requestId: string }
}
```

The `authFetch` wrapper must unwrap this envelope — extract `data` from the response. If `success === false`, throw an error with the `error.code` and `error.message`.

### Universal camelCase

ALL field names in ALL directions (request bodies, response bodies, query params) are now camelCase. No snake_case in any contract. The interfaces in this document have been updated to reflect this.

### Changed Endpoints

| Old | New | Notes |
|-----|-----|-------|
| `POST /auth/forgot-password/send-code` | `POST /auth/forgot-password` | Same body: `{email}` |
| `POST /auth/forgot-password/reset` | `POST /auth/reset-password` | Body changed: `newPassword` → `password` |
| `POST /chat` body `{session_id}` | `POST /chat` body `{sessionId}` | camelCase |
| `POST /channel-accounts` body `{access_token}` | `POST /channel-accounts` body `{accessToken}` | camelCase |
| Query params `date_from`, `date_to`, `user_id` | `dateFrom`, `dateTo`, `userId` | camelCase |
| `NEXT_PUBLIC_API_URL` default `localhost:8000` | `localhost:3000` | NestJS default port |

### Pagination Response

Backend now returns pagination as:
```typescript
{ data: T[], total: number, page: number, limit: number }
```
This is INSIDE the envelope, so after unwrapping you get `{ data, total, page, limit }`.

---

## 2. Implemented Features

### Public Routes

| # | Feature | Description | Status | Main Files |
|---|---------|-------------|--------|------------|
| 1 | Login | Email/password auth with glassmorphism card, show/hide password, error messages, WhatsApp support link | Working | `app/[locale]/login/page.tsx` |
| 2 | Forgot Password | 3-step flow: email → verification code (6 digits) → new password. Split layout with animated gradient | Working | `app/[locale]/forgot-password/page.tsx`, `forgot-password/actions.ts` |

### User Routes (Authenticated)

| # | Feature | Description | Status | Main Files |
|---|---------|-------------|--------|------------|
| 3 | Dashboard | Financial overview: revenue, pending, overdue, avg ticket, conversations, appointments, leads, daily revenue chart, ROI | Working | `(authenticated)/dashboard/page.tsx`, `_components/dashboard-view.tsx` |
| 4 | CRM Kanban | Drag-and-drop 5-stage pipeline (new→contacted→qualified→converted→lost). Create lead dialog. Lead cards with metadata | Working | `(authenticated)/crm/page.tsx`, `_components/crm-board.tsx`, `lead-card.tsx`, `create-lead-dialog.tsx` |
| 5 | CRM Lead Detail | Lead detail view with timeline (messages, appointments, status changes) | Working | `(authenticated)/crm/[id]/page.tsx` |
| 6 | Conversations List | Multi-session chat list with last message preview, handoff indicator, message count | Working | `(authenticated)/conversations/layout.tsx`, `_components/session-panel.tsx` |
| 7 | Chat Thread | Message thread with pagination (loads last page first), send message, activate/deactivate handoff, delete session | Working | `(authenticated)/conversations/[sessionId]/page.tsx`, `_components/message-thread.tsx` |
| 8 | Calendar | 3-view appointment calendar (day/week/month). Status filtering (confirmed/cancelled). Date navigation with computed ranges | Working | `(authenticated)/calendar/page.tsx`, `_components/calendar-view.tsx` |
| 9 | Invoices List | Paginated invoice table with status/type filters | Working | `(authenticated)/invoices/page.tsx`, `_components/invoices-table.tsx` |
| 10 | Invoice Detail | Full invoice view with lead info, late fees/interest, payment method, PDF rendering, QR code | Working | `(authenticated)/invoices/[id]/page.tsx`, `_components/invoice-detail-view.tsx` |
| 11 | Create Invoice | Multi-step form: select lead → type (service/product/manual) → amounts, dates, late fees config | Working | `(authenticated)/invoices/new/page.tsx`, `_components/create-invoice-form.tsx` |
| 12 | Catalog | Unified tab view for services + products with search and pagination | Working | `(authenticated)/catalog/page.tsx`, `_components/catalog-hub.tsx` |
| 13 | Services | Standalone services listing with CRUD, image upload, discount config, agent instructions | Working | `(authenticated)/services/page.tsx`, `_components/services-table.tsx` |
| 14 | Products | Standalone products listing with CRUD, image upload, discount config, agent instructions | Working | `(authenticated)/products/page.tsx`, `_components/products-table.tsx` |
| 15 | Settings Hub | Multi-tab settings: calendar config, channel accounts (WhatsApp/Telegram), prepayment toggle, agent config (name/tone/instructions) | Working | `(authenticated)/settings/page.tsx`, `_components/settings-hub.tsx` |
| 16 | WhatsApp | WhatsApp instance management (connect/disconnect, status, send messages) | Working | `(authenticated)/whatsapp/page.tsx` |

### Admin Routes

| # | Feature | Description | Status | Main Files |
|---|---------|-------------|--------|------------|
| 17 | Admin Dashboard | Platform-wide KPIs: users (total, new, pending), MRR, plan breakdown, appointments, leads, chats | Working | `(authenticated)/admin/dashboard/page.tsx`, `_components/dashboard-view.tsx` |
| 18 | Users Management | Paginated user list with search, plan assignment. Create user with email + plan + PDF contract. Auto-creates WhatsApp instance | Working | `(authenticated)/admin/users/page.tsx`, `_components/users-table.tsx` |
| 19 | User Detail | Per-user tabs: dashboard metrics, chat sessions, appointments, calendar config | Working | `(authenticated)/admin/users/[id]/page.tsx`, `_components/user-context-view.tsx` |
| 20 | Plans | CRUD for subscription plans (name + cost) with pagination and search | Working | `(authenticated)/admin/plans/page.tsx`, `_components/plans-table.tsx` |
| 21 | Subscriptions | Platform subscriptions list with status filtering (active/suspended/cancelled) | Working | `(authenticated)/admin/subscriptions/page.tsx`, `_components/subscriptions-table.tsx` |
| 22 | Admin Billing | Financial overview: MRR, collected this month, overdue count, active subscriptions | Working | `(authenticated)/admin/billing/page.tsx`, `_components/billing-dashboard.tsx` |
| 23 | Admin Invoices | System-wide invoice management: list, create, mark paid, cancel | Working | `(authenticated)/admin/admin-invoices/page.tsx`, `_components/admin-invoices-table.tsx` |

### Infrastructure Features

| # | Feature | Description | Status |
|---|---------|-------------|--------|
| 24 | JWT Auth Middleware | Token validation, auto-refresh (30s buffer), route protection, cookie management | Working |
| 25 | i18n Routing | 3 locales (pt-BR, en-US, es) with locale-prefix routing, language switcher | Working |
| 26 | Loading Skeletons | Every page has a `loading.tsx` with skeleton UI | Working |
| 27 | Role-Based Navigation | Sidebar shows different items based on `workType` and `role` | Working |
| 28 | Collapsible Sidebar | Desktop: 260px↔64px with localStorage persistence. Mobile: 300px drawer with backdrop | Working |

---

## 3. Data Model

> The frontend does not own a database — all data lives in the backend. Below are the TypeScript interfaces that represent the data contracts between frontend and backend API.
>
> **IMPORTANT (NestJS Rebuild):** The backend now wraps ALL responses in an envelope: `{success: boolean, data: T | null, error: {code: string, message: string} | null, meta: {requestId: string}}`. The `authFetch` wrapper must unwrap this envelope automatically. ALL field names are camelCase — no snake_case in any direction. Backend port changed from 8000 to 3000.

### 3.1 AuthUser

```typescript
interface AuthUser {
  id: string               // UUID
  name: string
  email: string
  role: 'admin' | 'user'
  workType: 'services' | 'sales' | 'hybrid'
  createdAt: string        // ISO 8601
}
```

### 3.2 Lead (CRM)

```typescript
type LeadStatus = 'new' | 'contacted' | 'qualified' | 'converted' | 'lost'

interface LeadPublic {
  id: string               // UUID
  ownerId: string          // UUID — user who owns the lead
  name: string
  email: string
  phone: string | null
  status: LeadStatus
  temperature: 'cold' | 'warm' | 'hot'
  nameConfirmed: boolean
  metadata: Record<string, unknown>
  createdAt: string        // ISO 8601
  updatedAt: string
}

interface LeadBoard {
  new: LeadPublic[]
  contacted: LeadPublic[]
  qualified: LeadPublic[]
  converted: LeadPublic[]
  lost: LeadPublic[]
}
```

### 3.3 Timeline (CRM)

```typescript
type TimelineEntryType = 'message' | 'appointment' | 'statusChange'

interface TimelineEntry {
  type: TimelineEntryType
  timestamp: string        // ISO 8601
  data: TimelineMessage | TimelineAppointment | TimelineStatusChange
}

interface TimelineMessage {
  id: string
  sessionId: string
  agent: 'horos' | 'kairos' | 'human'
  role: 'lead' | 'assistant'
  content: string
  appointmentId: string | null
  createdAt: string
}

interface TimelineAppointment {
  id: string
  sessionId: string
  leadName: string
  serviceType: string
  date: string
  startTime: string
  endTime: string
  status: 'confirmed' | 'cancelled'
  createdAt: string
}

interface TimelineStatusChange {
  id: string
  oldStatus: string
  newStatus: string
  changedAt: string
}
```

### 3.4 Chat

```typescript
interface ChatSession {
  sessionId: string
  agent: string
  channel: string | null
  leadName: string | null
  handoff: boolean
  lastMessage: string
  lastRole: 'lead' | 'assistant'
  messageCount: number
  startedAt: string
  lastMessageAt: string
}

interface ChatMessage {
  id: string
  sessionId: string
  agent: string
  role: 'lead' | 'assistant'
  content: string
  appointmentId: string | null
  createdAt: string
}
```

### 3.5 Appointment

```typescript
interface Appointment {
  id: string
  sessionId: string
  leadName: string
  serviceType: string
  date: string
  startTime: string
  endTime: string
  status: 'confirmed' | 'cancelled'
  createdAt: string
}
```

### 3.6 Calendar Config

```typescript
interface BusinessHour {
  day: string
  schedule: string
}

interface CalendarConfig {
  id: string
  userId: string
  businessHours: BusinessHour[]
  slotDurationMinutes: number
  minAdvanceHours: number
  minCancelAdvanceHours: number
  updatedAt: string
}
```

### 3.7 Service & Product (Catalog)

```typescript
// Service and Product share identical structure
interface Service {
  id: string
  name: string
  description: string | null
  price: number            // cents precision (Math.round * 100 / 100)
  pixDiscountPercent: number
  cardDiscountPercent: number
  specialDiscountName: string | null
  specialDiscountPercent: number
  specialDiscountStartsAt: string | null   // ISO 8601
  specialDiscountEndsAt: string | null
  imageUrl: string | null
  agentInstructions: string | null         // max 2000 chars — AI agent prompt per item
  active: boolean
  createdAt: string
  updatedAt: string
}

// Product has identical fields
type Product = Service
```

### 3.8 Invoice

```typescript
type InvoiceStatus = 'pending' | 'sent' | 'paid' | 'overdue' | 'cancelled'
type InvoiceType = 'service' | 'product' | 'manual'

interface Invoice {
  id: string
  leadId: string
  type: InvoiceType
  referenceId: string | null    // links to service/product ID
  description: string
  amount: number
  paymentMethod: 'pix' | 'card' | null
  discountPercent: number
  finalAmount: number
  status: InvoiceStatus
  dueDate: string
  paidAt: string | null
  lateFeePercent: number
  lateInterestType: 'simple' | 'compound'
  lateInterestPercent: number
  appointmentId: string | null
  createdAt: string
  updatedAt: string
}

interface InvoiceDetail extends Invoice {
  leadName: string
  lateAmount: number
  cancelledAt: string | null
}
```

### 3.9 Subscription (Admin)

```typescript
interface Subscription {
  id: string
  userId: string
  userName: string | null
  userEmail: string | null
  planId: string
  planName: string | null
  planCost: number | null
  status: 'active' | 'suspended' | 'cancelled'
  billingDay: number           // 1-28
  currentPeriodStart: string
  currentPeriodEnd: string
  cancelledAt: string | null
  createdAt: string
  updatedAt: string
}
```

### 3.10 Admin Invoice

```typescript
interface AdminInvoice {
  id: string
  subscriptionId: string
  userId: string
  userName: string | null
  amount: number
  status: 'pending' | 'paid' | 'overdue' | 'cancelled'
  dueDate: string
  paidAt: string | null
  lateFeePercent: number
  lateInterestType: 'simple' | 'compound'
  lateInterestPercent: number
  paymentLink: string | null
  createdAt: string
  updatedAt: string
}
```

### 3.11 Plan (Admin)

```typescript
interface Plan {
  id: string
  name: string
  cost: number
  createdAt: string
  updatedAt: string
}
```

### 3.12 Admin User

```typescript
interface AdminUser {
  id: string
  name: string | null
  email: string
  cnpj: string | null
  role: 'admin' | 'user'
  planId: string
  contractUrl: string
  createdAt: string
}
```

### 3.13 WhatsApp

```typescript
type WhatsAppInstanceStatus = 'connected' | 'disconnected'

interface WhatsAppInstance {
  id: string
  status: WhatsAppInstanceStatus
  displayName: string | null
  phoneNumber: string | null
  connectedAt: string | null
  createdAt: string
  updatedAt: string
}

interface WhatsAppInstanceDetail {
  status: WhatsAppInstanceStatus
  messagesSentToday: number
  messagesReceivedToday: number
  messagesSentWeek: number
  messagesReceivedWeek: number
}
```

### 3.14 Agent Config

```typescript
interface AgentConfig {
  agentName: string
  tone: 'friendly' | 'formal' | 'casual'
  customInstructions: string | null    // max 2000 chars
  createdAt: string
  updatedAt: string
}
```

### 3.15 Channel Account

```typescript
type SupportedChannel = 'whatsapp' | 'telegram'

interface ChannelAccount {
  channel: SupportedChannel
  channelAccountId: string | null
  maskedToken: string | null
  status: string
  connectedAt: string
}
```

### 3.16 Dashboards

```typescript
interface FinanceDashboard {
  revenueThisMonth: number
  pendingAmount: number
  overdueAmount: number
  averageTicket: number
  byType: { service: number; product: number; manual: number }
  conversationsThisMonth: number
  appointmentsThisMonth: number
  appointmentsCancelledThisMonth: number
  leadsThisMonth: number
  conversionRate: number
  dailyRevenue: { date: string; amount: number }[]
  planCost: number
  roi: number | null
}

interface AdminDashboardData {
  users: { total: number; newThisMonth: number; pendingOnboarding: number }
  revenue: { mrr: number; planBreakdown: PlanBreakdown[] }
  appointments: { totalThisMonth: number; cancelledThisMonth: number }
  leads: { totalThisMonth: number; conversionRate: number }
  chats: { totalMessagesThisMonth: number; activeSessionsThisMonth: number }
}

interface AdminBillingDashboard {
  mrr: number
  totalCollectedThisMonth: number
  overdueCount: number
  activeSubscriptions: number
}
```

### 3.17 Pagination (shared)

```typescript
interface Pagination {
  page: number
  limit: number
  total: number
}

interface PaginatedResponse<T> {
  data: T[]
  pagination: Pagination
}
```

---

## 4. API Contracts

All endpoints consume/produce JSON. Authentication via `Authorization: Bearer <accessToken>` header. Base URL configured via `NEXT_PUBLIC_API_URL`.

### 4.1 Auth

| Method | Path | Input | Output | Auth |
|--------|------|-------|--------|------|
| POST | `/auth/login` | `{email, password}` | `{accessToken, refreshToken, user: AuthUser}` | Public |
| POST | `/auth/refresh` | `{refreshToken}` | `{accessToken, refreshToken}` | Public |
| GET | `/auth/me` | — | `AuthUser` | Required |
| POST | `/auth/forgot-password` | `{email}` | `{message}` | Public |
| POST | `/auth/reset-password` | `{email, code, password}` | `{message}` | Public |

### 4.2 Leads (CRM)

| Method | Path | Input | Output | Auth | Rate Limit |
|--------|------|-------|--------|------|------------|
| GET | `/leads/board` | — | `LeadBoard` | Required | 20/min |
| GET | `/leads` | `?page&limit&status&search` | `PaginatedLeadResponse` | Required | — |
| GET | `/leads/:id` | — | `LeadPublic` | Required | — |
| POST | `/leads` | `{name, email, phone?, status?, metadata?}` | `LeadPublic` | Required | — |
| PATCH | `/leads/:id` | `{name?, email?, phone?, status?, metadata?}` | `LeadPublic` | Required | — |
| DELETE | `/leads/:id` | — | void | Required | — |
| GET | `/leads/:id/timeline` | `?limit&type` | `{data: TimelineEntry[]}` | Required | 30/min |

### 4.3 Chat

| Method | Path | Input | Output | Auth |
|--------|------|-------|--------|------|
| GET | `/chats` | `?page&limit&agent` | `PaginatedResponse<ChatSession>` | Required |
| GET | `/chats/:sessionId/messages` | `?page&limit` | `PaginatedResponse<ChatMessage>` | Required |
| DELETE | `/chats/:sessionId` | — | void | Required |
| POST | `/chat` | `{sessionId, message}` | void | Required |
| POST | `/chats/:sessionId/handoff` | — | void | Required |
| DELETE | `/chats/:sessionId/handoff` | — | void | Required |

### 4.4 Appointments

| Method | Path | Input | Output | Auth |
|--------|------|-------|--------|------|
| GET | `/appointments` | `?page&limit&status&dateFrom&dateTo&userId` | `PaginatedAppointments` | Required |
| GET | `/appointments/:id` | — | `Appointment` | Required |

### 4.5 Calendar Config

| Method | Path | Input | Output | Auth |
|--------|------|-------|--------|------|
| GET | `/calendar-config` | — | `CalendarConfig` | Required |
| PUT | `/calendar-config` | `UpdateCalendarConfigParams` | `CalendarConfig` | Required |

### 4.6 Services (Catalog)

| Method | Path | Input | Output | Auth |
|--------|------|-------|--------|------|
| GET | `/services` | `?page&limit&search` | `PaginatedResponse<Service>` | Required |
| POST | `/services` | FormData (multipart) | `Service` | Required |
| PATCH | `/services/:id` | FormData (multipart) | `Service` | Required |
| DELETE | `/services/:id` | — | void | Required |

### 4.7 Products (Catalog)

| Method | Path | Input | Output | Auth |
|--------|------|-------|--------|------|
| GET | `/products` | `?page&limit&search` | `PaginatedResponse<Product>` | Required |
| POST | `/products` | FormData (multipart) | `Product` | Required |
| PATCH | `/products/:id` | FormData (multipart) | `Product` | Required |
| DELETE | `/products/:id` | — | void | Required |

### 4.8 Invoices

| Method | Path | Input | Output | Auth |
|--------|------|-------|--------|------|
| GET | `/invoices` | `?page&limit&status&type&leadId&dateFrom&dateTo` | `PaginatedResponse<Invoice>` | Required |
| GET | `/invoices/:id` | — | `InvoiceDetail` | Required |
| POST | `/invoices` | `CreateInvoiceParams` | `Invoice` | Required |
| PATCH | `/invoices/:id/mark-paid` | — | `Invoice` | Required |
| PATCH | `/invoices/:id/cancel` | — | `Invoice` | Required |
| GET | `/invoices/dashboard` | — | `FinanceDashboard` | Required |

### 4.9 Channel Accounts

| Method | Path | Input | Output | Auth |
|--------|------|-------|--------|------|
| GET | `/channel-accounts` | — | `ChannelAccount[]` | Required |
| POST | `/channel-accounts` | `{channel, accessToken}` | `ChannelAccount` | Required |
| DELETE | `/channel-accounts/:channel` | — | void | Required |

### 4.10 Agent Config

| Method | Path | Input | Output | Auth |
|--------|------|-------|--------|------|
| GET | `/agent/config` | — | `AgentConfig` | Required |
| PUT | `/agent/config` | `{agentName, tone, customInstructions}` | `AgentConfig` | Required |

### 4.11 WhatsApp

| Method | Path | Input | Output | Auth |
|--------|------|-------|--------|------|
| GET | `/whatsapp/instances` | — | `WhatsAppInstance[]` | Required |
| GET | `/whatsapp/instances/:id` | — | `WhatsAppInstance` | Required |
| DELETE | `/whatsapp/instances/:id` | — | void | Required |
| POST | `/whatsapp/instances/:id/connect` | `{phoneNumber}` | `WhatsAppInstance` | Required |
| POST | `/whatsapp/instances/:id/disconnect` | — | `{status}` | Required |
| GET | `/whatsapp/instances/:id/status` | — | `WhatsAppInstanceDetail` | Required |
| POST | `/whatsapp/instances/:id/send/text` | `{to, content}` | `{messageId}` | Required |
| POST | `/whatsapp/instances/:id/send/text-sequence` | `{to, messages[]}` | `{messageIds[]}` | Required |

### 4.12 Admin — Users

| Method | Path | Input | Output | Auth |
|--------|------|-------|--------|------|
| GET | `/admin/users` | `?page&limit&role&search` | `PaginatedAdminUsers` | Admin |
| GET | `/admin/users/:id` | — | `AdminUser` | Admin |
| POST | `/admin/users` | FormData (email, planId, contract PDF) | `AdminUser` | Admin |

### 4.13 Admin — User Data

| Method | Path | Input | Output | Auth |
|--------|------|-------|--------|------|
| GET | `/admin/users/:userId/dashboard` | — | `UserDashboardData` | Admin |
| GET | `/admin/users/:userId/chats` | `?page&limit&agent` | `PaginatedSessions` | Admin |
| GET | `/admin/users/:userId/chats/:sessionId/messages` | `?page&limit` | `PaginatedMessages` | Admin |
| GET | `/admin/users/:userId/appointments` | `?page&limit&status&dateFrom&dateTo` | `PaginatedAppointments` | Admin |
| GET | `/admin/users/:userId/calendar-config` | — | `CalendarConfig \| null` | Admin |
| PUT | `/admin/users/:userId/calendar-config` | `UpdateCalendarConfigParams` | `CalendarConfig` | Admin |

### 4.14 Admin — Plans

| Method | Path | Input | Output | Auth |
|--------|------|-------|--------|------|
| GET | `/admin/plans` | `?page&limit&search` | `PaginatedPlans` | Admin |
| GET | `/admin/plans/:id` | — | `Plan` | Admin |
| POST | `/admin/plans` | `{name, cost}` | `Plan` | Admin |
| PATCH | `/admin/plans/:id` | `{name?, cost?}` | `Plan` | Admin |
| DELETE | `/admin/plans/:id` | — | void | Admin |

### 4.15 Admin — Subscriptions

| Method | Path | Input | Output | Auth |
|--------|------|-------|--------|------|
| GET | `/admin/subscriptions` | `?page&limit&status` | `PaginatedResponse<Subscription>` | Admin |
| POST | `/admin/subscriptions` | `{userId, planId, billingDay}` | `Subscription` | Admin |
| PATCH | `/admin/subscriptions/:id` | `{planId?, billingDay?, status?}` | `Subscription` | Admin |

### 4.16 Admin — Invoices

| Method | Path | Input | Output | Auth |
|--------|------|-------|--------|------|
| GET | `/admin/invoices` | `?page&limit&status&userId` | `PaginatedResponse<AdminInvoice>` | Admin |
| POST | `/admin/invoices` | `{subscriptionId, amount, dueDate}` | `AdminInvoice` | Admin |
| PATCH | `/admin/invoices/:id/mark-paid` | — | `AdminInvoice` | Admin |
| PATCH | `/admin/invoices/:id/cancel` | — | `AdminInvoice` | Admin |
| GET | `/admin/invoices/dashboard` | — | `AdminBillingDashboard` | Admin |

### 4.17 Admin — Dashboard

| Method | Path | Input | Output | Auth |
|--------|------|-------|--------|------|
| GET | `/admin/dashboard` | — | `AdminDashboardData` | Admin |

### 4.18 Settings

| Method | Path | Input | Output | Auth |
|--------|------|-------|--------|------|
| GET | `/settings/prepayment` | — | `PrepaymentSetting` | Required |
| PATCH | `/settings/prepayment` | `{enabled}` | `PrepaymentSetting` | Required |

---

## 5. Business Rules

### 5.1 Authentication & Authorization

- JWT access token: 15 minutes expiry. Refresh token: 30 days
- Middleware auto-refreshes 30 seconds before expiry (`EXPIRY_BUFFER_MS = 30_000`)
- Cookies: `httpOnly=true`, `sameSite=lax`, `secure` in production only
- Roles: `admin` (full access) and `user` (own data only)
- `workType` controls sidebar navigation: `services` (catalog-focused), `sales` (CRM-focused), `hybrid` (both)
- Admin routes return 404 (not 403) for non-admin users

### 5.2 CRM Pipeline

- 5 stages: `new` → `contacted` → `qualified` → `converted` → `lost`
- Leads are soft-deleted (not hard delete)
- Duplicate email prevention returns HTTP 409
- Lead metadata: flexible JSON object, max 10KB serialized
- Timeline unifies messages, appointments, and status changes (rate limited: 30/min)
- Board fetch rate limited: 20/min

### 5.3 Financial Rules

- **Invoice lifecycle**: pending → sent → paid | overdue | cancelled
- **Invoice types**: service, product, manual
- **Late fees**: configurable percentage (0-100%), default 2%
- **Late interest**: simple or compound, configurable percentage (0-100%), default 1%
- **Amounts**: cents precision via `Math.round(value * 100) / 100`
- **Due date**: must be today or future — no past dates allowed
- **Amount range**: 0.01 – 999,999.99
- **Discount system**: PIX discount %, card discount %, plus optional special/promotional discounts with date ranges
- **Prepayment**: global toggle (enabled/disabled) per user
- **Currency**: BRL (Brazilian Real)

### 5.4 Subscription Billing (Admin)

- Billing day: 1-28 (avoids month-end edge cases)
- Subscription statuses: active, suspended, cancelled
- Admin invoices are separate from user invoices (platform fees vs. user billing)
- Plan cost defines MRR calculation

### 5.5 Catalog Items

- Services and products share identical schema
- Image upload: max 5MB, JPEG/PNG/WebP only, validated via magic bytes (not just MIME type)
- Agent instructions: max 2000 chars — instructions for AI agent when discussing the item
- Price range: 0 – 999,999.99
- Items can be active/inactive

### 5.6 Chat & Conversations

- Messages paginated (loads last page first for natural chat UX)
- Handoff: toggles human takeover of AI conversation
- Agents: `horos` (scheduling), `kairos` (sales), `human` (manual)
- WebSocket token available for real-time messaging

### 5.7 Calendar

- Business hours configurable per day of week
- Slot duration in minutes
- Minimum advance booking hours (how far ahead leads must book)
- Minimum cancellation advance hours
- Appointment statuses: confirmed, cancelled

### 5.8 User Creation (Admin)

- Requires: email + plan assignment + PDF contract upload
- Contract PDF: max 10MB, validated via magic bytes
- Auto-creates WhatsApp instance on user creation
- Duplicate email returns HTTP 409

### 5.9 Channel Accounts

- Supported channels: WhatsApp, Telegram
- Connection requires access token (max 500 chars)
- Duplicate connection returns HTTP 409
- Upstream errors (502) when external service unavailable

### 5.10 Phone Number Validation

- Strips non-digits before validation
- Valid range: 10-15 digits (covers international formats)

---

## 6. External Integrations

| Service | Purpose | Connection | Endpoints Used |
|---------|---------|-----------|---------------|
| Olympus Backend API | All data and business logic | REST over HTTPS, JWT Bearer auth | All endpoints listed in §4 |
| Meta (Facebook) | WhatsApp Business API integration | App ID + Config ID via env vars (`NEXT_PUBLIC_META_APP_ID`, `NEXT_PUBLIC_META_CONFIG_ID`) | WhatsApp Cloud API (via backend proxy) |
| Supabase | (Referenced in env template but NOT currently used in code) | URL + publishable key | None active |

**Note**: All external communication is proxied through the backend. The frontend never calls third-party APIs directly (except Meta SDK for WhatsApp setup in settings).

---

## 7. Technical Decisions

### Architecture

| Decision | Why |
|----------|-----|
| **Server Actions for mutations** | Next.js 16 pattern: co-located with routes, automatic revalidation, built-in CSRF protection |
| **Class-based services** | Each domain (chat, finance, leads) has a service class with typed methods — clear API surface and testable via DI |
| **`authFetch` wrapper** | Centralized JWT injection and automatic 401→refresh→retry. Single point of auth failure handling |
| **Interface files separated** | All service interfaces in `lib/services/interfaces/` — contracts are explicit and can be referenced independently of implementations |
| **Middleware token refresh** | Proactive refresh in middleware (30s buffer) prevents expired-token requests from reaching the backend |
| **Search params as state** | URL query strings for pagination, filters, tabs — enables sharing URLs and browser navigation |
| **Loading files per page** | Every route has its own `loading.tsx` — instant skeleton feedback on navigation |
| **No state management library** | React Server Components + URL params + local state are sufficient. No Redux/Zustand/Jotai needed |
| **No Supabase client** | Originally planned (env template exists) but all data goes through the backend API instead |

### Workarounds

| Workaround | Why |
|------------|-----|
| **Try/catch around `cookies().set()` in services** | Server Components can't set cookies; only middleware and Server Actions can. Silent catch prevents crashes when services are called from SC context |
| **Manual JWT decode (no library)** | Token expiry check uses `Buffer.from(base64url)` instead of `jsonwebtoken` — avoids adding a dependency for a simple exp check |
| **Separate CRM validation (not Zod)** | Lead actions use manual validation while other modules use Zod. Historical — should be unified |

### Known Tech Debt

| Item | Impact |
|------|--------|
| **Providers component is empty** | `<>{children}</>` — placeholder for future context providers (theme, auth context, etc.) |
| **No CSRF token for state-changing operations** | Server Actions have built-in protection, but custom fetch calls to the backend don't |
| **No rate limiting on server actions** | Backend has rate limits, but frontend doesn't debounce or throttle calls |
| **`NEXT_PUBLIC_API_URL` default is `localhost:3000`** | Different default across files (should be centralized in env validation) |
| **No error.tsx boundaries** | Uses `notFound()` for 404s but no error.tsx for runtime errors — unhandled errors show default Next.js error page |
| **Service/Product duplication** | Identical interfaces and nearly identical CRUD logic — could share a base abstraction |
| **No audit logging** | Sensitive operations (user creation, invoice cancellation) have no frontend-side audit trail |

---

## 8. Environment Variables

| Variable | Purpose | Required | Default |
|----------|---------|----------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API base URL | Yes | `http://localhost:3000` |
| `NEXT_PUBLIC_META_APP_ID` | Meta (Facebook) App ID for WhatsApp setup | No | `""` |
| `NEXT_PUBLIC_META_CONFIG_ID` | Meta configuration ID for WhatsApp integration | No | `""` |
| `NODE_ENV` | Controls cookie `secure` flag and other behaviors | Auto | `development` |
| `NEXT_PUBLIC_SUPABASE_URL` | (Template only — not used in code) | No | — |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | (Template only — not used in code) | No | — |

---

## 9. What Works Well

### Keep These Patterns

1. **Service layer with typed interfaces** — Every service has an explicit interface contract in `lib/services/interfaces/`. Clean separation of concerns. Testable via DI.

2. **`authFetch` with auto-refresh** — Single utility handles JWT injection, 401 detection, token refresh, and retry. Eliminates auth boilerplate from all services.

3. **Middleware-based token refresh** — Proactive refresh 30s before expiry prevents most expired-token scenarios. Users rarely see auth errors.

4. **Server Actions pattern** — Validation → service call → error mapping → `{success, error?, data?}` return. Consistent across all mutations.

5. **Safe error translation** — `SAFE_ERRORS` maps backend error codes to user-friendly Portuguese messages. Internal errors never leak to the UI.

6. **Image magic bytes validation** — File upload validates actual file content (magic bytes), not just the MIME type. Prevents spoofed uploads.

7. **Loading skeletons per page** — Every route has a dedicated `loading.tsx`. Instant visual feedback on navigation.

8. **URL-driven state** — Pagination, filters, tabs all stored in search params. Shareable URLs, proper back/forward navigation.

9. **i18n with next-intl** — Full 3-locale support (pt-BR, en-US, es) with structured message files. Language switching preserves current route.

10. **Design system** — Cohesive warm palette (Pedra Clara base, Âmbar accent, Teal links), Georgia serif headlines, glassmorphism cards, spring-based animations.

11. **Collapsible sidebar with localStorage** — Desktop sidebar remembers collapsed/expanded state. Mobile drawer with backdrop overlay.

12. **Security headers** — X-Frame-Options, HSTS, nosniff, permissions policy all configured in next.config.ts.

---

## 10. What's Bad

### Problems & Improvements

1. **No centralized env validation** — `NEXT_PUBLIC_API_URL` has different defaults (`localhost:8000`) hardcoded across 6+ files. Should use a single `env.ts` with Zod validation at startup (as prescribed by CLAUDE.md §8).

2. **Inconsistent validation approach** — CRM leads use manual type guards while other modules use Zod schemas. Should unify on Zod everywhere.

3. **No error boundaries** — No `error.tsx` files in any route. Unhandled runtime errors show the default Next.js error page instead of a branded error state.

4. **Empty Providers component** — `providers.tsx` is just `<>{children}</>`. No auth context, no query client, no global state. Auth state is fetched ad-hoc in layouts.

5. **Service/Product code duplication** — Identical interfaces, identical CRUD logic, identical table components. Violates DRY without adding flexibility.

6. **No WebSocket integration on frontend** — Backend supports real-time chat via WebSocket (token endpoint exists) but the frontend only uses REST polling/pagination. Messages don't appear in real-time.

7. **No optimistic updates** — All mutations wait for server response before updating UI. CRM drag-and-drop, for example, could benefit from optimistic status changes.

8. **Sidebar navigation is hardcoded** — Nav items are embedded in the sidebar component with conditionals for `workType`. Should be a configurable data structure.

9. **No pagination metadata in URL** — While pagination params are in the URL, there's no way to deep-link to a specific page of results in some views.

10. **Admin user creation auto-creates WhatsApp instance** — This coupling (create user → also create WhatsApp instance) is done in the frontend server action, not the backend. Should be a backend-side effect.

11. **No input debouncing on search** — Search fields trigger API calls on every keystroke change. Should debounce (300-500ms).

12. **Cookie secure flag false in development** — Expected, but there's no CSP header configured, which is a gap in the security header setup.

13. **No request deduplication** — Multiple components on the same page may call the same service independently (e.g., `listLeads` for both invoice creation and CRM).

14. **Tests mock entire modules** — Some tests use `vi.mock('@/lib/services')` which mocks the whole barrel export. This is brittle and can mask import changes.

---

## Appendix A: Design System Reference

### Color Tokens

| Token | Value | Usage |
|-------|-------|-------|
| Background | `#F7F6F4` | Page background (Pedra Clara) |
| Surface 1 | `#FFFFFF` | Cards |
| Surface 2 | `#EAE6DF` | Secondary surfaces |
| Foreground | `#1C1B18` | Primary text |
| Primary/Accent | `#D4820A` | Âmbar — buttons, active states |
| Primary Hover | `#F0B84A` | Hover states |
| Teal | `#4FD1C5` | Links, secondary actions |
| Teal Dark | `#0F6E56` | Teal text on light backgrounds |
| Danger | `#F07070` | Destructive actions, errors |
| Warning | `#E8C872` | Caution states |
| Success | `#34D399` | Confirmation states |
| Muted Text | `#4A4840` | Secondary text |
| Border | `#D5D2CA` | Default borders |

### Typography

- **Display/Headlines**: Georgia, serif, bold (700)
- **Body/UI**: Calibri → Space Grotesk → sans-serif
- **Font loading**: Space Grotesk via Next.js font optimization

### Card Variants

1. **card-surface**: Solid white with subtle shadow, interactive hover lift
2. **card-elevated**: Stronger elevation shadow
3. **card-hero**: Amber gradient overlay with radial glow
4. **card-glass**: Glassmorphism with backdrop blur (login cards)

### Animation Presets

- `fadeInUp`: opacity 0→1, translateY +12px
- `staggerContainer`: children stagger 0.06s apart
- Duration: fast (150ms), normal (250ms), slow (400ms)
- Easing: out `[0.16, 1, 0.3, 1]`, inOut `[0.45, 0, 0.55, 1]`

---

## Appendix B: All Enum/Union Types

| Type | Values |
|------|--------|
| `Locale` | `'pt-BR' \| 'en-US' \| 'es'` |
| `AuthUser.role` | `'admin' \| 'user'` |
| `AuthUser.workType` | `'services' \| 'sales' \| 'hybrid'` |
| `LeadStatus` | `'new' \| 'contacted' \| 'qualified' \| 'converted' \| 'lost'` |
| `TimelineEntryType` | `'message' \| 'appointment' \| 'status_change'` |
| `TimelineMessage.agent` | `'horos' \| 'kairos' \| 'human'` |
| `ChatMessage.role` | `'lead' \| 'assistant'` |
| `Appointment.status` | `'confirmed' \| 'cancelled'` |
| `InvoiceType` | `'service' \| 'product' \| 'manual'` |
| `InvoiceStatus` | `'pending' \| 'sent' \| 'paid' \| 'overdue' \| 'cancelled'` |
| `Invoice.paymentMethod` | `'pix' \| 'card' \| null` |
| `Invoice.lateInterestType` | `'simple' \| 'compound'` |
| `AgentConfig.tone` | `'friendly' \| 'formal' \| 'casual'` |
| `SupportedChannel` | `'whatsapp' \| 'telegram'` |
| `WhatsAppInstanceStatus` | `'connected' \| 'disconnected'` |
| `Subscription.status` | `'active' \| 'suspended' \| 'cancelled'` |
| `AdminInvoice.status` | `'pending' \| 'paid' \| 'overdue' \| 'cancelled'` |

---

## Appendix C: File Structure

```
src/
├── app/
│   ├── globals.css                          # Design system tokens & component styles
│   ├── layout.tsx                           # Root layout (minimal)
│   └── [locale]/
│       ├── layout.tsx                       # i18n provider + font
│       ├── page.tsx                         # Redirect → /dashboard
│       ├── login/page.tsx
│       ├── forgot-password/
│       │   ├── page.tsx
│       │   └── actions.ts
│       └── (authenticated)/
│           ├── layout.tsx                   # Session check + sidebar
│           ├── actions.ts                   # Shared auth actions
│           ├── dashboard/
│           ├── crm/
│           │   ├── page.tsx
│           │   ├── actions.ts
│           │   └── [id]/page.tsx
│           ├── conversations/
│           │   ├── layout.tsx               # Session list fetch
│           │   ├── page.tsx                 # Empty state
│           │   ├── actions.ts
│           │   └── [sessionId]/
│           │       └── page.tsx
│           ├── calendar/
│           ├── invoices/
│           │   ├── page.tsx
│           │   ├── actions.ts
│           │   ├── [id]/page.tsx
│           │   └── new/
│           │       ├── page.tsx
│           │       └── actions.ts
│           ├── catalog/
│           │   ├── page.tsx
│           │   └── actions.ts
│           ├── services/
│           ├── products/
│           ├── settings/
│           │   ├── page.tsx
│           │   ├── actions.ts
│           │   └── agent-actions.ts
│           ├── whatsapp/
│           │   ├── page.tsx
│           │   └── actions.ts
│           └── admin/
│               ├── layout.tsx               # Role check
│               ├── dashboard/
│               ├── users/
│               │   ├── page.tsx
│               │   ├── actions.ts
│               │   └── [id]/
│               │       ├── page.tsx
│               │       └── actions.ts
│               ├── plans/
│               │   ├── page.tsx
│               │   └── actions.ts
│               ├── subscriptions/
│               │   ├── page.tsx
│               │   └── actions.ts
│               ├── billing/
│               ├── admin-invoices/
│               │   ├── page.tsx
│               │   └── actions.ts
├── components/
│   ├── sidebar.tsx
│   ├── language-switcher.tsx
│   ├── providers.tsx
│   └── ui/                                  # shadcn/ui components
│       ├── button.tsx
│       ├── input.tsx
│       ├── label.tsx
│       ├── logo.tsx
│       ├── logo-mark.tsx
│       └── page-skeleton.tsx
├── i18n/
│   ├── config.ts                            # Locales: pt-BR, en-US, es
│   ├── request.ts                           # next-intl request config
│   └── routing.ts                           # Locale routing config
├── lib/
│   ├── utils.ts                             # cn() helper
│   ├── format.ts                            # Date/time/CNPJ formatting
│   ├── motion.ts                            # Animation presets
│   └── services/
│       ├── index.ts                         # Barrel export
│       ├── auth-service.ts
│       ├── auth-fetch.ts                    # JWT wrapper
│       ├── chat-service.ts
│       ├── lead-service.ts
│       ├── finance-service.ts
│       ├── appointment-service.ts
│       ├── calendar-config-service.ts
│       ├── channel-account-service.ts
│       ├── agent-config-service.ts
│       ├── whatsapp-service.ts
│       ├── plan-service.ts
│       ├── admin-user-service.ts
│       ├── admin-user-data-service.ts
│       ├── admin-dashboard-service.ts
│       └── interfaces/                      # 13 contract files
│           ├── auth-service.ts
│           ├── chat-service.ts
│           ├── lead-service.ts
│           ├── finance-service.ts
│           ├── appointment-service.ts
│           ├── calendar-config-service.ts
│           ├── channel-account-service.ts
│           ├── agent-config-service.ts
│           ├── whatsapp-service.ts
│           ├── plan-service.ts
│           ├── admin-user-service.ts
│           ├── admin-user-data-service.ts
│           └── admin-dashboard-service.ts
├── middleware.ts                             # Auth + i18n middleware
└── messages/
    ├── pt-BR.json
    ├── en-US.json
    └── es.json
```
