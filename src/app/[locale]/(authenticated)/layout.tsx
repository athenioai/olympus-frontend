import { redirect } from "next/navigation";
import { authService } from "@/lib/services/auth-service";
import { businessProfileService } from "@/lib/services";
import { Sidebar } from "@/components/sidebar";
import { CommandPalette } from "@/components/command-palette";
import type { ReactNode } from "react";
import type { WorkType } from "@/lib/services";

export default async function AuthenticatedLayout({
  children,
}: {
  readonly children: ReactNode;
}) {
  const user = await authService.getSession();

  if (!user) {
    redirect("/login");
  }

  // workType drives which nav items are visible. It lives on the business
  // profile now (moved off the user in 2026-04 backend change), so we fetch
  // it here and pass it down. Pre-onboarding accounts and transient failures
  // yield null — Sidebar treats null as "show every item" so we never hide
  // navigation from a user we can't yet classify.
  let workType: WorkType | null = null;
  try {
    const profileView = await businessProfileService.getProfile();
    workType = profileView.profile?.workType ?? null;
  } catch {
    workType = null;
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar user={user} workType={workType} />
      <main className="flex-1 overflow-y-auto">
        <div className="p-6 pt-16 lg:p-8">{children}</div>
      </main>
      <CommandPalette />
    </div>
  );
}
