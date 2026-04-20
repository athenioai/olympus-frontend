import { authService } from "@/lib/services/auth-service";
import type { AuthUser } from "@/lib/services/interfaces/auth-service";

export type AdminGuardFailure = { readonly ok: false; readonly error: "FORBIDDEN" };
export type AdminGuardSuccess = { readonly ok: true; readonly user: AuthUser };
export type AdminGuardResult = AdminGuardFailure | AdminGuardSuccess;

/**
 * Server-side guard for admin-only actions.
 *
 * The admin layout already blocks non-admins from rendering the admin UI, but
 * server actions are callable by any authenticated client (e.g. via DevTools
 * fetch). Without this guard the backend is the sole line of defense.
 *
 * Usage:
 *   const guard = await requireAdmin();
 *   if (!guard.ok) return { success: false, error: guard.error };
 */
export async function requireAdmin(): Promise<AdminGuardResult> {
  const user = await authService.getSession();
  if (!user || user.role !== "admin") {
    return { ok: false, error: "FORBIDDEN" };
  }
  return { ok: true, user };
}
