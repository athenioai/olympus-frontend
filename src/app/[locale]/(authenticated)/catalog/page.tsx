import { financeService } from "@/lib/services";
import type {
  Service,
  Product,
  FinancePagination,
} from "@/lib/services";
import { CatalogHub } from "./_components/catalog-hub";

interface CatalogPageProps {
  readonly searchParams: Promise<{
    page?: string;
    search?: string;
    tab?: string;
  }>;
}

/**
 * Catalog page — Server Component that fetches services and products
 * in parallel and delegates rendering to the client CatalogHub.
 */
export default async function CatalogPage({ searchParams }: CatalogPageProps) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const search = params.search ?? "";
  const tab = params.tab === "products" ? "products" : "services";

  let services: readonly Service[] = [];
  let products: readonly Product[] = [];
  let servicesPagination: FinancePagination = { page: 1, limit: 20, total: 0 };
  let productsPagination: FinancePagination = { page: 1, limit: 20, total: 0 };

  try {
    const [servicesRes, productsRes] = await Promise.all([
      financeService.listServices({ page, limit: 20, search: search || undefined }),
      financeService.listProducts({ page, limit: 20, search: search || undefined }),
    ]);

    services = servicesRes.data;
    products = productsRes.data;
    servicesPagination = servicesRes.pagination;
    productsPagination = productsRes.pagination;
  } catch {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-sm text-on-surface-variant">
          Failed to load catalog data. Please try again later.
        </p>
      </div>
    );
  }

  return (
    <CatalogHub
      initialSearch={search}
      initialTab={tab}
      products={products}
      productsPagination={productsPagination}
      services={services}
      servicesPagination={servicesPagination}
    />
  );
}
