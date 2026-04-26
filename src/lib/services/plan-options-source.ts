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
  /**
   * Maps to `billing.plans.<slug>.features` in the i18n bundle. `null` when
   * the backend response includes a name we can't normalize to a known slug —
   * components must degrade gracefully (skip the features line).
   */
  readonly slug: PlanSlug | null;
}

const KNOWN_SLUGS: readonly PlanSlug[] = [
  "solo",
  "fundador",
  "essencial",
  "operador",
  "estrategico",
];

/**
 * Strip accents + lowercase, then check the whitelist. Used when the backend
 * sends a plan name without an explicit slug field.
 */
function deriveSlugFromName(name: string): PlanSlug | null {
  const normalized = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim();
  return KNOWN_SLUGS.find((s) => s === normalized) ?? null;
}

interface RawPlanOption {
  readonly id?: string | null;
  readonly name?: string;
  readonly cost?: number;
  readonly slug?: PlanSlug | string | null;
}

function normalize(raw: RawPlanOption): PlanOption {
  const name = raw.name ?? "";
  const explicitSlug =
    typeof raw.slug === "string" && KNOWN_SLUGS.includes(raw.slug as PlanSlug)
      ? (raw.slug as PlanSlug)
      : null;
  return {
    id: raw.id ?? null,
    name,
    cost: typeof raw.cost === "number" ? raw.cost : 0,
    slug: explicitSlug ?? deriveSlugFromName(name),
  };
}

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
    const raw = await unwrapEnvelope<readonly RawPlanOption[]>(response);
    return raw.map(normalize);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      return FALLBACK_CATALOG;
    }
    throw err;
  }
}
