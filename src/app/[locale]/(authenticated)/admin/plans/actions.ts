"use server";

import { revalidatePath, updateTag } from "next/cache";
import { z } from "zod";
import { ApiError } from "@/lib/api-envelope";
import { CACHE_TAGS } from "@/lib/cache-config";
import { adminPlanService } from "@/lib/services";
import type { PlanPublic } from "@/lib/services";

export interface PlanActionResult {
  readonly success: boolean;
  readonly data?: PlanPublic;
  readonly error?: string;
}

const createSchema = z.object({
  name: z.string().trim().min(1).max(100),
  cost: z.number().min(0).max(999999.99),
});

const updateSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  cost: z.number().min(0).max(999999.99).optional(),
});

export async function createPlanAction(
  input: unknown,
): Promise<PlanActionResult> {
  const parsed = createSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "INVALID_INPUT" };
  try {
    const data = await adminPlanService.create(parsed.data);
    updateTag(CACHE_TAGS.adminPlans);
    revalidatePath("/admin/plans");
    return { success: true, data };
  } catch (err) {
    return { success: false, error: mapErr(err) };
  }
}

export async function updatePlanAction(
  id: string,
  input: unknown,
): Promise<PlanActionResult> {
  const parsed = updateSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "INVALID_INPUT" };
  try {
    const data = await adminPlanService.update(id, parsed.data);
    updateTag(CACHE_TAGS.adminPlans);
    revalidatePath("/admin/plans");
    return { success: true, data };
  } catch (err) {
    return { success: false, error: mapErr(err) };
  }
}

export async function deletePlanAction(
  id: string,
): Promise<PlanActionResult> {
  try {
    await adminPlanService.remove(id);
    updateTag(CACHE_TAGS.adminPlans);
    updateTag(CACHE_TAGS.adminUsers);
    revalidatePath("/admin/plans");
    return { success: true };
  } catch (err) {
    return { success: false, error: mapErr(err) };
  }
}

function mapErr(err: unknown): string {
  if (err instanceof ApiError || err instanceof Error) return err.message;
  return "UNKNOWN_ERROR";
}
