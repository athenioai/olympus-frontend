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

/**
 * Standalone ads page — fetches ads + the user's services and products
 * (so the form's items picker can list them) and renders the table.
 */
export default async function AdsPage({ searchParams }: AdsPageProps) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const search = params.search ?? "";

  let ads: readonly Ad[] = [];
  let services: readonly Service[] = [];
  let products: readonly Product[] = [];

  try {
    const [adsResult, servicesResult, productsResult] = await Promise.all([
      adsService.listAds({
        page,
        limit: 20,
        search: search || undefined,
      }),
      financeService.listServices({ page: 1, limit: CATALOG_FETCH_LIMIT }),
      financeService.listProducts({ page: 1, limit: CATALOG_FETCH_LIMIT }),
    ]);
    ads = adsResult.items;
    services = servicesResult.items;
    products = productsResult.items;
  } catch {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-sm text-on-surface-variant">
          Não foi possível carregar os anúncios. Tente novamente mais tarde.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl">
      <AdsTable ads={ads} services={services} products={products} />
    </div>
  );
}
