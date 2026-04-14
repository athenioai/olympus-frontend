# Module Decomposition — Olympus Frontend

> Decomposition of the MVP (7 features) into Modules, Micro Modules, and Nano Modules.

---

## Execution Strategy

- **M1 Core**: Sequential (foundation — everything depends on it)
- **M2-M5**: Parallel (4 agents, zero lateral dependencies)

---

## M1 — Core

### MM1.1 — Design System

| NM | Nano Module | Files | Risk |
|----|------------|-------|------|
| NM-1 | CSS tokens + globals.css (Stitch DESIGN.md → Tailwind tokens) | `globals.css` | LOW |
| NM-2 | Fonts + Tailwind config (Manrope + Inter via next/font) | `layout.tsx`, `postcss.config.mjs` | LOW |
| NM-3 | Base UI components (button, input, label, logo, page-skeleton) | `components/ui/*.tsx` | LOW |

### MM1.2 — Auth

| NM | Nano Module | Files | Risk |
|----|------------|-------|------|
| NM-4 | Auth types + interfaces | `services/interfaces/auth-service.ts` | LOW |
| NM-5 | Auth service + authFetch (JWT cookies, auto-retry on 401) | `services/auth-service.ts`, `services/auth-fetch.ts` | HIGH |
| NM-6 | Middleware (token validation, refresh 30s buffer, route protection, i18n) | `middleware.ts` | HIGH |
| NM-7 | Login page (form, server action, Zod validation) | `app/[locale]/login/page.tsx`, `actions.ts` | MEDIUM |

### MM1.3 — Layout & Navigation

| NM | Nano Module | Files | Risk |
|----|------------|-------|------|
| NM-8 | i18n setup (config, routing, request, 3 message files base) | `i18n/*.ts`, `messages/*.json` | LOW |
| NM-9 | Providers + root/locale layouts | `providers.tsx`, `app/layout.tsx`, `app/[locale]/layout.tsx` | LOW |
| NM-10 | Sidebar (collapsible, mobile drawer, role/workType nav, language switcher) | `components/sidebar.tsx`, `language-switcher.tsx` | MEDIUM |
| NM-11 | Authenticated layout (session check, redirect, sidebar + main) | `app/[locale]/(authenticated)/layout.tsx` | MEDIUM |

---

## M2 — Dashboard

### MM2.1 — Dashboard

| NM | Nano Module | Files | Risk |
|----|------------|-------|------|
| NM-12 | Finance types + dashboard service | `services/interfaces/finance-service.ts`, `services/finance-service.ts` | LOW |
| NM-13 | Dashboard view (metric cards, daily revenue chart, greeting) | `dashboard/_components/dashboard-view.tsx` | LOW |
| NM-14 | Dashboard page + loading skeleton | `dashboard/page.tsx`, `dashboard/loading.tsx` | LOW |

---

## M3 — Conversations

### MM3.1 — Chat Infrastructure

| NM | Nano Module | Files | Risk |
|----|------------|-------|------|
| NM-15 | Chat types + interfaces | `services/interfaces/chat-service.ts` | LOW |
| NM-16 | Chat service (REST: sessions, messages, send, delete, handoff) | `services/chat-service.ts` | MEDIUM |
| NM-17 | WebSocket manager (connect, auth, reconnect with backoff, message events) | `lib/ws-manager.ts` | HIGH |

### MM3.2 — Chat UI

| NM | Nano Module | Files | Risk |
|----|------------|-------|------|
| NM-18 | Session panel (list, search, active indicator, agent badge) | `conversations/_components/session-panel.tsx` | MEDIUM |
| NM-19 | Message thread (messages, system msgs, appointment cards, timestamps) | `conversations/_components/message-thread.tsx` | MEDIUM |
| NM-20 | Chat input + handoff controls (send, toggle, disabled state) | `conversations/_components/chat-input.tsx` | MEDIUM |
| NM-21 | Conversations layout + page + actions (split panel, empty state, loading) | `conversations/layout.tsx`, `page.tsx`, `[sessionId]/page.tsx`, `actions.ts` | MEDIUM |

---

## M4 — CRM

### MM4.1 — Lead Infrastructure

| NM | Nano Module | Files | Risk |
|----|------------|-------|------|
| NM-22 | Lead types + interfaces | `services/interfaces/lead-service.ts` | LOW |
| NM-23 | Lead service (board, CRUD, timeline) | `services/lead-service.ts` | LOW |
| NM-24 | Lead server actions + Zod validation | `crm/actions.ts` | MEDIUM |

### MM4.2 — Kanban Board

| NM | Nano Module | Files | Risk |
|----|------------|-------|------|
| NM-25 | Lead card component | `crm/_components/lead-card.tsx` | LOW |
| NM-26 | Kanban board (dnd-kit, columns, drag handlers, optimistic updates) | `crm/_components/crm-board.tsx` | MEDIUM |
| NM-27 | Create lead dialog | `crm/_components/create-lead-dialog.tsx` | LOW |
| NM-28 | CRM page + loading skeleton | `crm/page.tsx`, `crm/loading.tsx` | LOW |

