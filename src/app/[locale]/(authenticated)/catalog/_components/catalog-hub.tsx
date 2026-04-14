"use client";

import { useState } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { ServicesTable } from "./services-table";
import { ProductsTable } from "./products-table";
import type { Service, Product, FinancePagination } from "@/lib/services";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

type Tab = "services" | "products";

interface CatalogHubProps {
  readonly services: readonly Service[];
  readonly products: readonly Product[];
  readonly servicesPagination: FinancePagination;
  readonly productsPagination: FinancePagination;
  readonly initialTab: Tab;
  readonly initialSearch: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CatalogHub({
  services,
  products,
  servicesPagination,
  productsPagination,
  initialTab,
  initialSearch,
}: CatalogHubProps) {
  const t = useTranslations("catalog");
  const tc = useTranslations("common");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);
  const [searchValue, setSearchValue] = useState(initialSearch);

  const pagination = activeTab === "services" ? servicesPagination : productsPagination;
  const totalPages = Math.ceil(pagination.total / pagination.limit) || 1;
  const currentPage = pagination.page;

  /**
   * Update URL search params without full page reload.
   */
  function updateParams(updates: Record<string, string | undefined>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value === undefined || value === "") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    }
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  }

  function handleTabChange(tab: Tab) {
    setActiveTab(tab);
    updateParams({ tab, page: undefined });
  }

  function handleSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    updateParams({ search: searchValue || undefined, page: undefined });
  }

  function handlePageChange(page: number) {
    updateParams({ page: String(page) });
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      {/* Title */}
      <h1 className="font-display text-3xl font-extrabold tracking-tight text-on-surface">
        {t("title")}
      </h1>

      {/* Tabs + Search */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Tabs */}
        <div className="flex gap-1 rounded-xl bg-surface-container-high p-1">
          <button
            className={cn(
              "rounded-lg px-4 py-2 text-sm font-medium transition-colors",
              activeTab === "services"
                ? "bg-surface-container-lowest text-on-surface shadow-ambient"
                : "text-on-surface-variant hover:text-on-surface",
            )}
            onClick={() => handleTabChange("services")}
            type="button"
          >
            {t("services")}
          </button>
          <button
            className={cn(
              "rounded-lg px-4 py-2 text-sm font-medium transition-colors",
              activeTab === "products"
                ? "bg-surface-container-lowest text-on-surface shadow-ambient"
                : "text-on-surface-variant hover:text-on-surface",
            )}
            onClick={() => handleTabChange("products")}
            type="button"
          >
            {t("products")}
          </button>
        </div>

        {/* Search */}
        <form className="relative" onSubmit={handleSearch}>
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
          <input
            className="h-10 w-full rounded-xl bg-surface-container-high pl-10 pr-4 text-sm text-on-surface outline-none transition-colors placeholder:text-on-surface-variant/60 focus:bg-surface-container-lowest focus:ring-1 focus:ring-primary/30 sm:w-64"
            name="search"
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder={tc("search")}
            type="text"
            value={searchValue}
          />
        </form>
      </div>

      {/* Content */}
      {activeTab === "services" ? (
        <ServicesTable services={services} />
      ) : (
        <ProductsTable products={products} />
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-on-surface-variant">
            {tc("pagination", {
              from: (currentPage - 1) * pagination.limit + 1,
              to: Math.min(currentPage * pagination.limit, pagination.total),
              total: pagination.total,
            })}
          </p>
          <div className="flex gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                className={cn(
                  "h-8 min-w-[32px] rounded-lg px-2 text-sm font-medium transition-colors",
                  page === currentPage
                    ? "bg-primary text-on-primary"
                    : "text-on-surface-variant hover:bg-surface-container-high",
                )}
                key={page}
                onClick={() => handlePageChange(page)}
                type="button"
              >
                {page}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
