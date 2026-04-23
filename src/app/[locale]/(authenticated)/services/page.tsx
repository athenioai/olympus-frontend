import { financeService } from "@/lib/services";
import type { Service } from "@/lib/services";
import { ServicesTable } from "./_components/services-table";

interface ServicesPageProps {
  readonly searchParams: Promise<{
    page?: string;
    search?: string;
  }>;
}

/**
 * Standalone services page — thin wrapper that fetches services
 * and renders the ServicesTable component.
 */
export default async function ServicesPage({ searchParams }: ServicesPageProps) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const search = params.search ?? "";

  let services: readonly Service[] = [];

  try {
    const result = await financeService.listServices({
      page,
      limit: 20,
      search: search || undefined,
    });
    services = result.items;
  } catch {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-sm text-on-surface-variant">
          Failed to load services. Please try again later.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl">
      <ServicesTable services={services} />
    </div>
  );
}
