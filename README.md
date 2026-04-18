# Olympus Frontend

> "Olympus — Sua empresa 100% autônoma."

Next.js 16 (App Router) client for the Olympus SaaS. Serves three
audiences: the end user (business owner managing leads / agenda /
invoices), the public signup + 8-step onboarding flow, and the Athenio
admin panel.

## Stack

- Next.js 16 with Turbopack
- React 19, TypeScript strict mode, ESM
- Tailwind v4 (no config file — tokens live in `src/app/globals.css`)
- next-intl for pt-BR / en-US / es
- JWT via httpOnly cookies, refresh handled in `src/proxy.ts`
- Zod at every server action boundary
- Vitest (unit) + Playwright (smoke e2e)

## Setup

```bash
npm install
cp .env.example .env.local          # edit NEXT_PUBLIC_API_URL
npm run dev                         # http://localhost:3000
```

The app expects the backend at `NEXT_PUBLIC_API_URL`. For local dev
pointing to production: `NEXT_PUBLIC_API_URL=https://backend.olympus.athenio.ai`.

## Scripts

| Command | What it does |
|---------|--------------|
| `npm run dev` | Next dev server on :3000 with Turbopack |
| `npm run build` | Production build |
| `npm run start` | Production server |
| `npm run lint` | `next lint` |
| `npm run test` | Vitest in watch mode |
| `npm run test:run` | Vitest once (use in CI) |
| `npm run test:e2e` | Playwright smoke tests (spins up `npm run dev`) |

## Project layout

```
src/
├── app/[locale]/
│   ├── (authenticated)/          # user routes + /admin/*
│   ├── login/, signup/, onboarding/
│   └── layout.tsx                # fonts + i18n + Toaster provider
├── components/
│   ├── ui/                       # Tooltip, Avatar, ConfirmDialog, PromptDialog, ...
│   └── sidebar.tsx
├── lib/
│   ├── env.ts                    # single source of NEXT_PUBLIC_API_URL
│   ├── api-envelope.ts           # unwrapEnvelope + ApiError
│   ├── safe-url.ts               # URL protocol guard (http/https only)
│   ├── cache-config.ts           # CACHE_TIMES + CACHE_TAGS
│   └── services/                 # 18 service classes + interfaces
├── i18n/                         # routing + request config
├── proxy.ts                      # next middleware (auth refresh + i18n)
└── __tests__/                    # vitest specs
```

### Auth flow

1. `POST /auth/login` via `authService` → tokens returned in response body.
2. Login Server Action stores `access_token` and `refresh_token` in
   httpOnly cookies with `SameSite=Lax, Secure` (prod).
3. `authFetch` injects `Authorization: Bearer <access>` on every call.
4. On 401, a shared in-flight promise refreshes tokens once per request
   batch and retries — see `src/lib/services/auth-fetch.ts`.
5. `src/proxy.ts` also refreshes proactively when the access token is
   within 30s of expiry, before the page reaches the server component.

### Cache strategy

Server fetches use `authFetch({ revalidate, tags })` to leverage Next
cache. Mutations call `updateTag()` (Next 16 API) + `revalidatePath()`
from server actions. Admin tables cache 30-300s, business verticals
cache 24h, chat messages stay uncached.

### i18n

All user-facing strings live in `messages/{pt-BR,en-US,es}.json`. A
parity test in `src/__tests__/i18n-parity.test.ts` enforces same key set
across locales for `admin.*`, `signup.*`, `onboarding.*`.

## Deployment

1. Set `NEXT_PUBLIC_API_URL` in the hosting env.
2. Set `NEXT_PUBLIC_META_APP_ID` only if WhatsApp channel flow is
   enabled for the tenant.
3. `npm run build` produces a standalone Node build. `npm run start` serves.

## Project state

See `HANDOFF.md` for current stage, recent work, and manual QA checklists.
