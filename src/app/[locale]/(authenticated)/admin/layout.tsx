import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { authService } from "@/lib/services/auth-service";

export default async function AdminLayout({
  children,
}: {
  readonly children: ReactNode;
}) {
  const user = await authService.getSession();

  if (!user || user.role !== "admin") {
    redirect("/dashboard");
  }

  return <>{children}</>;
}