### MM4.3 — Lead Detail

| NM | Nano Module | Files | Risk |
|----|------------|-------|------|
| NM-29 | Timeline components (message, appointment, status change entries) | `crm/_components/timeline-*.tsx` | LOW |
| NM-30 | Lead detail page + loading | `crm/[id]/page.tsx`, `crm/[id]/loading.tsx` | LOW |

---

## M5 — Operations

### MM5.1 — Catalog

| NM | Nano Module | Files | Risk |
|----|------------|-------|------|
| NM-31 | Catalog types + finance service (services/products CRUD) | `services/interfaces/finance-service.ts`, `services/finance-service.ts` | LOW |
| NM-32 | Catalog server actions + Zod validation (image magic bytes) | `catalog/actions.ts` | MEDIUM |
| NM-33 | Services table + Products table components | `catalog/_components/services-table.tsx`, `products-table.tsx` | LOW |
| NM-34 | Catalog page (tabs) + standalone pages + loading | `catalog/page.tsx`, `services/page.tsx`, `products/page.tsx` | LOW |

### MM5.2 — Calendar

| NM | Nano Module | Files | Risk |
|----|------------|-------|------|
| NM-35 | Appointment types + service | `services/interfaces/appointment-service.ts`, `services/appointment-service.ts` | LOW |
| NM-36 | Calendar view (day/week/month, navigation, filtering) | `calendar/_components/calendar-view.tsx` | MEDIUM |
| NM-37 | Calendar page + loading skeleton | `calendar/page.tsx`, `calendar/loading.tsx` | LOW |

### MM5.3 — Settings

| NM | Nano Module | Files | Risk |
|----|------------|-------|------|
| NM-38 | Settings types + services (agentConfig, calendarConfig) | interfaces + implementations | LOW |
| NM-39 | Settings server actions + Zod validation | `settings/actions.ts`, `agent-actions.ts` | MEDIUM |
| NM-40 | Settings hub component (tabs: agent config, calendar config) | `settings/_components/settings-hub.tsx` | LOW |
| NM-41 | Settings page + loading skeleton | `settings/page.tsx`, `settings/loading.tsx` | LOW |

---

## Summary

| Module | Micro Modules | Nano Modules | Risk Profile |
|--------|--------------|--------------|--------------|
| M1 Core | 3 | 11 | 2 HIGH, 3 MEDIUM, 6 LOW |
| M2 Dashboard | 1 | 3 | 3 LOW |
| M3 Conversations | 2 | 7 | 1 HIGH, 4 MEDIUM, 2 LOW |
| M4 CRM | 3 | 9 | 1 MEDIUM, 8 LOW |
| M5 Operations | 3 | 11 | 3 MEDIUM, 8 LOW |
| **Total** | **12** | **41** | **3 HIGH, 11 MEDIUM, 27 LOW** |

---

## Contracts (Rule Zero)

### M1 exports (consumed by M2-M5):

```typescript
// Auth
function authFetch(url: string, options?: RequestInit): Promise<Response>
interface AuthUser { id: string; name: string; email: string; role: 'admin' | 'user'; workType: 'services' | 'sales' | 'hybrid'; createdAt: string }
function getSession(): Promise<AuthUser | null>

// Pagination (shared)
interface Pagination { page: number; limit: number; total: number }
interface PaginatedResponse<T> { data: T[]; pagination: Pagination }

// Layout
// Sidebar, PageSkeleton — React components
// CSS variables in globals.css — design tokens
// i18n via useTranslations() from next-intl

// Utilities
function cn(...inputs: ClassValue[]): string
function formatRelativeTime(date: string): string
function formatDate(date: string, locale: string): string
function formatCNPJ(cnpj: string): string
```

### M2-M5 isolation rules:
- Each module exports ONLY its pages, components, and server actions
- Each module consumes services from `lib/services/` (backend API contracts — immutable)
- Zero imports between M2, M3, M4, M5
- Service interfaces in `lib/services/interfaces/` are the contract with the backend — DO NOT MODIFY

---

## Execution Order

```
Phase 1: M1 Core (sequential, ~11 NMs)
  MM1.1 (NM-1 → NM-2 → NM-3)
  MM1.2 (NM-4 → NM-5 → NM-6 → NM-7)
  MM1.3 (NM-8 → NM-9 → NM-10 → NM-11)

Phase 2: M2 + M3 + M4 + M5 (parallel, 4 agents)
  Agent 1: M2 Dashboard (3 NMs)
  Agent 2: M3 Conversations (7 NMs)
  Agent 3: M4 CRM (9 NMs)
  Agent 4: M5 Operations (11 NMs)

Phase 3: Integration testing + merge
```
