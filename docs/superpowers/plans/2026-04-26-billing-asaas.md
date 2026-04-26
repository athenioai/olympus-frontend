# Billing UI + Subscriptions Asaas — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Sequential execution per user directive.

**Goal:** Wire the Olympus frontend to the new Asaas-backed subscription lifecycle: ship `/billing` (8 UI states), a global `suspended` banner driven by both `GET /subscriptions/me` and any `402 SUBSCRIPTION_INACTIVE_001` response, 5 new WebSocket handlers (`subscription.*`), an admin refunds panel, and the breaking removal of `planId` from signup + admin/users + admin/subscriptions surfaces.

**Architecture:** Foundation layer (types + services + i18n + cache + error catalog) lands first — every consumer changes type-shape simultaneously. Existing-screen breakage is fixed in `MM-1` so the codebase stays green between micro modules. New screens (user `/billing`, admin `/refunds`) are built on top of stable foundations. WebSocket goes generic (handler map keyed by `type`) so `subscription.*` events route to a global provider mounted in the authenticated layout, while existing chat consumers are migrated to the new API. `authFetch` gains a 402 interceptor that flips a global `suspended` flag in a Context store the layout-mounted banner subscribes to.

**Tech Stack:** Next.js 16 (App Router) · React 19 · Zod 4 · next-intl 4 · sonner · cmdk · Tailwind 4 · Vitest 4 · Playwright (e2e — out of plan-time scope, live in `e2e/`).

---

## Scope check

Single cohesive feature — six brief sections share types, i18n keys, service layer, and lifecycle. No split into separate plans.

---

## Execution order (sequential)

| # | Micro Module | Output | State after MM |
|---|--------------|--------|----------------|
| MM-0 | Foundations (types, services, i18n, cache, error catalog) | service layer + types compile, i18n strings present | tsc may fail at consumer sites until MM-1 lands |
| MM-1 | BREAKING: existing screens align to new types (signup, admin/users, admin/users/[id], admin/subscriptions) | full project compiles, builds, tests green | green again |
| MM-2 | `/billing` page (user) — page, components, modals, server actions, sidebar entry | user can subscribe / change plan / cancel / request refund | `/billing` works end-to-end |
| MM-3 | WebSocket refactor + global suspended banner | `subscription.*` events drive UI; 402 → banner; banner → reactivation hides on `subscription.activated` | global signals working |
| MM-4 | `/admin/refunds` panel (list + approve modal + reject modal + sidebar entry) | admin can review refunds | admin flow works |
| MM-5 | Smoke + integration + HANDOFF.md | regression tests pass, manual QA recorded, HANDOFF updated | feature mergeable |

---

## File map

### Foundation (MM-0)

**Created:**
- `src/lib/services/interfaces/subscriptions-service.ts` — user-facing types, `ISubscriptionsService`.
- `src/lib/services/subscriptions-service.ts` — HTTP client.
- `src/lib/services/subscriptions-service.test.ts` — unit tests.
- `src/lib/services/interfaces/admin-refunds-service.ts` — admin types.
- `src/lib/services/admin-refunds-service.ts` — HTTP client.
- `src/lib/services/admin-refunds-service.test.ts` — unit tests.

**Modified:**
- `src/lib/services/interfaces/admin-types.ts` — `SubscriptionStatus` enum expanded to 6 values, `SubscriptionPublic` reshaped, `AdminUserPublic.planId` removed.
- `src/lib/services/interfaces/admin-user-service.ts` — drop `planId` from `CreateAdminUserPayload`, `UpdateAdminUserPayload`, `ListAdminUsersParams`.
- `src/lib/services/interfaces/admin-subscription-service.ts` — drop `CreateSubscriptionPayload`, narrow `UpdateSubscriptionPayload` to `{status?}`, replace interface methods (`create` removed; `subscribe`, `upgrade`, `downgrade`, `cancel` added on a per-userId basis).
- `src/lib/services/admin-subscription-service.ts` — implementation matches new interface.
- `src/lib/services/admin-user-service.ts` — drop `planId` query param + payload spreads.
- `src/lib/services/interfaces/signup-service.ts` — drop `planId` from `SignupBeginPayload`.
- `src/lib/services/signup-service.ts` — drop `planId` from outbound body.
- `src/lib/services/index.ts` — barrel export new types + services.
- `src/lib/cache-config.ts` — `CACHE_TIMES.subscriptions = 0` (no cache, billing data is hot), `CACHE_TIMES.refunds = 0`, `CACHE_TAGS.subscriptions = "subscriptions"`, `CACHE_TAGS.refunds = "refunds"`.
- `messages/pt-BR.json`, `messages/en-US.json`, `messages/es.json` — `billing.*` block, `admin.refunds.*` block, `sidebar.billing`, `sidebar.admin.refunds`.

### Existing-screen fixes (MM-1)

**Modified:**
- `src/app/[locale]/signup/page.tsx` (or wherever `signup` form is) — remove `planId` field/select.
- `src/app/[locale]/(authenticated)/admin/users/_components/users-view.tsx` (per HANDOFF) — drop `planId` filter, drop plan column from list, drop plan select from create/edit modals.
- `src/app/[locale]/(authenticated)/admin/users/[id]/...` — overview tab fetches plan via `adminSubscriptionService.list({userId})` instead of reading `user.planId`.
- `src/app/[locale]/(authenticated)/admin/users/actions.ts` — drop `planId` from create/update server actions.
- `src/app/[locale]/(authenticated)/admin/subscriptions/page.tsx` + `_components/*` — new shape, new actions (subscribe/upgrade/downgrade/cancel/force-status), drop `billingDay`, add `currentPeriodEnd` and `asaasSubscriptionId` columns.
- `src/app/[locale]/(authenticated)/admin/subscriptions/actions.ts` — replace `create` with `subscribe(userId, planId)`; replace `update(planId)` with `upgrade(userId, planId)` + `downgrade(userId, planId)`; replace `update(billingDay)` with no-op (drop); keep `update(status)` for force-status.

### `/billing` (MM-2)

**Created:**
- `src/app/[locale]/(authenticated)/billing/page.tsx` — server component, fetches `/me` + `/me/payments`, branches by status.
- `src/app/[locale]/(authenticated)/billing/loading.tsx` — skeleton.
- `src/app/[locale]/(authenticated)/billing/actions.ts` — server actions.
- `src/app/[locale]/(authenticated)/billing/actions.test.ts` — unit tests.
- `src/app/[locale]/(authenticated)/billing/_components/plan-grid.tsx` — Caso A (no subscription).
- `src/app/[locale]/(authenticated)/billing/_components/subscription-overview.tsx` — Caso B header + banners + actions (orchestrates).
- `src/app/[locale]/(authenticated)/billing/_components/payments-table.tsx`.
- `src/app/[locale]/(authenticated)/billing/_components/status-badge.tsx`.
- `src/app/[locale]/(authenticated)/billing/_components/change-plan-modal.tsx`.
- `src/app/[locale]/(authenticated)/billing/_components/cancel-modal.tsx`.
- `src/app/[locale]/(authenticated)/billing/_components/refund-request-modal.tsx`.
- `src/app/[locale]/(authenticated)/billing/_components/refund-status-card.tsx`.
- `src/app/[locale]/(authenticated)/billing/_lib/refund-window.ts` + `.test.ts` — pure helper (`isWithinRefundWindow(refundEligibleUntil, now)`).
- `src/app/[locale]/(authenticated)/billing/_lib/plan-change-decision.ts` + `.test.ts` — pure helper (`getPlanChangeAction(currentCost, targetCost): "current" | "upgrade" | "downgrade"`).
- `src/lib/services/plan-options-source.ts` — fallback strategy: try `GET /plans/options`, fall back to a hardcoded catalog with names+features (UUIDs filled in later — see deviation note in MM-2 NM-2.3).

**Modified:**
- `src/components/sidebar.tsx` — add `{ key: "billing", href: "/billing", icon: CreditCard, labelKey: "sidebar.billing" }`.

### WebSocket + global suspended banner (MM-3)

**Modified:**
- `src/lib/ws-manager.ts` — refactor to generic handler map: `Map<string, (payload: unknown) => void>` registered via `register(type, handler)`. The chat-specific extraction stays as a wrapper that registers a `new_message` handler.
- `src/app/[locale]/(authenticated)/conversations/_components/message-thread.tsx` — adapt to new `register(type, handler)` API (was: bare `onMessage`).

**Created:**
- `src/lib/subscription-banner-store.ts` — module-level mutable state (subscribers + setSuspended/clear), exposed as a React Context provider + hook.
- `src/components/subscription-events-provider.tsx` — mounted in authenticated layout; opens a `WsManager` for `subscription.*` events; on each event triggers `router.refresh()` if `/billing` is the current route, sets/clears suspended flag, dispatches toasts.
- `src/components/global-suspended-banner.tsx` — reads the store; renders the banner only when `isSuspended === true`.
- `src/lib/services/auth-fetch.ts` — modify to detect `402` + `SUBSCRIPTION_INACTIVE_001` envelope, call `subscription-banner-store.setSuspended(true)` before throwing the `ApiError` upward.

**Modified:**
- `src/app/[locale]/(authenticated)/layout.tsx` — mount `<SubscriptionEventsProvider>` and `<GlobalSuspendedBanner>` at the top of the `<main>` content.

### `/admin/refunds` (MM-4)

**Created:**
- `src/app/[locale]/(authenticated)/admin/refunds/page.tsx`.
- `src/app/[locale]/(authenticated)/admin/refunds/loading.tsx`.
- `src/app/[locale]/(authenticated)/admin/refunds/actions.ts`.
- `src/app/[locale]/(authenticated)/admin/refunds/actions.test.ts`.
- `src/app/[locale]/(authenticated)/admin/refunds/_components/refunds-table.tsx`.
- `src/app/[locale]/(authenticated)/admin/refunds/_components/approve-refund-modal.tsx`.
- `src/app/[locale]/(authenticated)/admin/refunds/_components/reject-refund-modal.tsx`.

**Modified:**
- `src/components/sidebar.tsx` — add `{ key: "admin-refunds", href: "/admin/refunds", icon: Receipt, labelKey: "sidebar.admin.refunds" }` inside `ADMIN_NAV` (between invoices and avatars).

---

## Pre-flight

**Before touching code:**

1. The branch should be `feat/billing-asaas` from `main` (no other state).
2. `git status` must be clean.
3. `npm run test:run` must be green at start (record the count for regression-checking later).

```bash
git checkout main && git pull && git checkout -b feat/billing-asaas
git status                          # clean
npm run test:run 2>&1 | tail -3     # record the pass count (e.g., "Tests  126 passed")
```

---

## MM-0: Foundations

### Task 1 (NM-0.1): Reshape `admin-types.ts` — expand `SubscriptionStatus`, drop `planId`, reshape `SubscriptionPublic`

**Files:**
- Modify: `src/lib/services/interfaces/admin-types.ts`

**⚠️ Breaking:** every type consumer (subscription pages, user list, plan filter UI) will fail to compile after this. MM-1 fixes them. We accept temporary `tsc` failure between MM-0 and MM-1 because MM-1 lands immediately after.

- [ ] **Step 1: Expand the `SubscriptionStatus` union**

In `src/lib/services/interfaces/admin-types.ts:7`, replace:

```typescript
export type SubscriptionStatus = "active" | "suspended" | "cancelled";
```

with:

```typescript
export type SubscriptionStatus =
  | "active"
  | "past_due"
  | "suspended"
  | "cancelled"
  | "ended"
  | "refunded";
```

- [ ] **Step 2: Drop `planId` from `AdminUserPublic`**

Remove the `readonly planId: string | null;` line. The interface becomes:

```typescript
export interface AdminUserPublic {
  readonly id: string;
  readonly name: string | null;
  readonly email: string;
  readonly role: UserRole;
  readonly contractUrl: string | null;
  readonly onboardingSlug: string | null;
  readonly createdAt: string;
}
```

- [ ] **Step 3: Reshape `SubscriptionPublic`**

Replace the existing interface (currently lines 38-57) with:

```typescript
export interface SubscriptionPublic {
  readonly id: string;
  readonly userId: string;
  /** Null until the user completes the onboarding wizard. */
  readonly userName: string | null;
  /** Null only when the user record was hard-deleted; normally present. */
  readonly userEmail: string | null;
  readonly planId: string;
  /**
   * Denormalized plan name. Null when the plan was soft-deleted and the
   * backend chose not to backfill — callers should fall back to a neutral
   * label.
   */
  readonly planName: string | null;
  readonly status: SubscriptionStatus;
  /** Asaas-side subscription identifier; useful for support/troubleshooting. */
  readonly asaasSubscriptionId: string | null;
  /** ISO 8601 — end of the currently paid cycle. */
  readonly currentPeriodEnd: string;
  /** ISO 8601 — when Asaas will attempt the next charge. Null if not scheduled. */
  readonly nextPaymentAt: string | null;
  /** When true the subscription will end at currentPeriodEnd (no further charges). */
  readonly cancelAtPeriodEnd: boolean;
  readonly cancelledAt: string | null;
  readonly suspendedAt: string | null;
  readonly refundedAt: string | null;
  readonly startedAt: string;
  readonly createdAt: string;
}
```

- [ ] **Step 4: Type-check**

Run: `npx tsc --noEmit 2>&1 | tail -40`
Expected: errors at **other** consumer files (admin/users, admin/subscriptions, action files). The interface file itself compiles. We will fix consumers in MM-1.

> **Important:** Do not commit yet — Tasks 2-5 in this micro module belong to the same logical change ("foundation type rewrite"). Bundle them.

---

### Task 2 (NM-0.2): Drop `planId` from `signup-service` interface + impl

**Files:**
- Modify: `src/lib/services/interfaces/signup-service.ts`
- Modify: `src/lib/services/signup-service.ts`

- [ ] **Step 1: Update the interface**

Replace the contents of `src/lib/services/interfaces/signup-service.ts` with:

```typescript
export interface SignupBeginPayload {
  readonly email: string;
}

export interface SignupBeginResponse {
  readonly email: string;
}

export interface ISignupService {
  begin(payload: SignupBeginPayload): Promise<SignupBeginResponse>;
}
```

- [ ] **Step 2: Update the implementation**

Read `src/lib/services/signup-service.ts`. Find any branch that includes `planId` in the request body. Remove it. The body must be `JSON.stringify({ email: payload.email })` only.

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit 2>&1 | grep -E 'signup' | head -10`
Expected: no errors mentioning `signup-service` (consumers in `signup/page.tsx` may still pass `planId` — fixed in MM-1).

---

### Task 3 (NM-0.3): Drop `planId` from `admin-user-service`

**Files:**
- Modify: `src/lib/services/interfaces/admin-user-service.ts`
- Modify: `src/lib/services/admin-user-service.ts`

- [ ] **Step 1: Update the interface**

In `src/lib/services/interfaces/admin-user-service.ts`:

- Remove `readonly planId?: string;` from `ListAdminUsersParams` (line 24).
- Replace `CreateAdminUserPayload` body (lines 36-39) with:

```typescript
export interface CreateAdminUserPayload {
  readonly email: string;
}
```

- Replace `UpdateAdminUserPayload` body (lines 41-46) with:

```typescript
export interface UpdateAdminUserPayload {
  readonly name?: string;
  readonly email?: string;
  readonly role?: UserRole;
}
```

- [ ] **Step 2: Update the implementation**

Read `src/lib/services/admin-user-service.ts`. Find the `list(...)` method's query-string builder and remove the `planId` branch. Find `create()` and `update()` — they should already be passing the payload as-is via `JSON.stringify`, so removing the optional field from the payload type is enough; nothing else to change unless the impl also reads `payload.planId` directly.

Verify with grep: `grep -n 'planId' src/lib/services/admin-user-service.ts` — expected: zero matches.

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit 2>&1 | grep 'admin-user-service' | head`
Expected: no errors in this file. Errors elsewhere (admin/users page, action) — fixed in MM-1.

