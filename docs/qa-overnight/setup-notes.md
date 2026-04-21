# M0 — Setup + baseline

Date: 2026-04-22
Module: M0 (Setup + baseline)
Status: COMPLETED with policy-blocker for next modules

## Discovery

### Backend
- Configured target (frontend `.env`): `https://backend.olympus.athenio.ai`
- Local backend at `localhost:8000`: **DOWN** (curl exit 7 — connection refused)
- Prod backend `/health`: **HTTP 200** (responding)
- Prod backend `/`: 404 (no root handler — expected)

### Frontend
- Dev server: not started by QA. Test against `localhost:3000` will need `npm run dev` first (or use Playwright `webServer` config).
- Default redirect on `/` → 307 (locale middleware)

### Admin credentials
- Email: `admin@athenio.ai` (from CLAUDE.md userEmail context)
- Password: `123456Ab` (discovered in `olympus-backend/schema.sql` seed comment)
- Source: `olympus-backend/schema.sql` line "Password: 123456Ab (bcrypt hash)"
- Validated: POST `/auth/login` → HTTP 201, valid JWT pair returned
- User ID: `593a068c-8054-4805-a1a6-1bf8c4560397`
- Role: `admin`

### Existing test infra
- `e2e/` already has 4 specs: admin-access, auth-forms, signup-flow, msw/{admin-plans,admin-plans-delete,rsc-loop}
- Two Playwright configs: `playwright.config.ts` (real backend), `playwright.msw.config.ts` (mock)
- MSW fixture (`e2e/msw/fixtures.ts`) auto-injects fake JWT cookies at `localhost:3100`

### Working dirs
- Specs: `/tmp/qa-olympus/specs/` (created)
- Screenshots: `/tmp/qa-olympus/shots/` (created)
- Traces: `/tmp/qa-olympus/traces/` (created)

## Blocker before M1

The frontend `.env` is pointed at **`backend.olympus.athenio.ai`** (the production hostname), but the QA plan permits destructive operations:

> "Liberação pra destruir dados: criar/deletar em massa, seeds podem ficar sujos"

If `backend.olympus.athenio.ai` is the real production environment, mass-destructive QA is unsafe. If it is actually a staging/QA environment that happens to live on the same subdomain naming pattern, then the plan is valid.

User decision needed before M1:
1. **Option A** — confirm `backend.olympus.athenio.ai` is a sandbox/staging environment safe to destroy. Proceed against it.
2. **Option B** — start `olympus-backend` locally on `:8000`, repoint `.env` (or `.env.local`) at `http://localhost:8000`, run QA against local DB.
3. **Option C** — switch QA to MSW mode (`playwright.msw.config.ts`). No real backend involved. Trade-off: only catches frontend bugs and contract drift, not real backend behavior.

State.json marked with blocker pending this answer.
