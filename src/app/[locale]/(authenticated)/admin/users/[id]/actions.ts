"use server";

import { revalidatePath } from "next/cache";
import { ApiError } from "@/lib/api-envelope";
import { adminUserService } from "@/lib/services";
import type {
  AdminCalendarConfig,
  UpdateCalendarConfigPayload,
} from "@/lib/services";

export interface CalendarUpdateResult {
  readonly success: boolean;
  readonly data?: AdminCalendarConfig;
  readonly error?: string;
}

export async function updateCalendarConfigAction(
  userId: string,
  payload: UpdateCalendarConfigPayload,
): Promise<CalendarUpdateResult> {
  try {
    const data = await adminUserService.updateCalendarConfig(userId, payload);
    revalidatePath(`/admin/users/${userId}`);
    return { success: true, data };
  } catch (err) {
    return {
      success: false,
      error: err instanceof ApiError || err instanceof Error
        ? err.message
        : "UNKNOWN_ERROR",
    };
  }
}
