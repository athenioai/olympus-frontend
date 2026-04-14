"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { calendarConfigService, financeService } from "@/lib/services";
import type { CalendarConfig, PrepaymentSetting } from "@/lib/services";

// ---------------------------------------------------------------------------
// Shared types
// ---------------------------------------------------------------------------

interface ActionResult<T = undefined> {
  readonly success: boolean;
  readonly error?: string;
  readonly data?: T;
}

// ---------------------------------------------------------------------------
// Calendar config
// ---------------------------------------------------------------------------

const businessHourSchema = z.object({
  day: z.string().min(1),
  schedule: z.string().min(1),
});

const calendarConfigSchema = z.object({
  business_hours: z.array(businessHourSchema).optional(),
  slot_duration_minutes: z.coerce.number().int().min(5).max(480).optional(),
  min_advance_hours: z.coerce.number().int().min(0).max(720).optional(),
  min_cancel_advance_hours: z.coerce.number().int().min(0).max(720).optional(),
});

/**
 * Update the calendar configuration.
 * @param params - Calendar config fields to update
 * @returns Action result with updated config or error
 */
export async function updateCalendarConfig(
  params: unknown,
): Promise<ActionResult<CalendarConfig>> {
  const parsed = calendarConfigSchema.safeParse(params);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message };
  }

  try {
    const data = await calendarConfigService.update(parsed.data);
    revalidatePath("/settings");
    return { success: true, data };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: message };
  }
}

// ---------------------------------------------------------------------------
// Prepayment setting
// ---------------------------------------------------------------------------

const prepaymentSchema = z.object({
  enabled: z.boolean(),
});

/**
 * Update the prepayment setting.
 * @param params - Object with enabled boolean
 * @returns Action result with updated prepayment setting or error
 */
export async function updatePrepaymentSetting(
  params: unknown,
): Promise<ActionResult<PrepaymentSetting>> {
  const parsed = prepaymentSchema.safeParse(params);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message };
  }

  try {
    const data = await financeService.updatePrepaymentSetting(parsed.data.enabled);
    revalidatePath("/settings");
    return { success: true, data };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: message };
  }
}
