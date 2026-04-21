import type { PlanPublic } from "@/lib/services";
import type { AuthUser } from "@/lib/services/interfaces/auth-service";

/**
 * In-memory state backing the MSW handlers. We anchor it on `globalThis`
 * because Next's build graph can load the same module file twice under
 * different runtime contexts (instrumentation vs. route handler) which
 * would otherwise give each its own copy. The global slot guarantees one
 * source of truth for the whole Node process.
 */

export const ADMIN_USER: AuthUser = {
  id: "user-admin",
  name: "Admin Teste",
  email: "admin@test.local",
  role: "admin",
  workType: "services",
  createdAt: "2026-01-01T00:00:00.000Z",
};

export interface MswState {
  plans: PlanPublic[];
}

const GLOBAL_KEY = "__olympus_msw_state__";

type GlobalWithState = typeof globalThis & {
  [GLOBAL_KEY]?: MswState;
};

function initialState(): MswState {
  return { plans: [] };
}

function getOrInit(): MswState {
  const g = globalThis as GlobalWithState;
  if (!g[GLOBAL_KEY]) {
    g[GLOBAL_KEY] = initialState();
  }
  return g[GLOBAL_KEY];
}

export const state: MswState = getOrInit();

export function resetMswState(): void {
  const current = getOrInit();
  current.plans = [];
}
