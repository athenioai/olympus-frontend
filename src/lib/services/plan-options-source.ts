// src/lib/services/plan-options-source.ts
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
