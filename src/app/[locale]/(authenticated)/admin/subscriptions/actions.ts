"use server";

import { revalidatePath, updateTag } from "next/cache";
import { z } from "zod";
import { ApiError } from "@/lib/api-envelope";
import { CACHE_TAGS } from "@/lib/cache-config";
import { adminSubscriptionService } from "@/lib/services";
import type { SubscriptionPublic } from "@/lib/services";

export interface SubscriptionActionResult {
  readonly success: boolean;
  readonly data?: SubscriptionPublic;
  readonly error?: string;
}

const createSchema = z.object({
  userId: z.string().uuid(),
  planId: z.string().uuid(),
  billingDay: z.number().int().min(1).max(28),
});

const updateSchema = z.object({
  planId: z.string().uuid().optional(),
  billingDay: z.number().int().min(1).max(28).optional(),
  status: z.enum(["active", "suspended", "cancelled"]).optional(),
});

export async function createSubscriptionAction(
  input: unknown,
): Promise<SubscriptionActionResult> {
  const parsed = createSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "INVALID_INPUT" };
  try {
    const data = await adminSubscriptionService.create(parsed.data);
    updateTag(CACHE_TAGS.adminSubscriptions);
    updateTag(CACHE_TAGS.adminDashboard);
    revalidatePath("/admin/subscriptions");
    return { success: true, data };
  } catch (err) {
    return { success: false, error: mapErr(err) };
  }
}

export async function updateSubscriptionAction(
  id: string,
  input: unknown,
): Promise<SubscriptionActionResult> {
  const parsed = updateSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "INVALID_INPUT" };
  try {
    const data = await adminSubscriptionService.update(id, parsed.data);
    updateTag(CACHE_TAGS.adminSubscriptions);
    updateTag(CACHE_TAGS.adminDashboard);
    revalidatePath("/admin/subscriptions");
    return { success: true, data };
  } catch (err) {
    return { success: false, error: mapErr(err) };
  }
}

function mapErr(err: unknown): string {
  if (err instanceof ApiError || err instanceof Error) return err.message;
  return "UNKNOWN_ERROR";
}
