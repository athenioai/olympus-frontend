import { redirect } from "next/navigation";
import { businessProfileService, financeService } from "@/lib/services";
import type { Product, WorkType } from "@/lib/services";
import { ProductsTable } from "./_components/products-table";

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
  // Block direct URL access for service-only businesses. Mirrors the sidebar
  // filter in `getVisibleUserNav`. Null workType (pre-onboarding / transient
  // failure) stays permissive — same fallback the layout uses. The redirect
  // must run outside the try/catch because Next.js implements it via a thrown
  // sentinel error that must propagate.
  let workType: WorkType | null = null;
  try {
    const profileView = await businessProfileService.getProfile();
    workType = profileView.profile?.workType ?? null;
  } catch {
    workType = null;
  }
  if (workType === "services") {
    redirect("/dashboard");
  }

  const params = await searchParams;
  const page = Number(params.page) || 1;
  const search = params.search ?? "";

  let products: readonly Product[] = [];

  try {
    const result = await financeService.listProducts({
      page,
      limit: 20,
      search: search || undefined,
    });
    products = result.items;
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
