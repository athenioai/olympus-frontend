"use server";

import { authService } from "@/lib/services/auth-service";

/**
 * Server action to log out the current user.
 * Clears auth cookies.
 */
export async function logoutAction(): Promise<void> {
  await authService.logout();
}
