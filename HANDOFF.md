# HANDOFF — Olympus Frontend

> "Olympus - Sua empresa 100% autônoma."

## Project

- **Name**: olympus-frontend
- **Type**: Frontend (Next.js 16 App Router)
- **Version**: v0.1.0 (MVP)

## Current State

- **Stage**: 5 — Finalization (release on main)
- **Branch**: `feature/admin-panel` (stacked on `feature/signup-onboarding`, both awaiting merge to `main`)
- **Build**: Passing — 25 routes, 62 tests (1 pre-existing failure), zero TS errors, 5 e2e smoke tests
- **Status**: Ready for manual QA against production backend, then merge

## What's Implemented (MVP — 7 features)

| Feature | Route | Key Tech |
|---------|-------|----------|
| Login | `/login` | Glassmorphism, JWT httpOnly cookies |
| Dashboard | `/dashboard` | Recharts AreaChart, BRL formatting |
| Conversations | `/conversations/[sessionId]` | WebSocket (WsManager), handoff toggle |
| CRM Kanban | `/crm`, `/crm/[id]` | @dnd-kit drag-drop, optimistic updates |
| Calendar | `/calendar` | Day/week/month views, date navigation |
| Catalog | `/catalog`, `/services`, `/products` | Image magic bytes validation, tabs |
| Settings | `/settings` | Agent config + calendar config tabs |

## Architecture

```
src/
├── app/[locale]/(authenticated)/   # 7 feature routes + layouts
├── components/                      # Sidebar, providers, UI (shadcn)
├── lib/services/                    # 8 service classes + interfaces
├── lib/ws-manager.ts                # WebSocket with auto-reconnect
├── i18n/                            # 3 locales (pt-BR, en-US, es)
└── middleware.ts                    # JWT refresh + i18n routing
```

## What's NOT Built (post-MVP)

- Forgot password, user-facing Invoices (PDF/QR)
- WhatsApp channel management (connection UI)
- Marketing page, not-found.tsx pages
- Wizard/admin step e2e coverage against real backend (offline smoke only)

## Known Issues (non-blocking)

- Some hardcoded UI strings (login decorative text, calendar weekdays)
- `process.env.NEXT_PUBLIC_API_URL` duplicated in 4 files (should centralize)
- Some component files exceed 150-line limit (dashboard-view, calendar-view)
- Hardcoded `"en-US"` locale in message-thread date formatting

## Next Steps

1. `npm run dev` → test all features in browser against production backend
2. Set `NEXT_PUBLIC_API_URL` in hosting env vars
3. Deploy to hosting (Vercel/Railway)
4. Smoke test in production

## Recent Work — Admin panel (2026-04-17)

Full `/admin/*` area matching the Admin API Contract document. 7 new routes, 6 admin services, per-route Zod-validated server actions. Feature branch: `feature/admin-panel` (stacked on `feature/signup-onboarding`).

**New routes** (all gated by `authenticated/admin/layout.tsx` → role=`admin`):
- `/admin` → redirect → `/admin/dashboard`
- `/admin/dashboard` — 6 PlatformMetrics cards (totalUsers, activeUsers, MRR, appointmentsThisMonth, totalLeads, activeChats)
- `/admin/users` — list + create/edit modal + seed-holidays prompt
- `/admin/users/[id]` — 4 tabs: overview (per-user dashboard + onboarding slug copy + contract link), appointments, chats (two-pane with messages on demand), calendar (inline form editing minAdvance/minCancelAdvance/slotDuration)
- `/admin/plans` — CRUD with soft-delete
- `/admin/subscriptions` — CRUD joined with users/plans for labels
- `/admin/invoices` — summary tiles + status filter pills + create modal + mark-paid/cancel (backend INVOICE_STATUS_001 gate enforced client-side via the `pending`-only disable)
- `/admin/agent-avatars` — multipart upload + inline edit/delete gallery

**New services/contracts** (`src/lib/services/interfaces/admin-*.ts` + `src/lib/services/admin-*.ts`):
- `adminUserService` — covers CRUD, seed-holidays, user dashboard, appointments, chats + messages, calendar-config GET/PUT
- `adminDashboardService`, `adminPlanService`, `adminSubscriptionService`, `adminInvoiceService`, `adminAgentAvatarService`
- Shared `admin-types.ts` mirrors the contract verbatim (enums + response shapes).
- Agent avatar service bypasses `authFetch` for multipart upload and reads `access_token` cookie directly.

**Sidebar**: `ADMIN_NAV` enabled (was gated by `&& false`), `/admin/admin-invoices` typo fixed to `/admin/invoices`, added `/admin/agent-avatars` entry.

**i18n**: `admin.*` block in pt-BR / en-US / es with keys for dashboard/users/plans/subscriptions/invoices/avatars/common.

**Shared primitives** (scoped under `/admin/_components/`):
- `Modal` — simple portal-less dialog with Escape + backdrop click.
- `AdminHeader` — title + subtitle + actions.
- `_lib/format.ts` — BRL / date / datetime helpers (Intl, America/Sao_Paulo).

