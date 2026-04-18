import { notFound } from "next/navigation";
import { ApiError } from "@/lib/api-envelope";
import { adminUserService } from "@/lib/services";
import type {
  AdminAppointment,
  AdminCalendarConfig,
  AdminChat,
  AdminUserPublic,
  UserDashboardSummary,
} from "@/lib/services";
import { UserDetailView } from "./_components/user-detail-view";

interface AdminUserDetailPageProps {
  readonly params: Promise<{ readonly id: string }>;
}

export default async function AdminUserDetailPage({
  params,
}: AdminUserDetailPageProps) {
  const { id } = await params;

  let user: AdminUserPublic;
  try {
    user = await adminUserService.getById(id);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    throw err;
  }

  const [dashboard, appointments, chats, calendarConfig] = await Promise.all([
    safeFetch<UserDashboardSummary>(() => adminUserService.getDashboard(id)),
    safeFetch<readonly AdminAppointment[]>(() =>
      adminUserService.getAppointments(id),
    ),
    safeFetch<readonly AdminChat[]>(() => adminUserService.getChats(id)),
    safeFetch<AdminCalendarConfig | null>(() =>
      adminUserService.getCalendarConfig(id),
    ),
  ]);

  return (
    <UserDetailView
      initialAppointments={appointments ?? []}
      initialCalendarConfig={calendarConfig ?? null}
      initialChats={chats ?? []}
      initialDashboard={dashboard ?? null}
      user={user}
    />
  );
}

async function safeFetch<T>(fn: () => Promise<T>): Promise<T | null> {
  try {
    return await fn();
  } catch {
    return null;
  }
}
