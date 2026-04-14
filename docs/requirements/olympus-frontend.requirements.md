# Requirements Document — Olympus Frontend

> "Olympus - Sua empresa 100% autônoma."
> Approved: Pending developer approval

---

## 1. Problem Statement

The current Olympus frontend is functional (28 features, all working) but has accumulated technical debt: inconsistent validation (Zod in some modules, manual in others), no centralized env validation, no error boundaries, no WebSocket for real-time chat, duplicated service/product code, and no input debouncing. The visual design needs a complete overhaul following the new "Quiet Authority" design system from Stitch — moving from bordered cards and explicit separators to a borderless, tonal-layering approach with warm stone surfaces.

The rebuild preserves all business logic and API contracts while delivering:
- Clean, standardized architecture from day one
- New design language ("Warm Corporate Minimalism")
- Real-time chat via WebSocket (previously REST-only)
- Consistent patterns across all modules

## 2. Target User

Business owners of any type (not restricted to service-based businesses) who want their company to run autonomously. They are strategists, not executors — they observe AI agents handling customer conversations, scheduling, and sales while they focus on high-level decisions.

Two roles:
- **User** (business owner): Manages their own leads, conversations, catalog, calendar, and invoices
- **Admin** (platform operator): Manages all users, plans, subscriptions, and platform-wide billing

## 3. Success Criteria

- Business owner opens Olympus and instantly sees what matters: revenue, active conversations, pipeline, schedule
- AI agent conversations appear in real-time — owner can intervene (handoff) when needed
- The interface feels "expensive, intentional, and calm" (Quiet Authority design philosophy)
- All 7 MVP features work against the existing production backend without any backend changes
- Zero `any` types, Zod validation at every boundary, consistent error handling

## 4. Scope

### 4.1 MVP (7 features)

| # | Feature | Description |
|---|---------|-------------|
| 1 | **Login** | Email/password authentication with JWT token management |
| 2 | **Dashboard** | Strategic overview: revenue, pending/overdue amounts, avg ticket, conversations, appointments, leads, daily revenue chart, ROI |
| 3 | **Conversations/Chat** | Real-time WebSocket chat. Session list + message thread. Horos (scheduling) and Kairos (sales) agents. Handoff toggle. Send messages |
| 4 | **CRM Kanban** | Drag-and-drop 5-stage pipeline (new → contacted → qualified → converted → lost). Create/edit/delete leads. Lead detail with timeline |
| 5 | **Calendar** | 3-view appointment calendar (day/week/month). Status filtering. Date navigation |
| 6 | **Catalog** | Unified services + products management. CRUD with image upload, discount config, agent instructions |
| 7 | **Settings (basic)** | Agent config (name, tone, instructions) + calendar config (business hours, slot duration, advance booking) |

### 4.2 Full Version (post-MVP)

- Forgot password (3-step recovery flow)
- Invoices (full CRUD, PDF rendering, QR code, late fees/interest)
- WhatsApp instance management (connect/disconnect, status, send messages)
- Admin Dashboard (platform-wide KPIs)
- Admin Users (CRUD, user detail with tabs, contract upload)
- Admin Plans (CRUD subscription plans)
- Admin Subscriptions (list, status filtering)
- Admin Billing (MRR, collected, overdue, active subscriptions)
- Admin Invoices (platform-level invoice management)
- Marketing page

### 4.3 Out of Scope

- Backend changes (all endpoints remain as documented in PROJECT-EXTRACTION.md §4)
- Mobile app
- New features not present in the previous project
- Database changes

## 5. Flows

### 5.1 Authentication Flow

**Happy path:**
1. User opens `/login`
2. Enters email + password → POST `/auth/login`
3. Backend returns `{accessToken, refreshToken, user}`
4. Frontend stores tokens in httpOnly cookies (access: 1h, refresh: 7d)
5. Middleware redirects to `/dashboard`

**Token refresh (middleware):**
1. On every request, middleware checks JWT exp with 30s buffer
2. If expired → POST `/auth/refresh` with refreshToken
3. On success → update cookies, continue request
4. On failure → delete cookies, redirect to `/login`

**Error flows:**
- Invalid credentials → show error message
- Network error → show generic error
- Token refresh fails → automatic logout

### 5.2 Real-Time Chat Flow

**Happy path:**
1. User navigates to `/conversations`
2. Session list loads via REST: GET `/chats`
3. User selects a session
4. Messages load via REST: GET `/chats/:sessionId/messages` (last page first)
5. WebSocket connection established with auth token
6. New messages appear in real-time via WebSocket
7. User can send messages (POST `/chat`)

