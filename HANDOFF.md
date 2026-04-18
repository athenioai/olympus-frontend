# HANDOFF — Olympus Frontend

> "Olympus - Sua empresa 100% autônoma."

## Project

- **Name**: olympus-frontend
- **Type**: Frontend (Next.js 16 App Router)
- **Version**: v0.1.0 (MVP)

## Current State

- **Stage**: 5 — Finalization (release on main)
- **Branch**: `feature/signup-onboarding` (awaiting merge to `main`)
- **Build**: Passing — 19 routes, 53 tests (1 pre-existing failure), zero TS errors, 3 e2e smoke tests
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

- Forgot password, Invoices (CRUD/PDF/QR), WhatsApp management
- Admin panel (dashboard, users, plans, subscriptions, billing, invoices)
- Marketing page, not-found.tsx pages
- Wizard step e2e coverage (depends on real backend; only public surfaces are e2e'd)

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
