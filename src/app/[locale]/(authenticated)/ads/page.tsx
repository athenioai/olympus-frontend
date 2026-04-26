import { getTranslations } from "next-intl/server";
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

// Backend caps `limit` at 100 (rejects 200 with GENERAL_VALIDATION_001).
// If a tenant ever crosses 100 services or 100 products the picker will
// silently miss the overflow — server-side search in the picker is the
// tracked follow-up.
const CATALOG_FETCH_LIMIT = 100;

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

  // Three independent loads so a single failure can be pinpointed and so
  // a missing services/products list doesn't take the whole page down.
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
    ads = adsSettled.value;
  } else {
    captureUnexpected(adsSettled.reason);
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
  }

  if (productsSettled.status === "fulfilled") {
    products = productsSettled.value.items;
  } else {
    captureUnexpected(productsSettled.reason);
  }

  return (
    <div className="mx-auto max-w-7xl">
      <AdsTable ads={ads} services={services} products={products} />
    </div>
  );
}