---

### Task 4 (NM-0.4): Replace `admin-subscription-service` interface + impl

**Files:**
- Modify: `src/lib/services/interfaces/admin-subscription-service.ts`
- Modify: `src/lib/services/admin-subscription-service.ts`

- [ ] **Step 1: Replace the interface**

Replace the entire contents of `src/lib/services/interfaces/admin-subscription-service.ts`:

```typescript
import type { SubscriptionPublic, SubscriptionStatus } from "./admin-types";

/**
 * Manual override of subscription status (support tooling). Use only after
 * reconciling with Asaas — backend will not push to gateway as part of this
 * call.
 */
export interface UpdateSubscriptionStatusPayload {
  readonly status: SubscriptionStatus;
}

export interface ListAdminSubscriptionsParams {
  readonly page?: number;
  readonly limit?: number;
  readonly status?: SubscriptionStatus;
  readonly planId?: string;
  readonly userId?: string;
}

export interface PaginatedAdminSubscriptions {
  readonly items: readonly SubscriptionPublic[];
  readonly total: number;
  readonly page: number;
  readonly limit: number;
}

/**
 * Admin-side facade over `/admin/subscriptions`. Subscribe / upgrade /
 * downgrade / cancel all act on a target user; the response is the resulting
 * `SubscriptionPublic` (or void for cancel which only mutates state).
 */
export interface IAdminSubscriptionService {
  list(
    params?: ListAdminSubscriptionsParams,
  ): Promise<PaginatedAdminSubscriptions>;
  getById(id: string): Promise<SubscriptionPublic>;
  /** Force a status — support escape hatch. */
  updateStatus(
    id: string,
    payload: UpdateSubscriptionStatusPayload,
  ): Promise<SubscriptionPublic>;
  subscribe(userId: string, planId: string): Promise<SubscriptionPublic>;
  upgrade(userId: string, planId: string): Promise<SubscriptionPublic>;
  downgrade(userId: string, planId: string): Promise<SubscriptionPublic>;
  cancel(userId: string): Promise<SubscriptionPublic>;
}
```

- [ ] **Step 2: Replace the implementation**

Open `src/lib/services/admin-subscription-service.ts`. Replace the class body to match the new interface. Reference shape (existing `authFetch` + `unwrapEnvelope` plumbing):

```typescript
import { authFetch } from "./auth-fetch";
import { unwrapEnvelope } from "@/lib/api-envelope";
import { CACHE_TAGS, CACHE_TIMES } from "@/lib/cache-config";
import type { SubscriptionPublic } from "./interfaces/admin-types";
import type {
  IAdminSubscriptionService,
  ListAdminSubscriptionsParams,
  PaginatedAdminSubscriptions,
  UpdateSubscriptionStatusPayload,
} from "./interfaces/admin-subscription-service";

function buildQuery(params?: ListAdminSubscriptionsParams): string {
  const search = new URLSearchParams();
  if (params?.page) search.set("page", String(params.page));
  if (params?.limit) search.set("limit", String(params.limit));
  if (params?.status) search.set("status", params.status);
  if (params?.planId) search.set("planId", params.planId);
  if (params?.userId) search.set("userId", params.userId);
  return search.toString();
}

class AdminSubscriptionService implements IAdminSubscriptionService {
  async list(
    params?: ListAdminSubscriptionsParams,
  ): Promise<PaginatedAdminSubscriptions> {
    const query = buildQuery(params);
    const path = query
      ? `/admin/subscriptions?${query}`
      : "/admin/subscriptions";
    const response = await authFetch(path, {
      revalidate: CACHE_TIMES.adminSubscriptions,
      tags: [CACHE_TAGS.adminSubscriptions],
    });
    return unwrapEnvelope<PaginatedAdminSubscriptions>(response);
  }

  async getById(id: string): Promise<SubscriptionPublic> {
    const response = await authFetch(
      `/admin/subscriptions/${encodeURIComponent(id)}`,
      {
        revalidate: CACHE_TIMES.adminSubscriptions,
        tags: [CACHE_TAGS.adminSubscriptions],
      },
    );
    return unwrapEnvelope<SubscriptionPublic>(response);
  }

  async updateStatus(
    id: string,
    payload: UpdateSubscriptionStatusPayload,
  ): Promise<SubscriptionPublic> {
    const response = await authFetch(
      `/admin/subscriptions/${encodeURIComponent(id)}`,
      { method: "PATCH", body: JSON.stringify(payload) },
    );
    return unwrapEnvelope<SubscriptionPublic>(response);
  }

  async subscribe(userId: string, planId: string): Promise<SubscriptionPublic> {
    const response = await authFetch(
      `/admin/subscriptions/${encodeURIComponent(userId)}/subscribe`,
      { method: "POST", body: JSON.stringify({ planId }) },
    );
    return unwrapEnvelope<SubscriptionPublic>(response);
  }

  async upgrade(userId: string, planId: string): Promise<SubscriptionPublic> {
    const response = await authFetch(
      `/admin/subscriptions/${encodeURIComponent(userId)}/upgrade`,
      { method: "POST", body: JSON.stringify({ planId }) },
    );
    return unwrapEnvelope<SubscriptionPublic>(response);
  }

  async downgrade(userId: string, planId: string): Promise<SubscriptionPublic> {
    const response = await authFetch(
      `/admin/subscriptions/${encodeURIComponent(userId)}/downgrade`,
      { method: "POST", body: JSON.stringify({ planId }) },
    );
    return unwrapEnvelope<SubscriptionPublic>(response);
  }

  async cancel(userId: string): Promise<SubscriptionPublic> {
    const response = await authFetch(
      `/admin/subscriptions/${encodeURIComponent(userId)}/cancel`,
      { method: "POST" },
    );
    return unwrapEnvelope<SubscriptionPublic>(response);
  }
}

export const adminSubscriptionService = new AdminSubscriptionService();
```

- [ ] **Step 3: Type-check the file in isolation**

Run: `npx tsc --noEmit 2>&1 | grep 'admin-subscription-service' | head`
Expected: no errors mentioning this file. Cache config errors come up if `CACHE_TIMES.adminSubscriptions` doesn't exist — verify in `cache-config.ts:17` (already there as `adminSubscriptions: 60`). Good.

---

### Task 5 (NM-0.5): Single bundled commit for the type rewrite

- [ ] **Step 1: Stage the type rewrite + service files**

```bash
git add \
  src/lib/services/interfaces/admin-types.ts \
  src/lib/services/interfaces/admin-user-service.ts \
  src/lib/services/admin-user-service.ts \
  src/lib/services/interfaces/admin-subscription-service.ts \
  src/lib/services/admin-subscription-service.ts \
  src/lib/services/interfaces/signup-service.ts \
  src/lib/services/signup-service.ts
```

