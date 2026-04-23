"use server";

import { revalidatePath, updateTag } from "next/cache";
import { z } from "zod";
import { ApiError } from "@/lib/api-envelope";
import { captureUnexpected } from "@/lib/observability/capture";
import { requireAdmin } from "@/lib/auth/require-admin";
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

const idSchema = z.string().uuid();
const hhmmRegex = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

const timeRangeSchema = z
  .object({
    start: z.string().regex(hhmmRegex, "INVALID_TIME_FORMAT"),
    end: z.string().regex(hhmmRegex, "INVALID_TIME_FORMAT"),
  })
  .refine((r) => r.start < r.end, {
    message: "TIME_RANGE_INVERTED",
  });

const businessHourEntrySchema = z.object({
  day: z.string().trim().min(1).max(40),
  ranges: z.array(timeRangeSchema).max(8),
});

const calendarConfigSchema = z.object({
  businessHours: z.array(businessHourEntrySchema).max(14).optional(),
  slotDurationMinutes: z.number().int().min(10).max(240).optional(),
  minAdvanceMinutes: z.number().int().min(0).max(10080).optional(),
  minCancelAdvanceMinutes: z.number().int().min(0).max(10080).optional(),
});

export async function updateCalendarConfigAction(
  userId: string,
  payload: UpdateCalendarConfigPayload,
): Promise<CalendarUpdateResult> {
  const guard = await requireAdmin();
  if (!guard.ok) return { success: false, error: guard.error };

  if (!idSchema.safeParse(userId).success) {
    return { success: false, error: "INVALID_ID" };
  }
  const parsed = calendarConfigSchema.safeParse(payload);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? "INVALID_INPUT";
    return { success: false, error: firstError };
  }

  let data: AdminCalendarConfig;
  try {
    data = await adminUserService.updateCalendarConfig(userId, parsed.data);
  } catch (err) {
    return { success: false, error: mapErr(err) };
  }

  // Revalidation is best-effort: the backend already persisted the new
  // config, so a failure here (e.g. `updateTag` throwing when the work store
  // shape changes between Next releases) should NOT turn a successful save
  // into a red toast. QA Bug 38 flagged exactly that false-negative.
  try {
    updateTag(CACHE_TAGS.adminUserDetail);
    revalidatePath(`/admin/users/${userId}`, "page");
  } catch (revalidateErr) {
    captureUnexpected(revalidateErr);
  }

  return { success: true, data };
}

export async function loadChatMessagesAction(
  userId: string,
  chatId: string,
): Promise<ChatMessagesResult> {
  const guard = await requireAdmin();
  if (!guard.ok) return { success: false, error: guard.error };

  if (!idSchema.safeParse(userId).success) {
    return { success: false, error: "INVALID_ID" };
  }
  if (!idSchema.safeParse(chatId).success) {
    return { success: false, error: "INVALID_CHAT_ID" };
  }

  try {
    const data = await adminUserService.getChatMessages(userId, chatId);
    return { success: true, data };
  } catch (err) {
    return { success: false, error: mapErr(err) };
  }
}

const FRIENDLY_ERRORS: Record<string, string> = {
  NOT_FOUND: "Usuário não encontrado.",
  FORBIDDEN: "Você não tem permissão para esta ação.",
  INVALID_INPUT: "Dados inválidos. Revise e tente novamente.",
  INVALID_TIME_FORMAT: "Formato de horário inválido. Use HH:MM.",
  TIME_RANGE_INVERTED: "Horário final deve ser após o inicial.",
};

function mapErr(err: unknown): string {
  captureUnexpected(err);
  if (err instanceof ApiError) {
    return FRIENDLY_ERRORS[err.code] ?? "Não foi possível salvar. Tente novamente.";
  }
  if (err instanceof Error) {
    return FRIENDLY_ERRORS[err.message] ?? "Não foi possível salvar. Tente novamente.";
  }
  return "Não foi possível salvar. Tente novamente.";
}
