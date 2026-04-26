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

const CATALOG_FETCH_LIMIT = 200;

interface ErrorShape {
  readonly kind: string;
  readonly message: string;
  readonly code?: string;
  readonly status?: number;
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
    ads = adsSettled.value.items;
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
