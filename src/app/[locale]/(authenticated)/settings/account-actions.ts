"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { ApiError } from "@/lib/api-envelope";
import { userService } from "@/lib/services";
import { captureUnexpected } from "@/lib/observability/capture";
import type { AuthUser } from "@/lib/services/interfaces/auth-service";

interface ActionResult<T = undefined> {
  readonly success: boolean;
  readonly error?: string;
  readonly data?: T;
}

const updateAccountSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  email: z.string().trim().email().max(255).optional(),
});

/**
 * Fetch the authenticated user for prefilling the account form.
 */
export async function fetchCurrentUser(): Promise<ActionResult<AuthUser>> {
  try {
    const data = await userService.getMe();
    return { success: true, data };
  } catch (err) {
    captureUnexpected(err);
    return { success: false, error: "GENERIC" };
  }
}

/**
 * Update the authenticated user's name and/or email via PATCH /users/me.
 *
 * `409 AUTH_REGISTER_001` from the backend means another account already owns
 * the target email — callers should show "E-mail já em uso" instead of a
 * generic error.
 */
export async function updateAccountAction(
  input: unknown,
): Promise<ActionResult<AuthUser>> {
  const parsed = updateAccountSchema.safeParse(input);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return { success: false, error: issue?.message ?? "INVALID_INPUT" };
  }

  // Drop empty optional keys so PATCH stays minimal.
  const payload: { name?: string; email?: string } = {};
  if (parsed.data.name) payload.name = parsed.data.name;
  if (parsed.data.email) payload.email = parsed.data.email;
  if (!payload.name && !payload.email) {
    return { success: false, error: "EMPTY_PATCH" };
  }

  try {
    const data = await userService.updateMe(payload);
    revalidatePath("/settings");
    return { success: true, data };
  } catch (err) {
    if (err instanceof ApiError) {
      if (err.code === "AUTH_REGISTER_001" || err.status === 409) {
        return { success: false, error: "EMAIL_TAKEN" };
      }
      return { success: false, error: `[${err.code}] ${err.message}` };
    }
    captureUnexpected(err);
    const msg = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: msg };
  }
}
