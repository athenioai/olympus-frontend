import { redirect } from "next/navigation";
import { businessProfileService, financeService } from "@/lib/services";
import type { Service, WorkType } from "@/lib/services";
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
  // Block direct URL access for sales-only businesses. Mirrors the sidebar
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
  if (workType === "sales") {
    redirect("/dashboard");
  }

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
