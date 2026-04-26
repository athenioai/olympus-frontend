import { getTranslations } from "next-intl/server";
import { adminUserService } from "@/lib/services";
import type {
  ListAdminUsersParams,
  OnboardingStatus,
  PaginatedAdminUsers,
} from "@/lib/services";
import { UsersView } from "./_components/users-view";

const DEFAULT_LIMIT = 20;

interface AdminUsersSearchParams {
  readonly page?: string;
  readonly search?: string;
  readonly onboardingStatus?: string;
}

export default async function AdminUsersPage({
  searchParams,
}: {
  readonly searchParams: Promise<AdminUsersSearchParams>;
}) {
  const tc = await getTranslations("admin.common");
  const rawParams = await searchParams;
  const parsed = parseSearchParams(rawParams);

  let usersPage: PaginatedAdminUsers = {
    items: [],
    total: 0,
    page: parsed.page ?? 1,
    limit: DEFAULT_LIMIT,
  };
  let errorMessage: string | null = null;

  try {
    usersPage = await adminUserService.list({
      ...parsed,
      limit: DEFAULT_LIMIT,
    });
  } catch (err) {
    errorMessage = err instanceof Error ? err.message : tc("loadError");
  }

  return (
    <UsersView
      errorMessage={errorMessage}
      filters={{
        search: parsed.search ?? "",
        onboardingStatus: parsed.onboardingStatus ?? "",
      }}
      initialPage={usersPage}
    />
  );
}

function parseSearchParams(
  raw: AdminUsersSearchParams,
): ListAdminUsersParams {
  const page = Math.max(1, Number.parseInt(raw.page ?? "1", 10) || 1);
  const search = raw.search?.trim();
  const onboardingStatus: OnboardingStatus | undefined =
    raw.onboardingStatus === "pending" || raw.onboardingStatus === "completed"
      ? raw.onboardingStatus
      : undefined;

  return {
    page,
    ...(search ? { search } : {}),
    ...(onboardingStatus ? { onboardingStatus } : {}),
  };
}