- [ ] **Step 2: Commit (tsc still failing at consumer sites — that's expected)**

```bash
git commit -m "$(cat <<'EOF'
refactor(types): drop planId from user/signup, expand subscription contract

Foundation rewrite for the Asaas billing integration:
- SubscriptionStatus expands from 3 to 6 values (past_due/ended/refunded).
- SubscriptionPublic adds asaasSubscriptionId, currentPeriodEnd,
  nextPaymentAt, cancelAtPeriodEnd, suspendedAt, refundedAt, startedAt;
  drops billingDay (Asaas owns the cycle now).
- AdminUserPublic / CreateAdminUserPayload / UpdateAdminUserPayload /
  ListAdminUsersParams / SignupBeginPayload all drop planId — backend
  rejects the field and admins associate plans via subscriptions.
- IAdminSubscriptionService no longer creates from { userId, planId,
  billingDay }; per-user subscribe/upgrade/downgrade/cancel endpoints
  replace the flat CRUD surface.

Existing consumer screens (admin/users, admin/subscriptions, signup form)
are temporarily broken; MM-1 fixes them in the same branch.
EOF
)"
```

> Don't push yet — keep the branch dirty until MM-1 makes tsc clean. We push after MM-1.

---

### Task 6 (NM-0.6): Create user-facing `subscriptions-service`

**Files:**
- Create: `src/lib/services/interfaces/subscriptions-service.ts`
- Create: `src/lib/services/subscriptions-service.ts`
- Create: `src/lib/services/subscriptions-service.test.ts`

- [ ] **Step 1: Write the failing tests**

`src/lib/services/subscriptions-service.test.ts`:

```typescript
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

vi.mock("next/headers", () => ({
  cookies: async () => ({ get: () => ({ value: "fake-jwt" }) }),
}));

vi.mock("@/lib/env", () => ({
  API_URL: "https://api.test",
  IS_PRODUCTION: false,
}));

import { subscriptionsService } from "./subscriptions-service";

const successEnvelope = (data: unknown) =>
  new Response(
    JSON.stringify({
      success: true,
      data,
      error: null,
      meta: { requestId: "r1" },
    }),
    { status: 200, headers: { "content-type": "application/json" } },
  );

const errorEnvelope = (status: number, code: string) =>
  new Response(
    JSON.stringify({
      success: false,
      data: null,
      error: { code, message: code },
      meta: { requestId: "r1" },
    }),
    { status, headers: { "content-type": "application/json" } },
  );

describe("subscriptionsService", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("getMe hits /subscriptions/me and unwraps the envelope", async () => {
    fetchMock.mockResolvedValueOnce(
      successEnvelope({
        subscriptionId: "s1",
        plan: { id: "p1", name: "Fundador", cost: 797 },
        status: "active",
        currentPeriodEnd: "2026-05-25T00:00:00Z",
        nextPaymentAt: "2026-05-22T00:00:00Z",
        refundEligibleUntil: "2026-05-10T00:00:00Z",
        pendingChange: null,
        cancelAtPeriodEnd: false,
      }),
    );
    const result = await subscriptionsService.getMe();
    const [url] = fetchMock.mock.calls[0];
    expect(String(url)).toBe("https://api.test/subscriptions/me");
    expect(result.plan.name).toBe("Fundador");
  });

  it("getMe propagates SUB_NOT_FOUND_001 as ApiError(404)", async () => {
    fetchMock.mockResolvedValueOnce(errorEnvelope(404, "SUB_NOT_FOUND_001"));
    await expect(subscriptionsService.getMe()).rejects.toMatchObject({
      code: "SUB_NOT_FOUND_001",
      status: 404,
    });
  });

  it("subscribe POSTs planId and returns asaasInvoiceUrl", async () => {
    fetchMock.mockResolvedValueOnce(
      successEnvelope({
        subscriptionId: "s1",
        asaasInvoiceUrl: "https://asaas/invoice/abc",
      }),
    );
    const result = await subscriptionsService.subscribe("p1");
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toBe("https://api.test/subscriptions/subscribe");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body)).toEqual({ planId: "p1" });
    expect(result.asaasInvoiceUrl).toBe("https://asaas/invoice/abc");
  });

  it("upgrade and downgrade POST to dedicated endpoints", async () => {
    fetchMock.mockResolvedValueOnce(successEnvelope({ ok: true }));
    await subscriptionsService.upgrade("p2");
    expect(String(fetchMock.mock.calls[0][0])).toBe(
      "https://api.test/subscriptions/upgrade",
    );

    fetchMock.mockResolvedValueOnce(successEnvelope({ ok: true }));
    await subscriptionsService.downgrade("p3");
    expect(String(fetchMock.mock.calls[1][0])).toBe(
      "https://api.test/subscriptions/downgrade",
    );
  });

  it("cancel sends optional reason", async () => {
    fetchMock.mockResolvedValueOnce(successEnvelope({ ok: true }));
    await subscriptionsService.cancel("teste");
    const [, init] = fetchMock.mock.calls[0];
    expect(JSON.parse(init.body)).toEqual({ reason: "teste" });
  });

  it("cancel without reason omits the field", async () => {
    fetchMock.mockResolvedValueOnce(successEnvelope({ ok: true }));
    await subscriptionsService.cancel();
    const [, init] = fetchMock.mock.calls[0];
    expect(JSON.parse(init.body)).toEqual({});
  });

  it("refundRequest sends required reason", async () => {
    fetchMock.mockResolvedValueOnce(successEnvelope({ ok: true }));
    await subscriptionsService.refundRequest("Não consegui usar");
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toBe(
      "https://api.test/subscriptions/refund-request",
    );
    expect(JSON.parse(init.body)).toEqual({ reason: "Não consegui usar" });
  });

  it("listMyPayments returns the array directly", async () => {
    fetchMock.mockResolvedValueOnce(
      successEnvelope([
        {
          id: "pay1",
          amount: 797,
          status: "confirmed",
          dueDate: "2026-04-28",
          paidAt: "2026-04-27T10:00:00Z",
          refundedAt: null,
          invoiceUrl: "https://invoice/x",
        },
      ]),
    );
    const result = await subscriptionsService.listMyPayments();
    expect(result).toHaveLength(1);
    expect(result[0].status).toBe("confirmed");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:run -- src/lib/services/subscriptions-service.test.ts`
Expected: FAIL with "Cannot find module './subscriptions-service'".

- [ ] **Step 3: Create the type interface**

`src/lib/services/interfaces/subscriptions-service.ts`:

```typescript
import type { SubscriptionStatus } from "./admin-types";

export type PaymentStatus = "pending" | "confirmed" | "overdue" | "refunded";

export interface SubscriptionPlan {
  readonly id: string;
  readonly name: string;
  readonly cost: number;
}

export interface PendingPlanChange {
  readonly toPlanId: string;
  readonly toPlanName: string;
  /** ISO 8601 — when the downgrade kicks in. */
  readonly effectiveAt: string;
}

/** User-facing snapshot of the caller's own subscription. */
export interface MySubscription {
  readonly subscriptionId: string;
  readonly plan: SubscriptionPlan;
  readonly status: SubscriptionStatus;
  readonly currentPeriodEnd: string;
  readonly nextPaymentAt: string | null;
  /** ISO 8601 — last moment the user can request a refund. */
  readonly refundEligibleUntil: string;
  readonly pendingChange: PendingPlanChange | null;
  readonly cancelAtPeriodEnd: boolean;
}

export interface MyPayment {
  readonly id: string;
  readonly amount: number;
  readonly status: PaymentStatus;
  /** YYYY-MM-DD. */
  readonly dueDate: string;
  readonly paidAt: string | null;
  readonly refundedAt: string | null;
  readonly invoiceUrl: string | null;
}

export interface SubscribeResponse {
  readonly subscriptionId: string;
  readonly asaasInvoiceUrl: string;
}

export interface ISubscriptionsService {
  getMe(): Promise<MySubscription>;
  listMyPayments(): Promise<readonly MyPayment[]>;
  subscribe(planId: string): Promise<SubscribeResponse>;
  upgrade(planId: string): Promise<MySubscription>;
  downgrade(planId: string): Promise<MySubscription>;
  cancel(reason?: string): Promise<MySubscription>;
  refundRequest(reason: string): Promise<void>;
}
```

- [ ] **Step 4: Implement the HTTP client**

`src/lib/services/subscriptions-service.ts`:

```typescript
import { authFetch } from "./auth-fetch";
import { unwrapEnvelope } from "@/lib/api-envelope";
import type {
  ISubscriptionsService,
  MyPayment,
  MySubscription,
  SubscribeResponse,
} from "./interfaces/subscriptions-service";

class SubscriptionsService implements ISubscriptionsService {
  /** Subscription detail is hot — bypass the Data Cache. */
  async getMe(): Promise<MySubscription> {
    const response = await authFetch("/subscriptions/me", { cache: "no-store" });
    return unwrapEnvelope<MySubscription>(response);
  }

  async listMyPayments(): Promise<readonly MyPayment[]> {
    const response = await authFetch("/subscriptions/me/payments", {
      cache: "no-store",
    });
    return unwrapEnvelope<readonly MyPayment[]>(response);
  }

  async subscribe(planId: string): Promise<SubscribeResponse> {
    const response = await authFetch("/subscriptions/subscribe", {
      method: "POST",
      body: JSON.stringify({ planId }),
    });
    return unwrapEnvelope<SubscribeResponse>(response);
  }

  async upgrade(planId: string): Promise<MySubscription> {
    const response = await authFetch("/subscriptions/upgrade", {
      method: "POST",
      body: JSON.stringify({ planId }),
    });
    return unwrapEnvelope<MySubscription>(response);
  }

  async downgrade(planId: string): Promise<MySubscription> {
    const response = await authFetch("/subscriptions/downgrade", {
      method: "POST",
      body: JSON.stringify({ planId }),
    });
    return unwrapEnvelope<MySubscription>(response);
  }

  async cancel(reason?: string): Promise<MySubscription> {
    const body = reason ? { reason } : {};
    const response = await authFetch("/subscriptions/cancel", {
      method: "POST",
      body: JSON.stringify(body),
    });
    return unwrapEnvelope<MySubscription>(response);
  }

  async refundRequest(reason: string): Promise<void> {
    const response = await authFetch("/subscriptions/refund-request", {
      method: "POST",
      body: JSON.stringify({ reason }),
    });
    await unwrapEnvelope<unknown>(response);
  }
}

export const subscriptionsService = new SubscriptionsService();
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm run test:run -- src/lib/services/subscriptions-service.test.ts`
Expected: 8 cases PASS.

- [ ] **Step 6: Commit (no push yet)**

```bash
git add src/lib/services/interfaces/subscriptions-service.ts \
        src/lib/services/subscriptions-service.ts \
        src/lib/services/subscriptions-service.test.ts
git commit -m "feat(billing): add subscriptions-service for user-facing endpoints"
```

---

### Task 7 (NM-0.7): Create `admin-refunds-service`

**Files:**
- Create: `src/lib/services/interfaces/admin-refunds-service.ts`
- Create: `src/lib/services/admin-refunds-service.ts`
- Create: `src/lib/services/admin-refunds-service.test.ts`

- [ ] **Step 1: Write the failing tests**

`src/lib/services/admin-refunds-service.test.ts`:

```typescript
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

vi.mock("next/headers", () => ({
  cookies: async () => ({ get: () => ({ value: "fake-jwt" }) }),
}));

vi.mock("@/lib/env", () => ({
  API_URL: "https://api.test",
  IS_PRODUCTION: false,
}));

import { adminRefundsService } from "./admin-refunds-service";

const successEnvelope = (data: unknown) =>
  new Response(
    JSON.stringify({
      success: true, data, error: null, meta: { requestId: "r1" },
    }),
    { status: 200, headers: { "content-type": "application/json" } },
  );

describe("adminRefundsService", () => {
  let fetchMock: ReturnType<typeof vi.fn>;
  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
  });
  afterEach(() => vi.unstubAllGlobals());

  it("list builds /admin/refunds with status filter", async () => {
    fetchMock.mockResolvedValueOnce(successEnvelope([]));
    await adminRefundsService.list({ status: "pending" });
    expect(String(fetchMock.mock.calls[0][0])).toBe(
      "https://api.test/admin/refunds?status=pending",
    );
  });

  it("approve sends optional notes", async () => {
    fetchMock.mockResolvedValueOnce(successEnvelope({ ok: true }));
    await adminRefundsService.approve("rid1", "tudo certo");
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toBe("https://api.test/admin/refunds/rid1/approve");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body)).toEqual({ notes: "tudo certo" });
  });

  it("approve without notes sends empty body", async () => {
    fetchMock.mockResolvedValueOnce(successEnvelope({ ok: true }));
    await adminRefundsService.approve("rid1");
    const [, init] = fetchMock.mock.calls[0];
    expect(JSON.parse(init.body)).toEqual({});
  });

  it("reject requires notes (sent verbatim)", async () => {
    fetchMock.mockResolvedValueOnce(successEnvelope({ ok: true }));
    await adminRefundsService.reject("rid1", "fora da política");
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toBe("https://api.test/admin/refunds/rid1/reject");
    expect(JSON.parse(init.body)).toEqual({ notes: "fora da política" });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:run -- src/lib/services/admin-refunds-service.test.ts`
Expected: FAIL with module-not-found.

- [ ] **Step 3: Create the interface**

`src/lib/services/interfaces/admin-refunds-service.ts`:

```typescript
export type RefundRequestStatus = "pending" | "approved" | "rejected";

export interface RefundRequestPublic {
  readonly id: string;
  readonly subscriptionId: string;
  readonly userId: string;
  readonly userName: string;
  readonly userEmail: string;
  readonly reason: string;
  readonly status: RefundRequestStatus;
  readonly reviewedBy: string | null;
  readonly reviewedAt: string | null;
  readonly reviewerNotes: string | null;
  readonly asaasRefundId: string | null;
  readonly createdAt: string;
}

export interface ListRefundRequestsParams {
  readonly status?: RefundRequestStatus;
}

export interface IAdminRefundsService {
  list(
    params?: ListRefundRequestsParams,
  ): Promise<readonly RefundRequestPublic[]>;
  approve(id: string, notes?: string): Promise<RefundRequestPublic>;
  /** `notes` is required by the backend (rejection reason shown to the user). */
  reject(id: string, notes: string): Promise<RefundRequestPublic>;
}
```

- [ ] **Step 4: Implement the client**

`src/lib/services/admin-refunds-service.ts`:

```typescript
import { authFetch } from "./auth-fetch";
import { unwrapEnvelope } from "@/lib/api-envelope";
import { CACHE_TAGS, CACHE_TIMES } from "@/lib/cache-config";
import type {
  IAdminRefundsService,
  ListRefundRequestsParams,
  RefundRequestPublic,
} from "./interfaces/admin-refunds-service";

function buildQuery(params?: ListRefundRequestsParams): string {
  const search = new URLSearchParams();
  if (params?.status) search.set("status", params.status);
  return search.toString();
}

class AdminRefundsService implements IAdminRefundsService {
  async list(
    params?: ListRefundRequestsParams,
  ): Promise<readonly RefundRequestPublic[]> {
    const query = buildQuery(params);
    const path = query ? `/admin/refunds?${query}` : "/admin/refunds";
    const response = await authFetch(path, {
      revalidate: CACHE_TIMES.refunds,
      tags: [CACHE_TAGS.refunds],
    });
    return unwrapEnvelope<readonly RefundRequestPublic[]>(response);
  }

  async approve(id: string, notes?: string): Promise<RefundRequestPublic> {
    const body = notes ? { notes } : {};
    const response = await authFetch(
      `/admin/refunds/${encodeURIComponent(id)}/approve`,
      { method: "POST", body: JSON.stringify(body) },
    );
    return unwrapEnvelope<RefundRequestPublic>(response);
  }

  async reject(id: string, notes: string): Promise<RefundRequestPublic> {
    const response = await authFetch(
      `/admin/refunds/${encodeURIComponent(id)}/reject`,
      { method: "POST", body: JSON.stringify({ notes }) },
    );
    return unwrapEnvelope<RefundRequestPublic>(response);
  }
}

export const adminRefundsService = new AdminRefundsService();
```

- [ ] **Step 5: Verify**

Run: `npm run test:run -- src/lib/services/admin-refunds-service.test.ts`
Expected: 4 cases PASS.

- [ ] **Step 6: Commit**

```bash
git add src/lib/services/interfaces/admin-refunds-service.ts \
        src/lib/services/admin-refunds-service.ts \
        src/lib/services/admin-refunds-service.test.ts
git commit -m "feat(billing): add admin-refunds-service"
```

---

### Task 8 (NM-0.8): Cache config, error catalog, barrel export

**Files:**
- Modify: `src/lib/cache-config.ts`
- Modify: `src/lib/services/index.ts`

- [ ] **Step 1: Add cache entries**

In `src/lib/cache-config.ts`, append to `CACHE_TIMES` (after `adminAvatars: 300`):

```typescript
  subscriptions: 0,    // hot — billing data must reflect latest webhook state
  refunds: 30,         // 30s — refund queue list
```

And to `CACHE_TAGS` (after `adminAvatars: "admin-avatars"`):

```typescript
  subscriptions: "subscriptions",
  refunds: "refunds",
```

- [ ] **Step 2: Wire the barrel export**

In `src/lib/services/index.ts`, after the existing service-instance exports, add:

```typescript
export { subscriptionsService } from "./subscriptions-service";
export { adminRefundsService } from "./admin-refunds-service";
```

After the existing type-export blocks, add:

```typescript
// Subscriptions (user-facing) types
export type {
  ISubscriptionsService,
  MyPayment,
  MySubscription,
  PaymentStatus,
  PendingPlanChange,
  SubscribeResponse,
  SubscriptionPlan,
} from "./interfaces/subscriptions-service";

// Admin refunds types
export type {
  IAdminRefundsService,
  ListRefundRequestsParams,
  RefundRequestPublic,
  RefundRequestStatus,
} from "./interfaces/admin-refunds-service";

// Admin subscription types (renamed export)
export type { UpdateSubscriptionStatusPayload } from "./interfaces/admin-subscription-service";
```

- [ ] **Step 3: Type-check the foundation**

Run: `npx tsc --noEmit 2>&1 | grep -v 'admin/users\|admin/subscriptions\|signup' | head -30`
Expected: zero errors **outside** the consumer screens (which we fix in MM-1). Output should be empty after the grep filter.

- [ ] **Step 4: Commit**

```bash
git add src/lib/cache-config.ts src/lib/services/index.ts
git commit -m "feat(billing): cache config + barrel exports for subscriptions/refunds"
```

---

### Task 9 (NM-0.9): i18n strings — `billing.*`, `admin.refunds.*`, `sidebar.billing`, `sidebar.admin.refunds`, status badges

**Files:**
- Modify: `messages/pt-BR.json`
- Modify: `messages/en-US.json`
- Modify: `messages/es.json`

- [ ] **Step 1: Add to pt-BR**

Inside `"sidebar"`, between `"products"` and `"settings"` (or alongside the recently added `"ads"`), add:

```json
"billing": "Assinatura",
```

Inside `"sidebar.admin"`, between `"invoices"` and `"avatars"`, add:

```json
"refunds": "Reembolsos",
```

At the appropriate top-level position (file is logically grouped — alongside `ads` is correct), add a new top-level `"billing"` block:

```json
"billing": {
  "title": "Assinatura",
  "subtitle": "Gerencie seu plano, pagamentos e cancelamentos.",
  "loadFailed": "Não foi possível carregar sua assinatura. Tente novamente mais tarde.",
  "choosePlan": {
    "title": "Escolha seu plano",
    "subtitle": "Comece com qualquer plano. Você pode mudar a qualquer momento."
  },
  "plans": {
    "solo": { "name": "Solo", "features": "Para profissionais autônomos" },
    "fundador": { "name": "Fundador", "features": "Para times pequenos" },
    "essencial": { "name": "Essencial", "features": "Operação completa" },
    "operador": { "name": "Operador", "features": "Volume médio" },
    "estrategico": { "name": "Estratégico", "features": "Alta escala" }
  },
  "subscribe": "Assinar",
  "subscribeProcessing": "Aguardando pagamento — pague o PIX e volte aqui.",
  "subscribeOpenInvoice": "Abrir cobrança PIX",
  "currentPlan": "Plano atual",
  "nextPaymentAt": "Próxima cobrança em {date}",
  "noNextPayment": "Sem próxima cobrança agendada",
  "monthly": "/mês",
  "status": {
    "active": "Ativa",
    "past_due": "Atrasada",
    "suspended": "Suspensa",
    "cancelled": "Cancelada — acesso até {date}",
    "ended": "Encerrada",
    "refunded": "Reembolsada em {date}"
  },
  "banners": {
    "pendingChange": "Downgrade para {planName} será aplicado em {date}.",
    "cancelAtPeriodEnd": "Cancelamento agendado. Você tem acesso até {date}.",
    "refundEligible": "🔁 Você pode solicitar reembolso até {date}."
  },
  "actions": {
    "changePlan": "Mudar plano",
    "cancel": "Cancelar assinatura",
    "requestRefund": "Solicitar reembolso"
  },
  "payments": {
    "title": "Faturas",
    "empty": "Nenhuma fatura emitida ainda.",
    "dueDate": "Vencimento",
    "amount": "Valor",
    "statusLabel": "Status",
    "paidAt": "Pago em",
    "actions": "Ações",
    "viewInvoice": "Ver fatura",
    "status": {
      "pending": "Pendente",
      "confirmed": "Pago",
      "overdue": "Vencido",
      "refunded": "Reembolsado"
    }
  },
  "changePlanModal": {
    "title": "Mudar plano",
    "current": "Plano atual",
    "upgrade": "Fazer upgrade",
    "downgrade": "Fazer downgrade",
    "confirmUpgrade": {
      "title": "Confirmar upgrade",
      "body": "Upgrade aplicado imediatamente. Você continua com o ciclo atual até {date}, agora no plano superior. A janela de reembolso de 15 dias **não** é resetada.",
      "confirm": "Confirmar upgrade"
    },
    "confirmDowngrade": {
      "title": "Confirmar downgrade",
      "body": "Downgrade será aplicado em {date}. Até lá você continua no plano atual.",
      "confirm": "Confirmar downgrade"
    }
  },
  "cancelModal": {
    "title": "Cancelar assinatura?",
    "body": "Você terá acesso até {date}. Após essa data, sua assinatura será encerrada e você perderá acesso aos recursos pagos.",
    "reasonLabel": "Motivo (opcional)",
    "reasonPlaceholder": "Conte o que motivou o cancelamento — ajuda a melhorar.",
    "confirm": "Confirmar cancelamento"
  },
  "refundModal": {
    "title": "Solicitar reembolso",
    "body": "Você está dentro da janela de garantia de 15 dias. Após enviar, nossa equipe revisa em até 24h.",
    "reasonLabel": "Motivo",
    "reasonPlaceholder": "Conte por que está pedindo o reembolso (mínimo 10 caracteres).",
    "confirm": "Enviar solicitação"
  },
  "refundStatus": {
    "pending": "🕐 Solicitação em análise — retorno em até 24h.",
    "approved": "✅ Reembolso aprovado.",
    "rejected": "❌ Reembolso rejeitado: {reason}"
  },
  "globalSuspended": {
    "title": "Sua assinatura está suspensa.",
    "body": "Regularize o pagamento para reativar a operação automatizada.",
    "payNow": "Pagar agora",
    "goToBilling": "Ir para Assinatura"
  },
  "toasts": {
    "planUpdated": "Plano atualizado.",
    "subscriptionCancelled": "Assinatura cancelada — acesso até {date}.",
    "refundRequested": "Solicitação de reembolso enviada.",
    "wsPaymentConfirmed": "Pagamento confirmado.",
    "wsPastDue": "Cobrança atrasada — pague em até 3 dias para evitar suspensão.",
    "wsSuspended": "Assinatura suspensa por inadimplência.",
    "wsRefunded": "Reembolso aprovado — cai em até 5 dias úteis.",
    "wsActivated": "Assinatura reativada."
  },
  "errors": {
    "SUB_NOT_FOUND_001": "Assinatura não encontrada.",
    "SUB_ACTIVE_001": "Você já possui uma assinatura ativa.",
    "SUBSCRIPTION_NOT_ACTIVE_001": "Sua assinatura precisa estar ativa para esta operação.",
    "INVALID_PLAN_CHANGE_001": "Mudança de plano inválida para esta operação.",
    "BILLING_GATEWAY_001": "Falha temporária no gateway de cobrança. Tente novamente em instantes.",
    "BILLING_GATEWAY_002": "O gateway de cobrança rejeitou os dados. Verifique e tente de novo.",
    "REFUND_WINDOW_EXPIRED_001": "A janela de 15 dias para reembolso já expirou.",
    "REFUND_REQUEST_PENDING_001": "Você já tem uma solicitação de reembolso em análise.",
    "REFUND_REQUEST_NOT_FOUND_001": "Solicitação de reembolso não encontrada.",
    "PLAN_NOT_FOUND_001": "Plano não encontrado."
  }
}
```

Inside the existing `"admin"` block, add a `"refunds"` sub-block (alphabetically between `plans` and `subscriptions` — verify file order before placing):

```json
"refunds": {
  "title": "Solicitações de reembolso",
  "subtitle": "Aprove ou rejeite reembolsos solicitados pelos usuários.",
  "loadFailed": "Não foi possível carregar as solicitações.",
  "empty": "Nenhuma solicitação para revisar.",
  "filters": {
    "pending": "Pendentes",
    "approved": "Aprovadas",
    "rejected": "Rejeitadas"
  },
  "columns": {
    "user": "Usuário",
    "reason": "Motivo",
    "createdAt": "Solicitado em",
    "statusLabel": "Status",
    "actions": "Ações"
  },
  "status": {
    "pending": "Pendente",
    "approved": "Aprovado",
    "rejected": "Rejeitado"
  },
  "actions": {
    "approve": "Aprovar",
    "reject": "Rejeitar"
  },
  "approveModal": {
    "title": "Aprovar reembolso de {userName}?",
    "body": "O Asaas será cobrado para estornar o último pagamento confirmado. A assinatura será cancelada (não haverá novas cobranças).",
    "notesLabel": "Notas internas (opcional)",
    "confirm": "Confirmar aprovação"
  },
  "rejectModal": {
    "title": "Rejeitar reembolso de {userName}?",
    "body": "O usuário verá seu motivo na notificação.",
    "notesLabel": "Motivo da rejeição",
    "confirm": "Confirmar rejeição"
  },
  "toasts": {
    "approved": "Reembolso aprovado.",
    "rejected": "Reembolso rejeitado."
  },
  "errors": {
    "REFUND_REQUEST_NOT_FOUND_001": "Solicitação não encontrada.",
    "REFUND_REQUEST_PENDING_001": "Esta solicitação já não está pendente.",
    "BILLING_GATEWAY_001": "Falha temporária no Asaas. Tente novamente.",
    "BILLING_GATEWAY_002": "O Asaas rejeitou o estorno.",
    "GENERAL_VALIDATION_001": "Não há pagamento confirmado para estornar."
  }
}
```

Inside the existing admin subscriptions block (`admin.subscriptions.*`), add (or replace) a status-label sub-block to cover the new 6 values, plus column headers we'll need in MM-1:

```json
"statusLabels": {
  "active": "Ativa",
  "past_due": "Atrasada",
  "suspended": "Suspensa",
  "cancelled": "Cancelada",
  "ended": "Encerrada",
  "refunded": "Reembolsada"
},
"columns": {
  "currentPeriodEnd": "Próximo ciclo",
  "asaasSubscriptionId": "ID Asaas"
},
"actions": {
  "subscribe": "Assinar",
  "upgrade": "Upgrade",
  "downgrade": "Downgrade",
  "cancel": "Cancelar",
  "forceStatus": "Forçar status"
},
"forceStatusModal": {
  "title": "Forçar status",
  "body": "Use só após reconciliar manualmente com o Asaas. Esta ação não dispara cobrança nem estorno no gateway.",
  "statusLabel": "Novo status",
  "confirm": "Aplicar"
}
```

- [ ] **Step 2: Mirror in en-US (English copy)**

Same shape, English copy. Use natural translations — for status, use "Active / Past due / Suspended / Cancelled — access until {date} / Ended / Refunded on {date}".

- [ ] **Step 3: Mirror in es (Spanish copy)**

Same shape, Spanish copy. Use es-LA conventions — "Activa / Vencida / Suspendida / Cancelada — acceso hasta {date} / Finalizada / Reembolsada el {date}".

- [ ] **Step 4: Validate JSON syntax in all three locales**

```bash
node -e "JSON.parse(require('fs').readFileSync('messages/pt-BR.json','utf-8')); console.log('pt-BR OK')"
node -e "JSON.parse(require('fs').readFileSync('messages/en-US.json','utf-8')); console.log('en-US OK')"
node -e "JSON.parse(require('fs').readFileSync('messages/es.json','utf-8')); console.log('es OK')"
```

- [ ] **Step 5: Run i18n parity test (only tracks admin/signup/onboarding — but verify no breakage)**

Run: `npm run test:run -- src/__tests__/i18n-parity.test.ts`
Expected: PASS. (If the new `admin.refunds.*` block has different keys across locales, the test will catch it — fix locally before continuing.)

- [ ] **Step 6: Commit**

```bash
git add messages/pt-BR.json messages/en-US.json messages/es.json
git commit -m "feat(billing): add billing/refunds i18n keys + status labels"
```

---

> **End of MM-0.** State at this point: types compile, new services compile + tested, i18n strings present, barrel exports updated. **Three consumer files are temporarily broken** (`admin/users`, `admin/subscriptions`, `signup` page) — `tsc` will fail at those locations. **MM-1 fixes them before any push.**

---

## MM-1: Fix existing screens (BREAKING from MM-0)

### Task 10 (NM-1.1): Fix `signup` public page

**Files:**
- Modify: any file under `src/app/[locale]/signup/` referencing `planId` (likely `page.tsx` or a form component).
- Modify: any signup `actions.ts`.

- [ ] **Step 1: Locate the references**

Run: `grep -rn 'planId' src/app/\[locale\]/signup/`
Expected: a small set of hits (probably 0–4). Document the file paths.

If the grep returns zero, the signup form already does not pass `planId` (most likely — HANDOFF says signup was added recently with `{ email }` only). Skip Steps 2-3 and just verify with the build.

- [ ] **Step 2: For each hit, remove the field**

For form inputs: drop the `<select name="planId">` JSX (and its label, hint, etc.).
For server actions: drop the `planId` extraction from `formData` and from the `signupService.begin(...)` call's payload.
For Zod schemas in the action: drop the `planId` key.

- [ ] **Step 3: Verify**

Run: `grep -rn 'planId' src/app/\[locale\]/signup/`
Expected: zero matches.

Run: `npx tsc --noEmit 2>&1 | grep 'signup' | head`
Expected: zero errors.

- [ ] **Step 4: Defer commit (combine with all of MM-1 in a single restoration commit at the end)**

---

### Task 11 (NM-1.2): Fix `admin/users` list + create modal + edit modal

**Files:**
- Modify: `src/app/[locale]/(authenticated)/admin/users/_components/users-view.tsx` (per HANDOFF — confirm path).
- Modify: `src/app/[locale]/(authenticated)/admin/users/actions.ts`.
- Modify: `src/app/[locale]/(authenticated)/admin/users/page.tsx` if it has a `?planId=...` query handling.

- [ ] **Step 1: Drop the plan column from the list**

Read `users-view.tsx`. Remove the column header and cell that renders `user.planId` or a derived plan name.

- [ ] **Step 2: Drop the plan select from create modal**

In the create form: remove the `<select name="planId">` and its surrounding label/hint. The form should now only collect `{ email }`.

- [ ] **Step 3: Drop the plan field from edit modal**

In the edit form: remove the same. The form should collect `{ name?, email?, role? }` only.

- [ ] **Step 4: Drop the plan filter from the page**

If the URL accepts `?planId=...` and forwards it to `adminUserService.list(...)`, remove that branch. The list page no longer filters by plan.

- [ ] **Step 5: Update the actions**

In `actions.ts`, find `createUser` and `updateUser`. Remove every `planId` reference: stop reading it from FormData, stop including it in the payload to `adminUserService`, drop the Zod schema entry.

- [ ] **Step 6: Verify**

```bash
grep -rn 'planId' src/app/\[locale\]/\(authenticated\)/admin/users/   # expect: zero
npx tsc --noEmit 2>&1 | grep 'admin/users' | head                     # expect: zero
```

- [ ] **Step 7: Defer commit**

---

### Task 12 (NM-1.3): Fix `admin/users/[id]` overview tab — fetch plan via subscriptions

**Files:**
- Modify: `src/app/[locale]/(authenticated)/admin/users/[id]/_components/overview-tab.tsx` (or wherever the plan label is rendered).
- Modify: `src/app/[locale]/(authenticated)/admin/users/[id]/page.tsx` (if it pre-fetches plan info from the user).

- [ ] **Step 1: Replace the source of plan info**

Where the current code reads `user.planId` (or a derived `planName`), replace with a call to `adminSubscriptionService.list({ userId, limit: 1 })`. Take the first item's `planName` (display "—" if list is empty or `planName` is `null`).

Server-component pattern (recommended):

```typescript
const subs = await adminSubscriptionService.list({ userId: id, limit: 1 });
const currentPlanName = subs.items[0]?.planName ?? "—";
```

Pass `currentPlanName` as a prop to the overview tab.

- [ ] **Step 2: Verify**

```bash
grep -rn 'planId' src/app/\[locale\]/\(authenticated\)/admin/users/\[id\]/   # expect: zero
npx tsc --noEmit 2>&1 | grep 'admin/users' | head                           # expect: zero
```

- [ ] **Step 3: Defer commit**

---

### Task 13 (NM-1.4): Overhaul `admin/subscriptions` page

**Files:**
- Modify: `src/app/[locale]/(authenticated)/admin/subscriptions/page.tsx`.
- Modify: `src/app/[locale]/(authenticated)/admin/subscriptions/actions.ts`.
- Modify: `src/app/[locale]/(authenticated)/admin/subscriptions/_components/subscriptions-view.tsx` (per HANDOFF — confirm).

This is the largest of the breaking-fix tasks. Decompose:

#### 13.1 — Update the page (server component)

- [ ] **Step 1: Update the page**

`page.tsx` likely passes `subscriptions, users, plans` to a client component. The shape of `subscriptions` changed (new fields, `billingDay` removed, status enum expanded). Update prop types in the client component to use `SubscriptionPublic` from `@/lib/services/index.ts` (which now reflects the new shape).

#### 13.2 — Update the table

- [ ] **Step 2: Replace the columns**

Drop the `billingDay` column.
Add `currentPeriodEnd` column (formatted with `formatDate` helper from `_lib/format.ts`).
Add `asaasSubscriptionId` column (truncate to first 8 chars + tooltip with full id; render "—" when null).
Update the status badge map to cover all 6 enum values (pull labels from `t("admin.subscriptions.statusLabels.{status}")`).

#### 13.3 — Replace the actions

- [ ] **Step 3: Rewrite `actions.ts`**

Replace `createSubscription` with `subscribeUser`:

```typescript
"use server";

import { z } from "zod";
import { revalidatePath, updateTag } from "next/cache";
import { ApiError } from "@/lib/api-envelope";
import { CACHE_TAGS } from "@/lib/cache-config";
import { adminSubscriptionService } from "@/lib/services";
import { captureUnexpected } from "@/lib/observability/capture";
import type {
  SubscriptionPublic,
  SubscriptionStatus,
} from "@/lib/services";

const FRIENDLY_ERRORS: Record<string, string> = {
  SUB_NOT_FOUND_001: "Assinatura não encontrada.",
  SUB_ACTIVE_001: "Este usuário já possui assinatura ativa.",
  SUBSCRIPTION_NOT_ACTIVE_001: "A assinatura precisa estar ativa.",
  INVALID_PLAN_CHANGE_001: "Mudança de plano inválida.",
  PLAN_NOT_FOUND_001: "Plano não encontrado.",
  BILLING_GATEWAY_001: "Falha temporária no gateway. Tente novamente.",
  BILLING_GATEWAY_002: "O gateway rejeitou os dados.",
};

const GENERIC_ERROR =
  "Não foi possível completar a operação. Tente novamente.";

function errorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    return FRIENDLY_ERRORS[err.code] ?? GENERIC_ERROR;
  }
  captureUnexpected(err);
  return GENERIC_ERROR;
}

interface ActionResult<T = undefined> {
  readonly success: boolean;
  readonly error?: string;
  readonly data?: T;
}

const uuid = z.string().uuid("ID inválido.");
const statusSchema = z.enum([
  "active",
  "past_due",
  "suspended",
  "cancelled",
  "ended",
  "refunded",
]);

function invalidate(): void {
  updateTag(CACHE_TAGS.adminSubscriptions);
  revalidatePath("/admin/subscriptions");
}

export async function subscribeUser(
  userId: string,
  planId: string,
): Promise<ActionResult<SubscriptionPublic>> {
  if (!uuid.safeParse(userId).success) {
    return { success: false, error: "ID de usuário inválido." };
  }
  if (!uuid.safeParse(planId).success) {
    return { success: false, error: "ID de plano inválido." };
  }
  try {
    const data = await adminSubscriptionService.subscribe(userId, planId);
    invalidate();
    return { success: true, data };
  } catch (err) {
    return { success: false, error: errorMessage(err) };
  }
}

export async function upgradeUser(
  userId: string,
  planId: string,
): Promise<ActionResult<SubscriptionPublic>> {
  if (!uuid.safeParse(userId).success || !uuid.safeParse(planId).success) {
    return { success: false, error: "ID inválido." };
  }
  try {
    const data = await adminSubscriptionService.upgrade(userId, planId);
    invalidate();
    return { success: true, data };
  } catch (err) {
    return { success: false, error: errorMessage(err) };
  }
}

export async function downgradeUser(
  userId: string,
  planId: string,
): Promise<ActionResult<SubscriptionPublic>> {
  if (!uuid.safeParse(userId).success || !uuid.safeParse(planId).success) {
    return { success: false, error: "ID inválido." };
  }
  try {
    const data = await adminSubscriptionService.downgrade(userId, planId);
    invalidate();
    return { success: true, data };
  } catch (err) {
    return { success: false, error: errorMessage(err) };
  }
}

export async function cancelUser(
  userId: string,
): Promise<ActionResult<SubscriptionPublic>> {
  if (!uuid.safeParse(userId).success) {
    return { success: false, error: "ID de usuário inválido." };
  }
  try {
    const data = await adminSubscriptionService.cancel(userId);
    invalidate();
    return { success: true, data };
  } catch (err) {
    return { success: false, error: errorMessage(err) };
  }
}

export async function forceStatus(
  subscriptionId: string,
  status: SubscriptionStatus,
): Promise<ActionResult<SubscriptionPublic>> {
  if (!uuid.safeParse(subscriptionId).success) {
    return { success: false, error: "ID de assinatura inválido." };
  }
  if (!statusSchema.safeParse(status).success) {
    return { success: false, error: "Status inválido." };
  }
  try {
    const data = await adminSubscriptionService.updateStatus(
      subscriptionId,
      { status },
    );
    invalidate();
    return { success: true, data };
  } catch (err) {
    return { success: false, error: errorMessage(err) };
  }
}
```

Drop any old `createSubscription` / `updateSubscription` exports.

#### 13.4 — Wire new buttons in the table

- [ ] **Step 4: Replace row actions**

Per row:
- "Cancelar" button (calls `cancelUser(sub.userId)`). Disabled when `sub.status` ∈ {cancelled, ended, refunded, suspended}.
- "Forçar status" button → opens a small force-status modal (pick from 6 statuses) that calls `forceStatus(sub.id, status)`.

For users **without** an active subscription (visible elsewhere — e.g. user list), surface an "Assinar" CTA that opens a plans modal and calls `subscribeUser(userId, planId)`. This UX lives in `admin/users` per the brief; in `admin/subscriptions` we just allow lifecycle operations on existing rows.

- [ ] **Step 5: Verify**

```bash
grep -rn 'billingDay\|createSubscription\|updateSubscription' src/app/\[locale\]/\(authenticated\)/admin/subscriptions/   # expect: zero
npx tsc --noEmit 2>&1 | tail -10                                                                                          # expect: zero errors
npm run test:run 2>&1 | tail -3                                                                                           # tests pass
```

- [ ] **Step 6: Defer commit (single MM-1 commit comes next)**

---

### Task 14 (NM-1.5): Bundled MM-1 commit + first push

- [ ] **Step 1: Final type-check + build**

```bash
npx tsc --noEmit                # expect: zero
npm run test:run 2>&1 | tail -3 # expect: same pass count as pre-flight (or higher with new tests)
npm run build 2>&1 | tail -10   # expect: succeeds
```

If anything fails, **fix it first** before committing. Do not push a broken intermediate state.

- [ ] **Step 2: Single commit covering MM-1**

```bash
git add \
  src/app/[locale]/signup/ \
  "src/app/[locale]/(authenticated)/admin/users/" \
  "src/app/[locale]/(authenticated)/admin/subscriptions/"
git commit -m "$(cat <<'EOF'
refactor(admin/signup): align consumers with planId removal + new sub shape

Wires the existing screens to the foundation rewrite from the previous
commits:
- signup form drops the optional plan select.
- admin/users list + create + edit no longer reference planId.
- admin/users/[id] overview reads plan via /admin/subscriptions?userId=.
- admin/subscriptions trades create/update for per-user subscribe /
  upgrade / downgrade / cancel + force-status. Table drops billingDay
  and adds currentPeriodEnd + asaasSubscriptionId columns.
EOF
)"
```

- [ ] **Step 3: First push of the branch**

```bash
git push -u origin feat/billing-asaas
```

> Now the branch is in a green, mergeable state — even though the new `/billing` page doesn't exist yet, nothing else is broken.

---

## MM-2: User-facing `/billing` page

### Task 15 (NM-2.1): Plan options source (with fallback)

**Files:**
- Create: `src/lib/services/plan-options-source.ts`
- Create: `src/lib/services/plan-options-source.test.ts`

**Why:** the brief says `GET /plans/options` does not exist yet (decision 1-A — backend will create it; user authorized "pode seguir"). We implement a graceful fallback: try `/plans/options`, fall back to a hardcoded catalog (with `null` UUIDs that prompt the implementer to fill them when the backend ships the endpoint).

- [ ] **Step 1: Write tests**

`src/lib/services/plan-options-source.test.ts`:

```typescript
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

vi.mock("next/headers", () => ({
  cookies: async () => ({ get: () => ({ value: "fake-jwt" }) }),
}));

vi.mock("@/lib/env", () => ({
  API_URL: "https://api.test",
  IS_PRODUCTION: false,
}));

import { getPlanOptions } from "./plan-options-source";

describe("getPlanOptions", () => {
  let fetchMock: ReturnType<typeof vi.fn>;
  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
  });
  afterEach(() => vi.unstubAllGlobals());

  it("returns the live response when /plans/options succeeds", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          success: true,
          data: [
            { id: "u1", name: "Solo", cost: 697, slug: "solo" },
          ],
          error: null,
          meta: { requestId: "r1" },
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      ),
    );
    const result = await getPlanOptions();
    expect(result).toEqual([
      { id: "u1", name: "Solo", cost: 697, slug: "solo" },
    ]);
  });

  it("falls back to the hardcoded catalog when the endpoint 404s", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          success: false,
          data: null,
          error: { code: "ROUTE_NOT_FOUND_001", message: "" },
          meta: { requestId: "r1" },
        }),
        { status: 404, headers: { "content-type": "application/json" } },
      ),
    );
    const result = await getPlanOptions();
    expect(result.map((p) => p.slug)).toEqual([
      "solo",
      "fundador",
      "essencial",
      "operador",
      "estrategico",
    ]);
    // Each fallback entry has id === null (caller knows it's a stub).
    expect(result.every((p) => p.id === null)).toBe(true);
  });
});
```

- [ ] **Step 2: Run tests; expect both fail**

Run: `npm run test:run -- src/lib/services/plan-options-source.test.ts`
Expected: FAIL with module-not-found.

- [ ] **Step 3: Implement**

`src/lib/services/plan-options-source.ts`:

```typescript
import { authFetch } from "./auth-fetch";
import { ApiError, unwrapEnvelope } from "@/lib/api-envelope";

export type PlanSlug =
  | "solo"
  | "fundador"
  | "essencial"
  | "operador"
  | "estrategico";

export interface PlanOption {
  /** UUID from backend; `null` when serving the local fallback catalog. */
  readonly id: string | null;
  readonly name: string;
  readonly cost: number;
  readonly slug: PlanSlug;
}

/**
 * Hardcoded catalog used when the backend route is missing. Replace `id` once
 * `GET /plans/options` ships (or wire env vars NEXT_PUBLIC_PLAN_<SLUG>_ID and
 * read them here — see brief decision 1-B).
 */
const FALLBACK_CATALOG: readonly PlanOption[] = [
  { id: null, slug: "solo", name: "Solo", cost: 697 },
  { id: null, slug: "fundador", name: "Fundador", cost: 797 },
  { id: null, slug: "essencial", name: "Essencial", cost: 1597 },
  { id: null, slug: "operador", name: "Operador", cost: 2997 },
  { id: null, slug: "estrategico", name: "Estratégico", cost: 4997 },
];

export async function getPlanOptions(): Promise<readonly PlanOption[]> {
  try {
    const response = await authFetch("/plans/options", { cache: "no-store" });
    return await unwrapEnvelope<readonly PlanOption[]>(response);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      return FALLBACK_CATALOG;
    }
    throw err;
  }
}
```

- [ ] **Step 4: Run tests; expect green**

Run: `npm run test:run -- src/lib/services/plan-options-source.test.ts`
Expected: 2 PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/services/plan-options-source.ts \
        src/lib/services/plan-options-source.test.ts
git commit -m "feat(billing): plan-options source with graceful fallback"
```

---

### Task 16 (NM-2.2): Pure helpers — `refund-window.ts`, `plan-change-decision.ts`

**Files:**
- Create: `src/app/[locale]/(authenticated)/billing/_lib/refund-window.ts`
- Create: `src/app/[locale]/(authenticated)/billing/_lib/refund-window.test.ts`
- Create: `src/app/[locale]/(authenticated)/billing/_lib/plan-change-decision.ts`
- Create: `src/app/[locale]/(authenticated)/billing/_lib/plan-change-decision.test.ts`

- [ ] **Step 1: Tests**

`refund-window.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { isWithinRefundWindow } from "./refund-window";

describe("isWithinRefundWindow", () => {
  it("returns true when now is before refundEligibleUntil", () => {
    expect(
      isWithinRefundWindow("2026-05-10T00:00:00Z", new Date("2026-05-09T23:59:00Z")),
    ).toBe(true);
  });
  it("returns true at exact boundary", () => {
    expect(
      isWithinRefundWindow("2026-05-10T00:00:00Z", new Date("2026-05-10T00:00:00Z")),
    ).toBe(true);
  });
  it("returns false after the window closes", () => {
    expect(
      isWithinRefundWindow("2026-05-10T00:00:00Z", new Date("2026-05-10T00:00:01Z")),
    ).toBe(false);
  });
  it("returns false when the input is malformed", () => {
    expect(isWithinRefundWindow("not-a-date", new Date())).toBe(false);
  });
});
```

`plan-change-decision.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { getPlanChangeAction } from "./plan-change-decision";

describe("getPlanChangeAction", () => {
  it("'current' when costs are equal", () => {
    expect(getPlanChangeAction(797, 797)).toBe("current");
  });
  it("'upgrade' when target is more expensive", () => {
    expect(getPlanChangeAction(797, 1597)).toBe("upgrade");
  });
  it("'downgrade' when target is cheaper", () => {
    expect(getPlanChangeAction(1597, 797)).toBe("downgrade");
  });
});
```

- [ ] **Step 2: Run; expect FAIL**

`npm run test:run -- src/app/[locale]/\\(authenticated\\)/billing/_lib/`

- [ ] **Step 3: Implement**

`refund-window.ts`:

```typescript
/**
 * Whether `now` is at or before the refund window deadline. Defensive:
 * malformed dates evaluate to false (closed window).
 */
export function isWithinRefundWindow(
  refundEligibleUntil: string,
  now: Date = new Date(),
): boolean {
  const deadline = new Date(refundEligibleUntil);
  if (Number.isNaN(deadline.getTime())) return false;
  return now.getTime() <= deadline.getTime();
}
```

`plan-change-decision.ts`:

```typescript
export type PlanChangeAction = "current" | "upgrade" | "downgrade";

/**
 * Compare a target plan cost to the current plan cost and pick the right
 * UI action. Equal cost = "current" (button disabled). Higher = "upgrade"
 * (immediate). Lower = "downgrade" (effective at currentPeriodEnd).
 */
export function getPlanChangeAction(
  currentCost: number,
  targetCost: number,
): PlanChangeAction {
  if (currentCost === targetCost) return "current";
  return targetCost > currentCost ? "upgrade" : "downgrade";
}
```

- [ ] **Step 4: Run; expect 7 PASS**

`npm run test:run -- src/app/[locale]/\\(authenticated\\)/billing/_lib/`

- [ ] **Step 5: Commit**

```bash
git add src/app/[locale]/\(authenticated\)/billing/_lib/
git commit -m "feat(billing): pure helpers for refund window + plan change decision"
```

---

### Task 17 (NM-2.3): Server actions for `/billing`

**Files:**
- Create: `src/app/[locale]/(authenticated)/billing/actions.ts`
- Create: `src/app/[locale]/(authenticated)/billing/actions.test.ts`

- [ ] **Step 1: Write tests**

```typescript
import { describe, it, expect, beforeEach, vi } from "vitest";

const subscriptionsServiceMock = {
  subscribe: vi.fn(),
  upgrade: vi.fn(),
  downgrade: vi.fn(),
  cancel: vi.fn(),
  refundRequest: vi.fn(),
};

vi.mock("@/lib/services", () => ({
  subscriptionsService: subscriptionsServiceMock,
}));
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  updateTag: vi.fn(),
}));
vi.mock("@/lib/observability/capture", () => ({
  captureUnexpected: vi.fn(),
}));

