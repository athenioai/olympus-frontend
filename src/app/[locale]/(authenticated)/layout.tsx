import { redirect } from "next/navigation";
import { authService } from "@/lib/services/auth-service";
import { Sidebar } from "@/components/sidebar";
import type { ReactNode } from "react";

export default async function AuthenticatedLayout({
  children,
}: {
  readonly children: ReactNode;
}) {
  const user = await authService.getSession();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar user={user} />
      <main className="flex-1 overflow-y-auto">
        <div className="p-6 pt-16 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