**Tests**:
- 9 new unit tests on `admin-format` (BRL formatting, date/datetime edge cases).
- Playwright `admin-access.spec.ts` verifying `/admin` and `/admin/dashboard` redirect to `/login` without auth.

**Manual QA needed** (against real backend, using an admin JWT):
1. `/admin/dashboard` loads 6 metric cards with real numbers.
2. Create/edit user via modal; verify email arrives with onboarding link.
3. Seed-holidays prompts for years and returns success toast.
4. Open user detail → all 4 tabs render; messages load on chat select; calendar PUT persists.
5. Plans CRUD including soft-delete (users unlinked).
6. Subscriptions CRUD with user/plan picker; status toggle on edit.
7. Invoices: summary tiles match dashboard, filter pills work, mark-paid/cancel disabled for non-pending, create with ISO dueDate.
8. Agent avatars: upload PNG/JPEG → appears in gallery; toggle isActive; delete.
9. Non-admin user sees no admin items in sidebar and `/admin` bounces to `/dashboard`.

## Recent Work — Signup + onboarding wizard (2026-04-17)

Full public signup + 8-step onboarding wizard. 5 new routes, 4 new services, 20 new unit tests, 3 e2e smoke tests. Feature branch: `feature/signup-onboarding` (12 commits, one per NM).

**New routes**:
- `/[locale]/signup` — email form → POST /signup/begin
- `/[locale]/signup/success` — "check your email" + resend (30s cooldown)
- `/[locale]/onboarding/[slug]` — 8-step wizard (password → workType → vertical → business info → modality → policies → extras → success)
- `/[locale]/onboarding/error/invalid` — invalid/expired slug
- `/[locale]/onboarding/error/completed` — consumed slug (link to /login)

**Contracts added**: `SignupBeginPayload/Response`, `OnboardingInfo`, `SetPasswordPayload/Response`, `WorkType`, `UpdateUserPayload`, `BusinessVertical`. All via `src/lib/services/interfaces/*`.

**Contract change (Rule Zero approved)**: `BusinessProfile` + `UpdateBusinessProfilePayload` now include `businessVertical: string | null` (required for Step 3 — PUT seeds tags/fields/FAQs server-side).

**Auth integration**: step 1 (`set-password`) persists the JWT pair as httpOnly cookies via a server action. `src/proxy.ts` now splits public paths into `PUBLIC_REDIRECT_IF_AUTH` (login, signup — bounce authed users) and `PUBLIC_ALLOW_BOTH` (onboarding — wizard authenticates mid-flow).

**Resume heuristic** (`src/app/[locale]/onboarding/[slug]/_lib/resume-heuristic.ts`): maps the `BusinessProfile` state to the step the user should land on after re-opening the link. 8 unit tests cover the matrix.

**Caching**: business-verticals cached 24h (`CACHE_TAGS.businessVerticals`); business-profile + score invalidated via `updateTag()` (Next 16 API) after each mutation.

**Tests**:
- `resume-heuristic.test.ts` (8 tests) — step resolution matrix
- `password-strength.test.ts` (10 tests) — strength scoring + backend policy
- `e2e/signup-flow.spec.ts` (3 tests) — renders /signup, /onboarding/error/invalid, /onboarding/error/completed. Wizard steps not e2e'd (server actions bypass `page.route` — need a mock server for full flow coverage).

**Dependencies added**: `@playwright/test` (dev), chromium-headless-shell via `npx playwright install`.

**Manual QA still needed** (against real backend):
1. POST /signup/begin with fresh email → verify magic link email
2. Click link → lands on /onboarding/[slug], enters step 1
3. Full wizard walk-through, confirm PATCH /users/me + PUT /business-profile endpoints
4. Confirm seeded tags/fields/FAQs appear in Settings after step 3
5. Verify score progress bar reflects backend score after each step
6. Verify final "Entrar no sistema" lands on populated /dashboard

## Recent Work — Board card enrichment (2026-04-17)

Backend started returning enriched items on `GET /leads/board/:status` (`avatarUrl`, `lastMessage`, `tags`, `customFields`). Frontend updated to render them.

**Contract**: new type `LeadBoardItem extends LeadPublic` added. `PaginatedColumnResponse.data` now typed as `LeadBoardItem[]`. Filtered path (via `GET /leads`) still uses `listLeads` which returns `LeadPublic[]`; those are upgraded to `LeadBoardItem` with null/empty enrichment via a local `toBoardItem` helper, so the card degrades gracefully.

**New pieces**:
- `src/components/ui/{avatar,tooltip}.tsx` — radix-ui primitives
- `src/lib/{avatar,custom-field,truncate}.ts` — helpers + tests (22 new unit tests)
- `src/app/[locale]/(authenticated)/crm/_components/{channel-badge,tag-chips,lead-message-preview,lead-custom-fields-inline}.tsx`
- `LeadCard` fully refactored

**Known debt**:
- `auth-fetch.test.ts` has one pre-existing failing test (mock returns raw response, code expects envelope). Unrelated to this feature.
- E2E suite (Playwright) not yet added. Spec suggested 1 scenario for the board — deferred.
- Note: signup/onboarding feature added e2e for public surfaces only (no board-specific e2e yet).
