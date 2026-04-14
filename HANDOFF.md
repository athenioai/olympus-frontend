# HANDOFF — Olympus Frontend

> "Olympus - Sua empresa 100% autônoma."

## Project

- **Name**: olympus-frontend
- **Type**: Frontend (Next.js 16 App Router)
- **Version**: v0.1.0 (MVP)

## Current State

- **Stage**: 5 — Finalization (release on main)
- **Branch**: `main` (merged from develop)
- **Build**: Passing — 13 routes, 16 tests, zero TS errors
- **Status**: Ready for deploy + manual browser testing

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
- E2E tests (Playwright)

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