**Handoff flow:**
1. User clicks "Ativar Handoff" toggle → POST `/chats/:sessionId/handoff`
2. AI stops responding in that conversation
3. User types and sends messages manually
4. User clicks "Desativar Handoff" → DELETE `/chats/:sessionId/handoff`
5. AI resumes control

**Error flows:**
- WebSocket disconnection → attempt reconnect with exponential backoff
- Message send failure → show error, keep message in input
- Session delete → confirmation dialog, redirect to empty state

### 5.3 CRM Kanban Flow

**Happy path:**
1. Board loads: GET `/leads/board` → 5 columns with lead cards
2. User drags lead card from one column to another
3. Optimistic update: card moves immediately
4. Background: PATCH `/leads/:id` with new status
5. On failure → revert card position, show error

**Lead creation:**
1. User clicks "Novo Lead" → dialog opens
2. Fills name (required), email (required), phone (optional)
3. Submit → POST `/leads`
4. On success → card appears in "new" column
5. On 409 (duplicate email) → show conflict error

### 5.4 Dashboard Flow

**Happy path:**
1. User navigates to `/dashboard`
2. Parallel fetch: GET `/invoices/dashboard`
3. Display: revenue card, pending card, overdue card, avg ticket, daily revenue chart, operational metrics
4. Greeting based on time of day

### 5.5 Calendar Flow

**Happy path:**
1. Default view: week, current date
2. Fetch: GET `/appointments?date_from=X&date_to=Y`
3. User switches views (day/week/month) → recalculate date range, refetch
4. User navigates dates → refetch with new range
5. Status filter (confirmed/cancelled) → refetch with filter

### 5.6 Catalog Flow

**Happy path (create service/product):**
1. User opens catalog → tabs: Services / Products
2. Clicks "Novo Serviço" → form opens
3. Fills: name, description, price, discounts (PIX/card/special), agent instructions, image
4. Image validation: max 5MB, JPEG/PNG/WebP, magic bytes check
5. Submit → POST `/services` (multipart FormData)
6. On success → item appears in list

### 5.7 Settings Flow

**Agent config:**
1. Load: GET `/agent/config`
2. User edits: agent name (1-100 chars), tone (friendly/formal/casual), custom instructions (max 2000 chars)
3. Save → PUT `/agent/config`

**Calendar config:**
1. Load: GET `/calendar-config`
2. User edits: business hours per day, slot duration, advance booking hours, cancellation advance hours
3. Save → PUT `/calendar-config`

## 6. Business Rules (Invariants)

### Authentication & Authorization
- Access token: 1 hour. Refresh token: 7 days
- Middleware auto-refresh: 30s before expiry
- Cookies: httpOnly, sameSite=lax, secure in production
- Roles: admin (full access), user (own data only)
- workType: services | sales | hybrid (controls sidebar navigation)
- Admin routes return 404 for non-admin users

### CRM
- 5 stages: new → contacted → qualified → converted → lost
- Leads are soft-deleted
- Duplicate email returns 409
- Lead metadata: flexible JSON, max 10KB serialized
- Board fetch rate limit: 20/min
- Timeline rate limit: 30/min

### Catalog
- Services and products share identical schema
- Image upload: max 5MB, JPEG/PNG/WebP, magic bytes validation
- Agent instructions: max 2000 chars
- Price range: 0 – 999,999.99
- Amounts use cents precision: Math.round(value * 100) / 100

### Calendar
- Business hours configurable per day
- Slot duration in minutes
- Minimum advance booking hours
- Minimum cancellation advance hours
- Appointment statuses: confirmed, cancelled

### Chat
- Handoff is a toggle: activate → AI stops, human takes over. Deactivate → AI resumes
- Agents: horos (scheduling), kairos (sales), human (manual)
- Both admin and user can view and respond to conversations
- Admin sees any user's conversations via admin panel

## 7. Integrations

| System | Method | Purpose |
|--------|--------|---------|
| Olympus Backend API | REST + WebSocket, JWT Bearer auth | All data and business logic |
| Meta SDK | Client-side SDK (env vars) | WhatsApp setup in settings (post-MVP) |

All external communication is proxied through the backend. The frontend never calls third-party APIs directly.

## 8. Authorization Matrix

| Feature | User | Admin |
|---------|------|-------|
| Login | Yes | Yes |
| Dashboard | Own data | Own data |
| Conversations | Own sessions | Own sessions + any user's sessions (via admin panel) |
| CRM | Own leads | Own leads + any user's leads (via admin panel) |
| Calendar | Own appointments | Own appointments + any user's (via admin panel) |
| Catalog | Own services/products | Own + any user's (via admin panel) |
| Settings | Own config | Own + any user's config (via admin panel) |
| Admin Panel | 404 | Full access |