import { ApiError } from "@/lib/api-envelope";
import {
  cancelSubscription,
  changePlan,
  requestRefund,
  subscribePlan,
} from "./actions";

function fd(entries: Record<string, string>): FormData {
  const f = new FormData();
  for (const [k, v] of Object.entries(entries)) f.append(k, v);
  return f;
}

describe("billing actions", () => {
  beforeEach(() => {
    Object.values(subscriptionsServiceMock).forEach((m) => m.mockReset());
  });

  it("subscribePlan rejects bad UUID", async () => {
    const res = await subscribePlan("not-uuid");
    expect(res.success).toBe(false);
    expect(subscriptionsServiceMock.subscribe).not.toHaveBeenCalled();
  });

  it("subscribePlan returns asaasInvoiceUrl on success", async () => {
    subscriptionsServiceMock.subscribe.mockResolvedValueOnce({
      subscriptionId: "s1",
      asaasInvoiceUrl: "https://asaas/x",
    });
    const res = await subscribePlan("11111111-1111-1111-1111-111111111111");
    expect(res).toMatchObject({
      success: true,
      data: { asaasInvoiceUrl: "https://asaas/x" },
    });
  });

  it("subscribePlan maps SUB_ACTIVE_001 to friendly Portuguese", async () => {
    subscriptionsServiceMock.subscribe.mockRejectedValueOnce(
      new ApiError("active", "SUB_ACTIVE_001", 409),
    );
    const res = await subscribePlan("11111111-1111-1111-1111-111111111111");
    expect(res).toEqual({
      success: false,
      error: "Você já possui uma assinatura ativa.",
    });
  });

  it("changePlan(upgrade) calls upgrade endpoint", async () => {
    subscriptionsServiceMock.upgrade.mockResolvedValueOnce({ ok: true });
    await changePlan("upgrade", "11111111-1111-1111-1111-111111111111");
    expect(subscriptionsServiceMock.upgrade).toHaveBeenCalledWith(
      "11111111-1111-1111-1111-111111111111",
    );
  });

  it("changePlan(downgrade) calls downgrade endpoint", async () => {
    subscriptionsServiceMock.downgrade.mockResolvedValueOnce({ ok: true });
    await changePlan("downgrade", "11111111-1111-1111-1111-111111111111");
    expect(subscriptionsServiceMock.downgrade).toHaveBeenCalled();
  });

  it("cancelSubscription forwards optional reason", async () => {
    subscriptionsServiceMock.cancel.mockResolvedValueOnce({ ok: true });
    await cancelSubscription(fd({ reason: "teste" }));
    expect(subscriptionsServiceMock.cancel).toHaveBeenCalledWith("teste");
  });

  it("cancelSubscription with empty reason calls without arg", async () => {
    subscriptionsServiceMock.cancel.mockResolvedValueOnce({ ok: true });
    await cancelSubscription(fd({}));
    expect(subscriptionsServiceMock.cancel).toHaveBeenCalledWith(undefined);
  });

  it("requestRefund rejects reason shorter than 10 chars", async () => {
    const res = await requestRefund(fd({ reason: "curto" }));
    expect(res.success).toBe(false);
    expect(subscriptionsServiceMock.refundRequest).not.toHaveBeenCalled();
  });

  it("requestRefund maps REFUND_WINDOW_EXPIRED_001", async () => {
    subscriptionsServiceMock.refundRequest.mockRejectedValueOnce(
      new ApiError("expired", "REFUND_WINDOW_EXPIRED_001", 410),
    );
    const res = await requestRefund(fd({ reason: "motivo bem completo aqui" }));
    expect(res.error).toMatch(/15 dias/);
  });
});
```

- [ ] **Step 2: Run; expect FAIL**

`npm run test:run -- src/app/[locale]/\\(authenticated\\)/billing/actions.test.ts`

- [ ] **Step 3: Implement**

`src/app/[locale]/(authenticated)/billing/actions.ts`:

```typescript
"use server";

