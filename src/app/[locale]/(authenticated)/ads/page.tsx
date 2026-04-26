import { getTranslations } from "next-intl/server";
import { ApiError } from "@/lib/api-envelope";
import { captureUnexpected } from "@/lib/observability/capture";
import { adsService, financeService } from "@/lib/services";
import type { Ad, Product, Service } from "@/lib/services";
import { AdsTable } from "./_components/ads-table";

interface AdsPageProps {
  readonly searchParams: Promise<{
    page?: string;
    search?: string;
  }>;
}

// Backend rejected 200 with GENERAL_VALIDATION_001. Cap appears to live at 100;
// if a tenant ever has more than 100 services or 100 products the picker will
// silently miss the overflow. Tracked as follow-up: server-side search inside
// the picker.
const CATALOG_FETCH_LIMIT = 100;

interface ErrorShape {
  readonly kind: string;
  readonly message: string;
  readonly code?: string;
  readonly status?: number;
}

function inspectShape(value: unknown): unknown {
  if (Array.isArray(value)) {
    return { kind: "array", length: value.length, first: value[0] ?? null };
  }
  if (value && typeof value === "object") {
    return { kind: "object", keys: Object.keys(value) };
  }
  return { kind: typeof value, value };
}

function logShape(reason: unknown): ErrorShape {
  if (reason instanceof ApiError) {
    return {
      kind: "ApiError",
      message: reason.message,
      code: reason.code,
      status: reason.status,
    };
  }
  if (reason instanceof Error) {
    return { kind: reason.name, message: reason.message };
  }
  return { kind: typeof reason, message: String(reason) };
}

/**
 * Standalone ads page — fetches ads + the user's services and products
 * (so the form's items picker can list them) and renders the table.
 */
export default async function AdsPage({ searchParams }: AdsPageProps) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const search = params.search ?? "";
  const t = await getTranslations("ads");

  let ads: readonly Ad[] = [];
  let services: readonly Service[] = [];
  let products: readonly Product[] = [];

  // Run the three loads independently so a single failure can be pinpointed
  // (and an empty/unimplemented endpoint doesn't take the whole page down).
  const [adsSettled, servicesSettled, productsSettled] = await Promise.allSettled([
    adsService.listAds({
      page,
      limit: 20,
      search: search || undefined,
    }),
    financeService.listServices({ page: 1, limit: CATALOG_FETCH_LIMIT }),
    financeService.listProducts({ page: 1, limit: CATALOG_FETCH_LIMIT }),
  ]);

  if (adsSettled.status === "fulfilled") {
    const value: unknown = adsSettled.value;
    if (process.env.NODE_ENV !== "production") {
      console.error("[ads page] listAds value shape:", inspectShape(value));
    }
    if (Array.isArray(value)) {
      ads = value as readonly Ad[];
    } else if (
      value &&
      typeof value === "object" &&
      "items" in value &&
      Array.isArray((value as { items: unknown }).items)
    ) {
      ads = (value as { items: readonly Ad[] }).items;
    } else {
      ads = [];
    }
  } else {
    captureUnexpected(adsSettled.reason);
    if (process.env.NODE_ENV !== "production") {
      console.error("[ads page] listAds failed:", logShape(adsSettled.reason));
    }
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-sm text-on-surface-variant">{t("loadFailed")}</p>
      </div>
    );
  }

  if (servicesSettled.status === "fulfilled") {
    services = servicesSettled.value.items;
  } else {
    captureUnexpected(servicesSettled.reason);
    if (process.env.NODE_ENV !== "production") {
      console.error("[ads page] listServices failed:", logShape(servicesSettled.reason));
    }
  }

  if (productsSettled.status === "fulfilled") {
    products = productsSettled.value.items;
  } else {
    captureUnexpected(productsSettled.reason);
    if (process.env.NODE_ENV !== "production") {
      console.error("[ads page] listProducts failed:", logShape(productsSettled.reason));
    }
  }

  return (
    <div className="mx-auto max-w-7xl">
      <AdsTable ads={ads} services={services} products={products} />
    </div>
  );
}