## 9. Non-Functional Requirements

### Performance
- ~20 simultaneous users (short term)
- Skeleton loading on every page navigation
- No specific latency requirements beyond responsive UX

### Security
- All previous headers: HSTS, X-Frame-Options: DENY, X-Content-Type-Options: nosniff, Permissions-Policy, Referrer-Policy
- NEW: Content-Security-Policy header
- JWT httpOnly cookies, secure in production, sameSite lax
- Magic bytes validation for file uploads
- Zod validation at every boundary

### Observability
- No specific requirements beyond standard Next.js logging

### i18n
- 3 locales: pt-BR (default), en-US, es
- Locale-prefix routing (as-needed)
- All user-facing strings in message files

## 10. Design System

Reference: `design/stitch-exports/DESIGN.md`

Philosophy: **"The Quiet Authority"** — Warm Corporate Minimalism.

Key principles:
- **No-Line Rule**: No 1px borders for sectioning. Use background color shifts and whitespace
- **Tonal Layering**: Depth via surface color stacking, not shadows
- **Stone Foundation**: Surface #faf9f7 (warm, not clinical white)
- **Surgical Accents**: Amber (#895100) and Teal (#9ff0fb) used sparingly
- **Dual Typography**: Manrope (headlines, tight tracking -2%) + Inter (body/UI)
- **Ghost Borders**: When borders required (inputs), use outline_variant at 15% opacity
- **Ambient Shadows**: Only for floating elements (modals, dropdowns). Y:8px, Blur:24px, on_surface at 4-6% opacity
- **Breathing Room**: Minimum 32px padding on cards. 20% more whitespace than expected
- **12px radius**: All containers use 0.75rem corner radius

Stitch screen exports available for: login, dashboard, chat, crm, catalog, invoices, admin-dashboard, marketing.

## 11. Dependencies

- Backend API: Production, no changes needed
- Infrastructure: Ready, no blockers
- Design: 8 Stitch exports + DESIGN.md ready

## 12. Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| No fallback — new frontend replaces old directly | High — if it breaks, users are affected | Comprehensive testing: unit + integration + e2e + smoke test before deploy |
| WebSocket is new (no prior implementation) | Medium — highest complexity feature | Implement with reconnection strategy, fallback to REST polling if WS unavailable |
| Token refresh edge cases | Medium — auth failures break everything | Reuse proven middleware pattern with 30s buffer, add error boundaries |
| Drag-and-drop CRM | Low-Medium — UX complexity | Use dnd-kit (proven in previous project), add optimistic updates |

## 13. Open Decisions

None. All technical decisions confirmed.

## 14. Existing Contracts (DO NOT MODIFY)

All API contracts documented in `PROJECT-EXTRACTION.md` §4 are immutable. The frontend must conform to the existing backend API — no endpoint changes, no new fields, no modified response shapes.

Key contracts:
- 60+ REST endpoints across 18 groups
- JWT auth flow (login, refresh, me)
- Pagination: `{ data: T[], pagination: { page, limit, total } }`
- Error codes: NOT_AUTHENTICATED, NOT_FOUND, CONFLICT, FORBIDDEN, BAD_REQUEST, UPSTREAM_ERROR, VALIDATION_ERROR
- Server action return shape: `{ success: boolean, error?: string, data?: T }`

## 15. Identified Complexities (ordered by difficulty)

1. **Real-time chat via WebSocket** — New capability. Needs connection management, reconnection, message ordering, concurrent state with REST data
2. **JWT token refresh in middleware** — Edge cases around concurrent requests, race conditions on refresh, cookie setting in Server Components
3. **CRM drag-and-drop** — Optimistic updates, revert on failure, cross-column state management

## 16. Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js (App Router) | 16.x |
| UI | React | 19.x |
| Language | TypeScript (strict) | 5.x |
| Styling | Tailwind CSS v4 | 4.x |
| Components | shadcn/ui | Latest |
| Validation | Zod | 4.x |
| i18n | next-intl | 4.x |
| Animation | Motion (Framer Motion) | 12.x |
| Charts | Recharts | 3.x |
| Drag & Drop | @dnd-kit | Latest |
| Icons | Lucide React | Latest |
| Testing | Vitest + Testing Library | Latest |
| Toasts | Sonner | Latest |
| Fonts | Manrope + Inter (via next/font) | — |
