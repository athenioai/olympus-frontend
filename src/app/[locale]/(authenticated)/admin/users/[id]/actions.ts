"use server";

import { revalidatePath, updateTag } from "next/cache";
import { ApiError } from "@/lib/api-envelope";
import { CACHE_TAGS } from "@/lib/cache-config";
import { adminUserService } from "@/lib/services";
import type {
  AdminCalendarConfig,
  AdminChatMessage,
  UpdateCalendarConfigPayload,
} from "@/lib/services";

export interface CalendarUpdateResult {
  readonly success: boolean;
  readonly data?: AdminCalendarConfig;
  readonly error?: string;
}

export interface ChatMessagesResult {
  readonly success: boolean;
  readonly data?: readonly AdminChatMessage[];
  readonly error?: string;
}

export async function updateCalendarConfigAction(
  userId: string,
  payload: UpdateCalendarConfigPayload,
): Promise<CalendarUpdateResult> {
  try {
    const data = await adminUserService.updateCalendarConfig(userId, payload);
    updateTag(CACHE_TAGS.adminUserDetail);
    revalidatePath(`/admin/users/${userId}`);
    return { success: true, data };
  } catch (err) {
    return { success: false, error: mapErr(err) };
  }
}

export async function loadChatMessagesAction(
  userId: string,
  sessionId: string,
): Promise<ChatMessagesResult> {
  try {
    const data = await adminUserService.getChatMessages(userId, sessionId);
    return { success: true, data };
  } catch (err) {
    return { success: false, error: mapErr(err) };
  }
}

function mapErr(err: unknown): string {
  if (err instanceof ApiError || err instanceof Error) return err.message;
  return "UNKNOWN_ERROR";
}