import { z } from "zod";
import { revalidatePath, updateTag } from "next/cache";
import { ApiError } from "@/lib/api-envelope";
import { CACHE_TAGS } from "@/lib/cache-config";
import { subscriptionsService } from "@/lib/services";
import { captureUnexpected } from "@/lib/observability/capture";
import type {
  MySubscription,
  SubscribeResponse,
} from "@/lib/services";

const FRIENDLY_ERRORS: Record<string, string> = {
  SUB_NOT_FOUND_001: "Assinatura não encontrada.",
  SUB_ACTIVE_001: "Você já possui uma assinatura ativa.",
  SUBSCRIPTION_NOT_ACTIVE_001:
    "Sua assinatura precisa estar ativa para esta operação.",
  INVALID_PLAN_CHANGE_001: "Mudança de plano inválida para esta operação.",
  PLAN_NOT_FOUND_001: "Plano não encontrado.",
  BILLING_GATEWAY_001:
    "Falha temporária no gateway de cobrança. Tente novamente em instantes.",
  BILLING_GATEWAY_002:
    "O gateway de cobrança rejeitou os dados. Verifique e tente de novo.",
  REFUND_WINDOW_EXPIRED_001:
    "A janela de 15 dias para reembolso já expirou.",
  REFUND_REQUEST_PENDING_001:
    "Você já tem uma solicitação de reembolso em análise.",
};

