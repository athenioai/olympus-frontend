import { financeService } from "@/lib/services";
import type { Product, FinancePagination } from "@/lib/services";
import { ProductsTable } from "../catalog/_components/products-table";

interface ProductsPageProps {
  readonly searchParams: Promise<{
    page?: string;
    search?: string;
  }>;
}

/**
 * Standalone products page — thin wrapper that fetches products
 * and renders the ProductsTable component.
 */
export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const search = params.search ?? "";

  let products: readonly Product[] = [];
  let pagination: FinancePagination = { page: 1, limit: 20, total: 0 };

  try {
    const result = await financeService.listProducts({
      page,
      limit: 20,
      search: search || undefined,
    });
    products = result.data;
    pagination = result.pagination;
  } catch {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-sm text-on-surface-variant">
          Failed to load products. Please try again later.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl">
      <ProductsTable products={products} />
    </div>
  );
}
