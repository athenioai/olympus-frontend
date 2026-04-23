import { getTranslations } from "next-intl/server";
import { adminPlanService } from "@/lib/services";
import type {
  ListAdminPlansParams,
  PaginatedAdminPlans,
} from "@/lib/services";
import { PlansView } from "./_components/plans-view";

const DEFAULT_LIMIT = 20;

interface AdminPlansSearchParams {
  readonly page?: string;
  readonly search?: string;
}

export default async function AdminPlansPage({
  searchParams,
}: {
  readonly searchParams: Promise<AdminPlansSearchParams>;
}) {
  const tc = await getTranslations("admin.common");
  const rawParams = await searchParams;
  const parsed = parseSearchParams(rawParams);

  let plansPage: PaginatedAdminPlans = {
    items: [],
    total: 0,
    page: parsed.page ?? 1,
    limit: DEFAULT_LIMIT,
  };
  let errorMessage: string | null = null;

  try {
    plansPage = await adminPlanService.list({
      ...parsed,
      limit: DEFAULT_LIMIT,
    });
  } catch (err) {
    errorMessage = err instanceof Error ? err.message : tc("loadError");
  }

  return (
    <PlansView
      errorMessage={errorMessage}
      filters={{ search: parsed.search ?? "" }}
      initialPage={plansPage}
    />
  );
}

function parseSearchParams(raw: AdminPlansSearchParams): ListAdminPlansParams {
  const page = Math.max(1, Number.parseInt(raw.page ?? "1", 10) || 1);
  const search = raw.search?.trim();

  return {
    page,
    ...(search ? { search } : {}),
  };
}