const GENERIC_ERROR =
  "Não foi possível completar a operação. Tente novamente.";

function errorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    return FRIENDLY_ERRORS[err.code] ?? GENERIC_ERROR;
  }
  captureUnexpected(err);
  return GENERIC_ERROR;
}

interface ActionResult<T = undefined> {
  readonly success: boolean;
  readonly error?: string;
  readonly data?: T;
}

const uuid = z.string().uuid("ID inválido.");

const reasonSchema = z
  .string()
  .min(10, "Motivo precisa ter no mínimo 10 caracteres.")
  .max(2000, "Motivo deve ter no máximo 2000 caracteres.");

const cancelReasonSchema = z
  .string()
  .max(500, "Motivo deve ter no máximo 500 caracteres.")
  .optional();

function invalidate(): void {
  updateTag(CACHE_TAGS.subscriptions);
  revalidatePath("/billing");
}

export async function subscribePlan(
  planId: string,
): Promise<ActionResult<SubscribeResponse>> {
  if (!uuid.safeParse(planId).success) {
    return { success: false, error: "ID de plano inválido." };
  }
  try {
    const data = await subscriptionsService.subscribe(planId);
    invalidate();
    return { success: true, data };
  } catch (err) {
    return { success: false, error: errorMessage(err) };
  }
}

export async function changePlan(
  action: "upgrade" | "downgrade",
  planId: string,
): Promise<ActionResult<MySubscription>> {
  if (!uuid.safeParse(planId).success) {
    return { success: false, error: "ID de plano inválido." };
  }
  try {
    const data =
      action === "upgrade"
        ? await subscriptionsService.upgrade(planId)
        : await subscriptionsService.downgrade(planId);
    invalidate();
    return { success: true, data };
  } catch (err) {
    return { success: false, error: errorMessage(err) };
  }
}

export async function cancelSubscription(
  formData: FormData,
): Promise<ActionResult<MySubscription>> {
  const raw = formData.get("reason");
  const reason =
    typeof raw === "string" && raw.trim() !== "" ? raw.trim() : undefined;
  const parsed = cancelReasonSchema.safeParse(reason);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message };
  }
  try {
    const data = await subscriptionsService.cancel(parsed.data);
    invalidate();
    return { success: true, data };
  } catch (err) {
    return { success: false, error: errorMessage(err) };
  }
}

export async function requestRefund(
  formData: FormData,
): Promise<ActionResult> {
  const raw = formData.get("reason");
  const parsed = reasonSchema.safeParse(typeof raw === "string" ? raw : "");
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message };
  }
  try {
    await subscriptionsService.refundRequest(parsed.data);
    invalidate();
    return { success: true };
  } catch (err) {
    return { success: false, error: errorMessage(err) };
  }
}
```

- [ ] **Step 4: Run; expect green**

`npm run test:run -- src/app/[locale]/\\(authenticated\\)/billing/actions.test.ts`

- [ ] **Step 5: Commit**

```bash
git add src/app/[locale]/\(authenticated\)/billing/actions.ts \
        src/app/[locale]/\(authenticated\)/billing/actions.test.ts
git commit -m "feat(billing): server actions (subscribe/upgrade/downgrade/cancel/refund)"
```

---

### Task 18 (NM-2.4): UI components (status badge, payments table, modals, plan grid, overview)

These are tightly coupled — implement together, single commit.

**Files:**
- Create: `src/app/[locale]/(authenticated)/billing/_components/status-badge.tsx`
- Create: `src/app/[locale]/(authenticated)/billing/_components/payments-table.tsx`
- Create: `src/app/[locale]/(authenticated)/billing/_components/plan-grid.tsx`
- Create: `src/app/[locale]/(authenticated)/billing/_components/change-plan-modal.tsx`
- Create: `src/app/[locale]/(authenticated)/billing/_components/cancel-modal.tsx`
- Create: `src/app/[locale]/(authenticated)/billing/_components/refund-request-modal.tsx`
- Create: `src/app/[locale]/(authenticated)/billing/_components/refund-status-card.tsx`
- Create: `src/app/[locale]/(authenticated)/billing/_components/subscription-overview.tsx`
- Create: `src/app/[locale]/(authenticated)/billing/loading.tsx`
- Create: `src/app/[locale]/(authenticated)/billing/page.tsx`
- Modify: `src/components/sidebar.tsx`

> **Strategy:** these components are JSX-heavy but follow the patterns in `ads/_components/` and `products/_components/`. The plan defines props, state, and key handlers below; the implementer styles using the existing Tailwind class soup found in `ads-table.tsx` / `products-table.tsx` for parity.

- [ ] **Step 1: `status-badge.tsx` — status → color + label**

```typescript
"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import type { SubscriptionStatus } from "@/lib/services";

interface StatusBadgeProps {
  readonly status: SubscriptionStatus;
  readonly currentPeriodEnd?: string;
  readonly refundedAt?: string | null;
}

const COLOR_BY_STATUS: Record<SubscriptionStatus, string> = {
  active: "bg-success/10 text-success",
  past_due: "bg-warning/10 text-warning",
  suspended: "bg-danger/10 text-danger",
  cancelled: "bg-on-surface-variant/10 text-on-surface-variant",
  ended: "bg-on-surface-variant/20 text-on-surface-variant",
  refunded: "bg-purple-500/10 text-purple-500",
};

export function StatusBadge({ status, currentPeriodEnd, refundedAt }: StatusBadgeProps) {
  const t = useTranslations("billing.status");
  const params: Record<string, string> = {};
  if (currentPeriodEnd) params.date = formatDate(currentPeriodEnd);
  if (refundedAt) params.date = formatDate(refundedAt);
  return (
    <span className={cn("inline-flex h-7 items-center rounded-full px-3 text-[13px] font-medium", COLOR_BY_STATUS[status])}>
      {t(status, params)}
    </span>
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric",
  });
}
```

> If `text-success` / `text-warning` Tailwind tokens don't exist yet, replace with concrete color classes (`text-emerald-500`, `text-amber-500`, etc.) — verify in `tailwind.config.*` or `globals.css` first.

- [ ] **Step 2: `payments-table.tsx`**

Props: `{ payments: readonly MyPayment[] }`.
Render a table with columns: due date (formatted pt-BR), amount (`formatBRL`), status (translated badge), paid at (`formatDate` or "—"), action button "Ver fatura" that opens `invoiceUrl` in a new tab — disabled when null.
Empty state: shows `t("billing.payments.empty")`.

Style cribbed from `ads-table.tsx` rows.

- [ ] **Step 3: `plan-grid.tsx`**

Props: `{ plans: readonly PlanOption[]; onSelect: (planId: string) => void; isPending: boolean }`.
Renders 5 cards with name + cost + features (looked up via `t("billing.plans.{slug}.features")`).
Disable the card's CTA when `plan.id === null` (fallback catalog mode — show a tooltip "Aguardando catálogo do servidor"). When `plan.id` is non-null, button calls `onSelect(plan.id)`.

Empty state: never (5 plans hardcoded).

- [ ] **Step 4: `change-plan-modal.tsx`**

Props: `{ currentPlan: SubscriptionPlan; plans: readonly PlanOption[]; onClose; onConfirm: (action: "upgrade"|"downgrade", planId) => void; isPending; currentPeriodEnd: string }`.
Inside, the modal has two phases: (1) plan grid with badges via `getPlanChangeAction`; (2) confirmation with body text from `billing.changePlanModal.confirm{Upgrade,Downgrade}.body`.

- [ ] **Step 5: `cancel-modal.tsx`**

Props: `{ currentPeriodEnd: string; onClose; onSubmit: (formData: FormData) => void; isPending }`.
Form with optional textarea `name="reason"` (max 500). Submit calls onSubmit(formData).

- [ ] **Step 6: `refund-request-modal.tsx`**

Props: `{ onClose; onSubmit; isPending }`. Form with required textarea `name="reason"` (10–2000 chars). On submit pass formData to onSubmit (which calls `requestRefund(formData)` from actions).

- [ ] **Step 7: `refund-status-card.tsx`**

Local state — appears after the user submits a refund. Props: `{ status: "pending"|"approved"|"rejected"; reason?: string }`. Renders the corresponding `billing.refundStatus.*` copy. Persistence: parent component holds the state in `useState`, flips to "approved" when WS `subscription.refunded` arrives (handled in MM-3).

- [ ] **Step 8: `subscription-overview.tsx` (orchestrator client component)**

Props:

```typescript
interface SubscriptionOverviewProps {
  readonly subscription: MySubscription;
  readonly payments: readonly MyPayment[];
  readonly plans: readonly PlanOption[];
}
```

Uses `useState` for: open modal (`null | "change" | "cancel" | "refund"`), refund status (`null | "pending" | "approved" | "rejected"`).

Renders:
1. Header card: plan name + cost + `StatusBadge` + next-payment text.
2. PendingChangeBanner (`subscription.pendingChange !== null`).
3. CancelAtPeriodEndBanner (`subscription.cancelAtPeriodEnd === true`).
4. RefundEligibleBanner (`isWithinRefundWindow(subscription.refundEligibleUntil)`).
5. `<PaymentsTable>`.
6. Action buttons: "Mudar plano" (opens change modal), "Cancelar assinatura" (opens cancel modal — disabled per status).
7. Modals.
8. `<RefundStatusCard>` if `refundStatus !== null`.

The action buttons wire up to the server actions via `useTransition` + `router.refresh()` on success (same pattern as ads-table.tsx).

- [ ] **Step 9: `loading.tsx`**

```typescript
export default function BillingLoading() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="skeleton h-9 w-40 rounded-lg" />
      <div className="skeleton h-32 w-full rounded-xl" />
      <div className="skeleton h-64 w-full rounded-xl" />
    </div>
  );
}
```

- [ ] **Step 10: `page.tsx` (server component)**

```typescript
import { getTranslations } from "next-intl/server";
import { ApiError } from "@/lib/api-envelope";
import { captureUnexpected } from "@/lib/observability/capture";
import { subscriptionsService } from "@/lib/services";
import { getPlanOptions } from "@/lib/services/plan-options-source";
import { PlanGrid } from "./_components/plan-grid";
import { SubscriptionOverview } from "./_components/subscription-overview";

/**
 * /billing — server component branching on whether the caller has a sub.
 *  - 404 from /subscriptions/me  → render <PlanGrid> (Caso A).
 *  - 200                         → render <SubscriptionOverview> (Caso B).
 *  - any other failure           → render the loadFailed message.
 */
export default async function BillingPage() {
  const t = await getTranslations("billing");

  let subscription: Awaited<ReturnType<typeof subscriptionsService.getMe>> | null = null;
  try {
    subscription = await subscriptionsService.getMe();
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      // Caso A — render plan grid
    } else {
      captureUnexpected(err);
      return (
        <div className="flex min-h-[400px] items-center justify-center">
          <p className="text-sm text-on-surface-variant">{t("loadFailed")}</p>
        </div>
      );
    }
  }

  if (!subscription) {
    const plans = await getPlanOptions();
    return (
      <div className="mx-auto max-w-5xl">
        <PlanGrid plans={plans} />
      </div>
    );
  }

  // Caso B — load payments concurrently with the plan catalog (used by change modal).
  const [paymentsResult, plansResult] = await Promise.allSettled([
    subscriptionsService.listMyPayments(),
    getPlanOptions(),
  ]);

  const payments =
    paymentsResult.status === "fulfilled" ? paymentsResult.value : [];
  const plans =
    plansResult.status === "fulfilled" ? plansResult.value : [];
  if (paymentsResult.status === "rejected") {
    captureUnexpected(paymentsResult.reason);
  }
  if (plansResult.status === "rejected") {
    captureUnexpected(plansResult.reason);
  }

  return (
    <div className="mx-auto max-w-5xl">
      <SubscriptionOverview
        plans={plans}
        payments={payments}
        subscription={subscription}
      />
    </div>
  );
}
```

- [ ] **Step 11: Sidebar entry**

In `src/components/sidebar.tsx`:

Import `CreditCard` from `lucide-react`.
Add to `USER_NAV` between `products` and `ads`:

```typescript
{ key: "billing", href: "/billing", icon: CreditCard, labelKey: "sidebar.billing" },
```

- [ ] **Step 12: Type-check + build**

```bash
npx tsc --noEmit
npm run build 2>&1 | tail -10   # /billing must appear in the route table
```

- [ ] **Step 13: Commit**

```bash
git add \
  src/app/[locale]/\(authenticated\)/billing/ \
  src/components/sidebar.tsx
git commit -m "feat(billing): /billing page with plan grid + overview + modals"
```

- [ ] **Step 14: Push**

```bash
git push
```

> **End of MM-2.** `/billing` works end-to-end against the backend except for the suspended-banner integration (next MM).

---

## MM-3: WebSocket refactor + global suspended banner

### Task 19 (NM-3.1): Refactor `WsManager` for generic handler map

**Files:**
- Modify: `src/lib/ws-manager.ts`
- Modify: `src/app/[locale]/(authenticated)/conversations/_components/message-thread.tsx`

**⚠️ Existing-tests-pass-first check:**

```bash
npm run test:run 2>&1 | tail -3   # record pass count
```

- [ ] **Step 1: Refactor the manager**

Replace the body of `src/lib/ws-manager.ts` with a generic-handler design. Keep the connect/reconnect lifecycle. Replace `onMessage` and `extractChatMessage` with a `register(type, handler)` API. Strip the chat-specific code; chat consumers re-register their handler at construction time.

```typescript
import { counter } from "./observability/sentry-metrics";

export type WsState =
  | "connecting"
  | "connected"
  | "disconnected"
  | "reconnecting";

type EventHandler = (payload: Record<string, unknown>) => void;
type StateChangeHandler = (state: WsState) => void;

interface WsManagerOptions {
  readonly url: string;
  readonly token: string;
  readonly onStateChange?: StateChangeHandler;
}

const MAX_RECONNECT_DELAY_MS = 30_000;
const INITIAL_RECONNECT_DELAY_MS = 1_000;

/**
 * Generic WebSocket manager. Consumers `register(type, handler)` after
 * construction (and `unregister` on cleanup). Incoming messages with shape
 * `{ type: string, ... }` are routed to the registered handler; unknown types
 * are ignored. Messages without a string `type` field are dropped.
 */
export class WsManager {
  private ws: WebSocket | null = null;
  private currentState: WsState = "disconnected";
  private reconnectAttempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private intentionalClose = false;
  private readonly handlers = new Map<string, EventHandler>();

  private readonly url: string;
  private readonly token: string;
  private readonly onStateChange: StateChangeHandler | undefined;

  constructor(options: WsManagerOptions) {
    this.url = options.url;
    this.token = options.token;
    this.onStateChange = options.onStateChange;
  }

  get state(): WsState {
    return this.currentState;
  }

  register(type: string, handler: EventHandler): void {
    this.handlers.set(type, handler);
  }

  unregister(type: string): void {
    this.handlers.delete(type);
  }

