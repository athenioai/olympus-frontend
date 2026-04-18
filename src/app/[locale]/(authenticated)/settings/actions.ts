"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { authService, calendarConfigService, channelAccountService, financeService } from "@/lib/services";
import type { CalendarConfig, ChannelAccount, PrepaymentSetting } from "@/lib/services";

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

const timeRangeSchema = z.object({
  start: z.string().min(1),
  end: z.string().min(1),
});

const businessHourSchema = z.object({
  day: z.string().min(1),
  ranges: z.array(timeRangeSchema),
});

const calendarConfigSchema = z.object({
  businessHours: z.array(businessHourSchema).optional(),
  slotDurationMinutes: z.coerce.number().int().min(10).max(240).optional(),
  minAdvanceMinutes: z.coerce.number().int().min(0).max(10080).optional(),
  minCancelAdvanceMinutes: z.coerce.number().int().min(0).max(10080).optional(),
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
  requirePrepayment: z.boolean(),
});

/**
 * Update the prepayment setting.
 * @param params - Object with requirePrepayment boolean
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
    const data = await financeService.updatePrepaymentSetting(parsed.data.requirePrepayment);
    revalidatePath("/settings");
    return { success: true, data };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: message };
  }
}

// ---------------------------------------------------------------------------
// Channel accounts
// ---------------------------------------------------------------------------

/**
 * Connect a channel account (e.g. Telegram bot token).
 * @param channel - Channel type
 * @param accessToken - Access/bot token
 * @returns Created channel account or error
 */
export async function connectChannel(
  channel: string,
  accessToken: string,
): Promise<ActionResult<ChannelAccount>> {
  if (!channel || !accessToken.trim()) {
    return { success: false, error: "Token obrigatório." };
  }

  try {
    const data = await channelAccountService.create({ channel, accessToken: accessToken.trim() });
    revalidatePath("/settings");
    return { success: true, data };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    if (msg.includes("já está conectado") || msg.includes("CONFLICT")) {
      return { success: false, error: "CONFLICT" };
    }
    if (msg.includes("INCOMPLETE") || msg.includes("BUSINESS_PROFILE")) {
      return { success: false, error: "PROFILE_INCOMPLETE" };
    }
    return { success: false, error: msg };
  }
}

/**
 * List all connected channel accounts.
 * @returns Array of channel accounts or error
 */
export async function listChannels(): Promise<ActionResult<ChannelAccount[]>> {
  try {
    const data = await channelAccountService.list();
    return { success: true, data };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: msg };
  }
}

/**
 * Disconnect a channel account.
 * @param id - Channel account ID
 * @returns Success or error
 */
export async function disconnectChannel(
  id: string,
): Promise<ActionResult> {
  if (!id) return { success: false, error: "ID obrigatório." };

  try {
    await channelAccountService.remove(id);
    revalidatePath("/settings");
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: msg };
  }
}

/**
 * Start a Meta WhatsApp OAuth handshake. Fetches a signed `state` token
 * from the backend so the callback on /auth/whatsapp/callback can
 * validate the session that initiated the popup.
 */
export async function initWhatsAppOAuthAction(): Promise<
  ActionResult<{ state: string }>
> {
  try {
    const { state } = await authService.initWhatsAppOAuth();
    return { success: true, data: { state } };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: msg };
  }
}