  connect(): void {
    if (this.ws && this.currentState !== "disconnected") return;

    this.intentionalClose = false;
    this.setState("connecting");

    const separator = this.url.includes("?") ? "&" : "?";
    const wsUrl = `${this.url}${separator}token=${encodeURIComponent(this.token)}`;
    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      this.reconnectAttempts = 0;
      this.setState("connected");
    };

    this.ws.onmessage = (event: MessageEvent) => {
      try {
        const payload = JSON.parse(String(event.data)) as unknown;
        if (!payload || typeof payload !== "object") return;
        const envelope = payload as Record<string, unknown>;
        const type = envelope.type;
        if (typeof type !== "string") return;
        const handler = this.handlers.get(type);
        if (handler) handler(envelope);
      } catch {
        // ping/pong frames or malformed JSON
      }
    };

    this.ws.onclose = () => {
      this.ws = null;
      if (this.intentionalClose) {
        this.setState("disconnected");
        return;
      }
      this.scheduleReconnect();
    };

    this.ws.onerror = () => {};
  }

  disconnect(): void {
    this.intentionalClose = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.reconnectAttempts = 0;
    this.setState("disconnected");
  }

  send(data: string): void {
    if (!this.ws || this.currentState !== "connected") {
      throw new Error("WebSocket is not connected");
    }
    this.ws.send(data);
  }

  private setState(newState: WsState): void {
    if (this.currentState === newState) return;
    this.currentState = newState;
    counter("chat.ws_state_change", 1, { attributes: { state: newState } });
    this.onStateChange?.(newState);
  }

  private scheduleReconnect(): void {
    this.setState("reconnecting");
    const delay = Math.min(
      INITIAL_RECONNECT_DELAY_MS * Math.pow(2, this.reconnectAttempts),
      MAX_RECONNECT_DELAY_MS,
    );
    this.reconnectAttempts++;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, delay);
  }
}
```

- [ ] **Step 2: Migrate `message-thread.tsx` to the new API**

Read `src/app/[locale]/(authenticated)/conversations/_components/message-thread.tsx`. Find where `new WsManager({ ..., onMessage })` is constructed. Replace with:

```typescript
const manager = new WsManager({ url, token, onStateChange });
manager.register("new_message", (envelope) => {
  // Re-implement the chat extraction inline here. Pseudocode:
  const chatId = typeof envelope.chatId === "string"
    ? envelope.chatId
    : (typeof (envelope.message as Record<string, unknown> | undefined)?.chatId === "string"
        ? (envelope.message as Record<string, unknown>).chatId as string
        : null);
  if (!chatId) return;
  const msg = envelope.message as Record<string, unknown> | undefined;
  if (!msg || typeof msg.sender !== "string" || typeof msg.content !== "string") return;
  const chatMessage: ChatMessage = {
    id: typeof msg.id === "string" ? msg.id : crypto.randomUUID(),
    chatId,
    sender: msg.sender,
    content: msg.content,
    createdAt: typeof msg.createdAt === "string" ? msg.createdAt : new Date().toISOString(),
    deletedAt: (msg.deletedAt as string | null | undefined) ?? null,
  };
  // existing onMessage callback that updated the thread:
  appendMessage(chatMessage);
});
manager.connect();
```

The exact lines depend on the existing component shape — read it before editing. The `extractChatMessage` logic from the old `ws-manager.ts` (lines 32-66) is the source of truth — preserve every defensive check.

- [ ] **Step 3: Run conversations tests + tsc**

```bash
npm run test:run 2>&1 | tail -3   # match pre-flight count
npx tsc --noEmit
```

If any test breaks, fix the migration before moving on.

- [ ] **Step 4: Commit**

```bash
git add src/lib/ws-manager.ts \
        src/app/[locale]/\(authenticated\)/conversations/_components/message-thread.tsx
git commit -m "refactor(ws): generic event handler map (chat consumer migrated)"
```

---

### Task 20 (NM-3.2): Suspended banner store + 402 interceptor

**Files:**
- Create: `src/lib/subscription-banner-store.ts`
- Create: `src/lib/subscription-banner-store.test.ts`
- Modify: `src/lib/services/auth-fetch.ts`

- [ ] **Step 1: Tests**

```typescript
import { describe, it, expect, beforeEach } from "vitest";
import {
  getSuspended,
  setSuspended,
  subscribe,
} from "./subscription-banner-store";

describe("subscription-banner-store", () => {
  beforeEach(() => setSuspended(false));

  it("starts cleared", () => {
    expect(getSuspended()).toBe(false);
  });

  it("setSuspended(true) flips and notifies subscribers", () => {
    let calls = 0;
    const unsub = subscribe(() => { calls++; });
    setSuspended(true);
    expect(getSuspended()).toBe(true);
    expect(calls).toBe(1);
    unsub();
  });

  it("setSuspended is idempotent (no notify on equal state)", () => {
    let calls = 0;
    setSuspended(true);
    const unsub = subscribe(() => { calls++; });
    setSuspended(true);
    expect(calls).toBe(0);
    unsub();
  });
});
```

- [ ] **Step 2: Run; FAIL**

`npm run test:run -- src/lib/subscription-banner-store.test.ts`

- [ ] **Step 3: Implement**

```typescript
// src/lib/subscription-banner-store.ts

type Listener = (suspended: boolean) => void;

let suspended = false;
const listeners = new Set<Listener>();

export function getSuspended(): boolean {
  return suspended;
}

export function setSuspended(next: boolean): void {
  if (suspended === next) return;
  suspended = next;
  for (const listener of listeners) listener(next);
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
```

- [ ] **Step 4: Wire 402 interceptor in `auth-fetch.ts`**

Find the response handling. Right before returning the response (or in the wrapper around `unwrapEnvelope` callers), check:

```typescript
if (response.status === 402) {
  // Try to parse SUBSCRIPTION_INACTIVE_001 from the envelope before bubbling up.
  // Clone so callers can still read the body.
  try {
    const cloned = response.clone();
    const envelope = await cloned.json() as { error?: { code?: string } } | null;
    if (envelope?.error?.code === "SUBSCRIPTION_INACTIVE_001") {
      setSuspended(true);
    }
  } catch {
    // Body wasn't JSON — leave the banner alone.
  }
}
```

Place this check **after** the existing 401 handling so refresh logic isn't disturbed. Add `import { setSuspended } from "@/lib/subscription-banner-store";` at the top.

- [ ] **Step 5: Run all tests**

```bash
npm run test:run 2>&1 | tail -3   # at least the new ones pass; nothing existing breaks
npx tsc --noEmit
```

- [ ] **Step 6: Commit**

```bash
git add src/lib/subscription-banner-store.ts \
        src/lib/subscription-banner-store.test.ts \
        src/lib/services/auth-fetch.ts
git commit -m "feat(billing): suspended banner store + 402 interceptor"
```

---

### Task 21 (NM-3.3): Subscription events provider + global banner mount

**Files:**
- Create: `src/components/subscription-events-provider.tsx`
- Create: `src/components/global-suspended-banner.tsx`
- Modify: `src/app/[locale]/(authenticated)/layout.tsx`

- [ ] **Step 1: `subscription-events-provider.tsx` (client component)**

```typescript
"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { WsManager } from "@/lib/ws-manager";
import { setSuspended } from "@/lib/subscription-banner-store";

interface SubscriptionEventsProviderProps {
  readonly wsUrl: string;
  readonly token: string;
}

const SUBSCRIPTION_EVENTS = [
  "subscription.payment_confirmed",
  "subscription.past_due",
  "subscription.suspended",
  "subscription.refunded",
  "subscription.activated",
] as const;

/**
 * Mounted once in the authenticated layout. Opens a WsManager for the
 * subscription.* event channel; toasts + flips global suspended state +
 * triggers `router.refresh()` when the current page is /billing so the
 * server component re-fetches /me and /me/payments.
 */
export function SubscriptionEventsProvider({
  wsUrl,
  token,
}: SubscriptionEventsProviderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations("billing.toasts");

  useEffect(() => {
    const isOnBilling = pathname.endsWith("/billing");

    const manager = new WsManager({ url: wsUrl, token });

    const refreshIfBilling = () => {
      if (isOnBilling) router.refresh();
    };

    manager.register("subscription.payment_confirmed", () => {
      toast.success(t("wsPaymentConfirmed"));
      refreshIfBilling();
    });
    manager.register("subscription.past_due", () => {
      toast.warning(t("wsPastDue"));
    });
    manager.register("subscription.suspended", () => {
      toast.error(t("wsSuspended"));
      setSuspended(true);
      refreshIfBilling();
    });
    manager.register("subscription.refunded", () => {
      toast.success(t("wsRefunded"));
      refreshIfBilling();
    });
    manager.register("subscription.activated", () => {
      toast.success(t("wsActivated"));
      setSuspended(false);
      refreshIfBilling();
    });

    manager.connect();
    return () => {
      for (const ev of SUBSCRIPTION_EVENTS) manager.unregister(ev);
      manager.disconnect();
    };
  }, [wsUrl, token, router, pathname, t]);

  return null;
}
```

- [ ] **Step 2: `global-suspended-banner.tsx`**

```typescript
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { AlertTriangle } from "lucide-react";
import {
  getSuspended,
  subscribe,
} from "@/lib/subscription-banner-store";
import { subscriptionsService } from "@/lib/services";

export function GlobalSuspendedBanner() {
  const t = useTranslations("billing.globalSuspended");
  const [suspended, setLocal] = useState<boolean>(getSuspended());

  useEffect(() => subscribe(setLocal), []);

  if (!suspended) return null;

  async function payNow() {
    try {
      const payments = await subscriptionsService.listMyPayments();
      const overdue = payments.find((p) => p.status === "overdue");
      if (overdue?.invoiceUrl) {
        window.open(overdue.invoiceUrl, "_blank", "noopener,noreferrer");
      }
    } catch {
      // fall through — user can navigate to /billing manually
    }
  }

  return (
    <div className="sticky top-0 z-40 border-b border-danger/30 bg-danger/10 px-6 py-3">
      <div className="mx-auto flex max-w-7xl items-center gap-4">
        <AlertTriangle className="h-5 w-5 shrink-0 text-danger" />
        <div className="flex-1">
          <p className="text-sm font-bold text-danger">{t("title")}</p>
          <p className="text-[13px] text-on-surface">{t("body")}</p>
        </div>
        <button
          className="h-9 rounded-xl bg-danger px-4 text-sm font-bold text-on-primary transition-opacity hover:opacity-90"
          onClick={payNow}
          type="button"
        >
          {t("payNow")}
        </button>
        <Link
          className="h-9 rounded-xl border border-danger/40 px-4 text-sm font-medium text-danger transition-colors hover:bg-danger/10 inline-flex items-center"
          href="/billing"
        >
          {t("goToBilling")}
        </Link>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Mount in the authenticated layout**

Update `src/app/[locale]/(authenticated)/layout.tsx`. After the `redirect("/login")` guard:

- Read the access token from cookies (server-side) and pass to `<SubscriptionEventsProvider>` along with the WS URL.
- Add `<GlobalSuspendedBanner />` and `<SubscriptionEventsProvider />` at the top of `<main>`.

```typescript
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { authService } from "@/lib/services/auth-service";
import { businessProfileService } from "@/lib/services";
import { Sidebar } from "@/components/sidebar";
import { CommandPalette } from "@/components/command-palette";
import { GlobalSuspendedBanner } from "@/components/global-suspended-banner";
import { SubscriptionEventsProvider } from "@/components/subscription-events-provider";
import { WS_URL } from "@/lib/env";
import type { ReactNode } from "react";
import type { WorkType } from "@/lib/services";

export default async function AuthenticatedLayout({
  children,
}: {
  readonly children: ReactNode;
}) {
  const user = await authService.getSession();
  if (!user) redirect("/login");

  let workType: WorkType | null = null;
  try {
    const profileView = await businessProfileService.getProfile();
    workType = profileView.profile?.workType ?? null;
  } catch {
    workType = null;
  }

  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value ?? "";

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar user={user} workType={workType} />
      <main className="flex-1 overflow-y-auto">
        <GlobalSuspendedBanner />
        <SubscriptionEventsProvider token={token} wsUrl={WS_URL} />
        <div className="p-6 pt-16 lg:p-8">{children}</div>
      </main>
      <CommandPalette />
    </div>
  );
}
```

> **Verify `WS_URL`** exists in `src/lib/env.ts`. If not, add `WS_URL: z.string().url()` to the env schema (with sane default) and read from `NEXT_PUBLIC_WS_URL`. If the project already uses a different pattern, follow it instead.

- [ ] **Step 4: Type-check + build**

```bash
npx tsc --noEmit
npm run build 2>&1 | tail -10
```

- [ ] **Step 5: Initial banner state from /me on /billing**

In `subscription-overview.tsx`, on mount, if `subscription.status === "suspended"`, call `setSuspended(true)`. Conversely if status is anything else, call `setSuspended(false)`. This reconciles the banner with the page's data on first paint.

```typescript
// inside SubscriptionOverview
useEffect(() => {
  setSuspended(subscription.status === "suspended");
}, [subscription.status]);
```

- [ ] **Step 6: Commit**

```bash
git add \
  src/components/subscription-events-provider.tsx \
  src/components/global-suspended-banner.tsx \
  src/app/[locale]/\(authenticated\)/layout.tsx \
  src/app/[locale]/\(authenticated\)/billing/_components/subscription-overview.tsx
git commit -m "feat(billing): WS subscription events + global suspended banner"
```

- [ ] **Step 7: Push**

```bash
git push
```

> **End of MM-3.** WS events route correctly, banner is wired to both `/me` status and 402 responses.

---

## MM-4: `/admin/refunds` panel

### Task 22 (NM-4.1): Server actions for admin refunds

**Files:**
- Create: `src/app/[locale]/(authenticated)/admin/refunds/actions.ts`
- Create: `src/app/[locale]/(authenticated)/admin/refunds/actions.test.ts`

- [ ] **Step 1: Tests**

```typescript
import { describe, it, expect, beforeEach, vi } from "vitest";

const adminRefundsServiceMock = {
  approve: vi.fn(),
  reject: vi.fn(),
};

vi.mock("@/lib/services", () => ({
  adminRefundsService: adminRefundsServiceMock,
}));
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  updateTag: vi.fn(),
}));
vi.mock("@/lib/observability/capture", () => ({
  captureUnexpected: vi.fn(),
}));

import { ApiError } from "@/lib/api-envelope";
import { approveRefund, rejectRefund } from "./actions";

function fd(entries: Record<string, string>): FormData {
  const f = new FormData();
  for (const [k, v] of Object.entries(entries)) f.append(k, v);
  return f;
}

describe("admin refunds actions", () => {
  beforeEach(() => {
    Object.values(adminRefundsServiceMock).forEach((m) => m.mockReset());
  });

  it("approveRefund forwards optional notes", async () => {
    adminRefundsServiceMock.approve.mockResolvedValueOnce({});
    await approveRefund(
      "11111111-1111-1111-1111-111111111111",
      fd({ notes: "ok" }),
    );
    expect(adminRefundsServiceMock.approve).toHaveBeenCalledWith(
      "11111111-1111-1111-1111-111111111111",
      "ok",
    );
  });

  it("rejectRefund rejects empty notes", async () => {
    const res = await rejectRefund(
      "11111111-1111-1111-1111-111111111111",
      fd({ notes: "" }),
    );
    expect(res.success).toBe(false);
    expect(adminRefundsServiceMock.reject).not.toHaveBeenCalled();
  });

  it("approve maps REFUND_REQUEST_PENDING_001 to friendly message", async () => {
    adminRefundsServiceMock.approve.mockRejectedValueOnce(
      new ApiError("p", "REFUND_REQUEST_PENDING_001", 409),
    );
    const res = await approveRefund(
      "11111111-1111-1111-1111-111111111111",
      fd({}),
    );
    expect(res.error).toMatch(/pendente/);
  });
});
```

- [ ] **Step 2: Run; expect FAIL**

- [ ] **Step 3: Implement**

```typescript
"use server";

import { z } from "zod";
import { revalidatePath, updateTag } from "next/cache";
import { ApiError } from "@/lib/api-envelope";
import { CACHE_TAGS } from "@/lib/cache-config";
import { adminRefundsService } from "@/lib/services";
import { captureUnexpected } from "@/lib/observability/capture";

const FRIENDLY_ERRORS: Record<string, string> = {
  REFUND_REQUEST_NOT_FOUND_001: "Solicitação não encontrada.",
  REFUND_REQUEST_PENDING_001: "Esta solicitação já não está pendente.",
  BILLING_GATEWAY_001: "Falha temporária no Asaas. Tente novamente.",
  BILLING_GATEWAY_002: "O Asaas rejeitou o estorno.",
  GENERAL_VALIDATION_001:
    "Não há pagamento confirmado para estornar.",
};

const GENERIC_ERROR =
  "Não foi possível completar a operação. Tente novamente.";

function errorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    return FRIENDLY_ERRORS[err.code] ?? GENERIC_ERROR;
  }
  captureUnexpected(err);
  return GENERIC_ERROR;
}

interface ActionResult { readonly success: boolean; readonly error?: string; }

const uuid = z.string().uuid("ID inválido.");
const optionalNotes = z.string().max(2000, "Máximo 2000 caracteres.").optional();
const requiredNotes = z.string().min(1, "Motivo obrigatório.").max(2000);

function invalidate(): void {
  updateTag(CACHE_TAGS.refunds);
  revalidatePath("/admin/refunds");
}

export async function approveRefund(
  id: string,
  formData: FormData,
): Promise<ActionResult> {
  if (!uuid.safeParse(id).success) {
    return { success: false, error: "ID de solicitação inválido." };
  }
  const raw = formData.get("notes");
  const notes = typeof raw === "string" && raw.trim() !== "" ? raw.trim() : undefined;
  const parsed = optionalNotes.safeParse(notes);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message };
  }
  try {
    await adminRefundsService.approve(id, parsed.data);
    invalidate();
    return { success: true };
  } catch (err) {
    return { success: false, error: errorMessage(err) };
  }
}

export async function rejectRefund(
  id: string,
  formData: FormData,
): Promise<ActionResult> {
  if (!uuid.safeParse(id).success) {
    return { success: false, error: "ID de solicitação inválido." };
  }
  const raw = formData.get("notes");
  const parsed = requiredNotes.safeParse(typeof raw === "string" ? raw.trim() : "");
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message };
  }
  try {
    await adminRefundsService.reject(id, parsed.data);
    invalidate();
    return { success: true };
  } catch (err) {
    return { success: false, error: errorMessage(err) };
  }
}
```

- [ ] **Step 4: Run; expect green**

- [ ] **Step 5: Commit**

```bash
git add src/app/[locale]/\(authenticated\)/admin/refunds/actions.ts \
        src/app/[locale]/\(authenticated\)/admin/refunds/actions.test.ts
git commit -m "feat(admin/refunds): server actions for approve/reject"
```

---

### Task 23 (NM-4.2): Refunds page + table + modals

**Files:**
- Create: `src/app/[locale]/(authenticated)/admin/refunds/page.tsx`
- Create: `src/app/[locale]/(authenticated)/admin/refunds/loading.tsx`
- Create: `src/app/[locale]/(authenticated)/admin/refunds/_components/refunds-table.tsx`
- Create: `src/app/[locale]/(authenticated)/admin/refunds/_components/approve-refund-modal.tsx`
- Create: `src/app/[locale]/(authenticated)/admin/refunds/_components/reject-refund-modal.tsx`
- Modify: `src/components/sidebar.tsx`

- [ ] **Step 1: Page (server component)**

```typescript
import { getTranslations } from "next-intl/server";
import { captureUnexpected } from "@/lib/observability/capture";
import { adminRefundsService } from "@/lib/services";
import type { RefundRequestPublic, RefundRequestStatus } from "@/lib/services";
import { RefundsTable } from "./_components/refunds-table";

interface RefundsPageProps {
  readonly searchParams: Promise<{ status?: RefundRequestStatus }>;
}

export default async function RefundsPage({ searchParams }: RefundsPageProps) {
  const params = await searchParams;
  const status: RefundRequestStatus = params.status ?? "pending";
  const t = await getTranslations("admin.refunds");

  let items: readonly RefundRequestPublic[] = [];
  try {
    items = await adminRefundsService.list({ status });
  } catch (err) {
    captureUnexpected(err);
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-sm text-on-surface-variant">{t("loadFailed")}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl">
      <RefundsTable currentFilter={status} requests={items} />
    </div>
  );
}
```

- [ ] **Step 2: Loading**

Reuse the skeleton pattern from `ads/loading.tsx` (header skeleton + 5 row skeletons).

- [ ] **Step 3: `refunds-table.tsx` (client component)**

Props: `{ requests: readonly RefundRequestPublic[]; currentFilter: RefundRequestStatus }`.

State: `selectedForApprove: RefundRequestPublic | null`, `selectedForReject: RefundRequestPublic | null`, `useTransition`.

Renders:
1. Header with title + subtitle + filter pills (3 status tabs — clicking pushes `?status=...` via router).
2. Empty state when `requests.length === 0` (`t("admin.refunds.empty")`).
3. Table:
   - Columns: user (name + email), reason (truncated to 100 chars + tooltip), `createdAt` (formatted), status badge, actions.
   - For pending rows: "Aprovar" button → opens approve modal; "Rejeitar" → opens reject modal.
   - For non-pending: status badge + tooltip with `reviewerNotes` and `reviewedAt`.

Handlers:
- `handleApprove(formData)` — calls `approveRefund(selected.id, formData)` from actions; on success: close modal, `router.refresh()`, toast `t("admin.refunds.toasts.approved")`.
- `handleReject(formData)` — analogous with `rejectRefund(...)`.

- [ ] **Step 4: `approve-refund-modal.tsx`**

Form with optional `<textarea name="notes" maxLength={2000}>`. On submit, calls `props.onSubmit(formData)`.

- [ ] **Step 5: `reject-refund-modal.tsx`**

Form with required `<textarea name="notes" minLength={1} maxLength={2000} required>`. On submit, calls `props.onSubmit(formData)`.

- [ ] **Step 6: Sidebar entry**

In `src/components/sidebar.tsx`:
- `Receipt` is already imported (used elsewhere). If not, add to lucide-react import.
- In `ADMIN_NAV`, add between invoices and avatars:

```typescript
{ key: "admin-refunds", href: "/admin/refunds", icon: Receipt, labelKey: "sidebar.admin.refunds" },
```

> Note: `Receipt` is also the invoice icon. If a different icon reads more clearly, pick `RotateCcw` or `Undo2` (both are in lucide-react and connote "undo/refund").

- [ ] **Step 7: Type-check + build**

```bash
npx tsc --noEmit
npm run build 2>&1 | tail -10   # /admin/refunds in route table
```

- [ ] **Step 8: Commit**

```bash
git add \
  src/app/[locale]/\(authenticated\)/admin/refunds/ \
  src/components/sidebar.tsx
git commit -m "feat(admin/refunds): refunds list + approve modal + reject modal"
```

- [ ] **Step 9: Push**

```bash
git push
```

> **End of MM-4.** Admin can approve/reject refunds.

---

## MM-5: Smoke + integration + handoff

### Task 24 (NM-5.1): Run full regression suite

- [ ] **Step 1: All Vitest tests**

```bash
npm run test:run 2>&1 | tail -5
```

Expected: every previously-green test still passes. Compare pass count to the pre-flight number recorded earlier; new tests should add to that count, not subtract.

- [ ] **Step 2: Build**

```bash
npm run build 2>&1 | tail -15
```

Expected: succeeds. Routes added: `/[locale]/billing`, `/[locale]/admin/refunds`. Routes preserved: every previous one.

- [ ] **Step 3: Smoke probe against the real backend**

```bash
TOKEN=$(curl -s -X POST https://backend.olympus.athenio.ai/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@athenio.ai","password":"<senha>"}' | jq -r '.data.accessToken')

# These should respond 200, 404 (acceptable for /me), or 200 with empty list.
for ep in \
  "/subscriptions/me" \
  "/subscriptions/me/payments" \
  "/admin/refunds" \
  "/admin/subscriptions" \
  "/plans/options"
do
  status=$(curl -s -o /tmp/x -w '%{http_code}' \
    -H "Authorization: Bearer $TOKEN" \
    "https://backend.olympus.athenio.ai${ep}")
  echo "$ep -> $status"
done
```

Acceptable outcomes:
- `/subscriptions/me` → 200 or 404
- `/subscriptions/me/payments` → 200 (empty array OK)
- `/admin/refunds` → 200 (empty OK)
- `/admin/subscriptions` → 200
- `/plans/options` → 200 OR 404 (front falls back to local catalog)

If any other status: pause and investigate.

- [ ] **Step 4: WS probe**

```bash
node -e "
const WebSocket = require('ws');
const ws = new WebSocket('wss://backend.olympus.athenio.ai/ws?token=$TOKEN');
ws.on('open', () => { console.log('WS open'); setTimeout(() => ws.close(), 2000); });
ws.on('error', (e) => console.error('WS error:', e.message));
ws.on('close', () => console.log('WS closed'));
"
```

Expected: open + close cleanly. No early reconnect storms.

---

### Task 25 (NM-5.2): Manual QA against production (10 scenarios from brief)

> The user (Lucas) runs these in the browser. Mark each green/red below.

- [ ] Scenario 1: Tenant new → `/billing` → grid → Assinar Fundador → Asaas opens → sandbox-pay → reload → status = active.
- [ ] Scenario 2: Tenant active → payments table renders with working "Ver fatura" link.
- [ ] Scenario 3: Tenant active → upgrade to Essencial → 200 + UI updates.
- [ ] Scenario 4: Tenant active → downgrade to Solo → pendingChange banner appears with correct date.
- [ ] Scenario 5: Tenant active → cancel with reason "teste" → cancelAtPeriodEnd banner; cancel button disabled.
- [ ] Scenario 6: Tenant active within 15 days → request refund → "em análise" card; button disabled.
- [ ] Scenario 7: Force tenant → suspended (admin: PATCH /admin/subscriptions/:id { status: 'suspended' }) → reload → global banner; create-anything → 402 → banner reappears.
- [ ] Scenario 8: Force tenant → active → banner disappears via WS without reload.
- [ ] Scenario 9: Admin /admin/refunds → list pendentes → approve → tenant receives `subscription.refunded` WS in real time (2-tab test).
- [ ] Scenario 10: Public signup → form has no plan field → after onboarding, redirect to /billing.

---

### Task 26 (NM-5.3): Update HANDOFF.md and merge

- [ ] **Step 1: Append a "Recent Work — Billing UI + Asaas (2026-04-26)" section to HANDOFF.md**

Document:
- Branch: `feat/billing-asaas` (squash-merging on completion).
- Commits: list the SHAs.
- Routes added: `/billing`, `/admin/refunds`.
- Sidebar items: `billing`, `admin.refunds`.
- WsManager refactor: chat consumer migrated; new generic register API.
- Banner store: 402 + WS suspend/activate sources.
- BREAKING: `planId` removed from signup, admin/users, admin/subscriptions; `SubscriptionStatus` expanded to 6 values; `SubscriptionPublic` reshaped.
- Plan options fallback: hardcoded catalog with `id: null` until backend ships `GET /plans/options`. Tracked as follow-up — replace fallback once endpoint lands.
- Manual QA: list of scenarios 1-10 with results.
- Tech debt:
  - Plan UUIDs hardcoded as null while waiting for `GET /plans/options`.
  - `tailwind.config` may need explicit `success`/`warning`/`danger` color tokens if not present.
  - Toast convention nits (plural form) carried over from /ads PR.

- [ ] **Step 2: Commit + push**

```bash
git add HANDOFF.md
git commit -m "docs(handoff): record billing/Asaas feature completion"
git push
```

- [ ] **Step 3: Open PR**

```bash
gh pr create --title "feat: billing UI + Asaas subscriptions" --body "$(cat <<'EOF'
## Summary
- New /billing route with full lifecycle (subscribe / change plan / cancel / refund).
- Global suspended banner sourced from /me + 402 + WS subscription.suspended.
- 5 new WS handlers (subscription.* events).
- New /admin/refunds panel with approve/reject.
- BREAKING: drops planId from signup, admin/users, admin/subscriptions; expands SubscriptionStatus to 6 values; reshapes SubscriptionPublic.

## Test plan
- [x] Vitest suite green (record final pass count in PR description)
- [x] tsc clean
- [x] next build succeeds (new routes show in summary)
- [ ] 10-scenario manual QA against production (running)
EOF
)"
```

- [ ] **Step 4: After PR review and approval — merge**

User does the merge or approves squash-merge to main. Local cleanup:

```bash
git checkout main && git pull && git branch -d feat/billing-asaas
```

---

## Self-review

**Spec coverage:**

- ✅ Parte 1 — `/billing` page with all 8 UI states: page.tsx + subscription-overview + plan-grid (Caso A) + status-badge + payments-table + 3 modals + refund-status-card. Tasks 17, 18, 21.
- ✅ Parte 1.1 — Change-plan modal with upgrade/downgrade decision via `getPlanChangeAction`. Task 18 step 4.
- ✅ Parte 1.2 — Cancel modal with optional reason. Task 18 step 5.
- ✅ Parte 1.3 — Refund-request modal + persistent in-analysis card. Task 18 steps 6-7.
- ✅ Parte 2 — Global suspended banner driven by `/me` status (Task 21 step 5) + 402 interceptor (Task 20) + WS suspended/activated (Task 21).
- ✅ Parte 3 — 5 WS handlers in subscription-events-provider. Task 21.
- ✅ Parte 4 — `/admin/refunds` with list, approve modal, reject modal. Tasks 22-23.
- ✅ Parte 5 — BREAKING removals: signup (Task 10), admin/users (Tasks 11-12), admin/subscriptions (Task 13).
- ✅ Parte 6 — Friendly error mapping in actions (Task 17 step 3) + sub catalog in i18n (Task 9).

**Placeholder scan:** every code block is complete; helpers reference functions defined in the same task; no "TBD"/"add validation"/"similar to above"; tests have actual assertions. The only intentional `null` is `PlanOption.id` in the fallback catalog (documented).

**Type consistency:**
- `MySubscription`, `MyPayment`, `PlanOption`, `SubscribeResponse`, `RefundRequestPublic` — defined in MM-0, used unchanged in MM-2/MM-4.
- `SubscriptionStatus` 6-value union — defined in Task 1, consumed by status-badge, payments-table, ads of admin/subscriptions, refund-modal, banner.
- `setSuspended(boolean)` signature consistent across `subscription-banner-store`, `auth-fetch.ts`, `subscription-events-provider`.
- `IAdminSubscriptionService.subscribe(userId, planId)` — same signature in interface (Task 4), service impl (Task 4), action wrapper (Task 13).
- WS event types (`subscription.payment_confirmed`, etc.) — same string keys in provider (Task 21) and i18n toast keys (Task 9).

No drift detected.
