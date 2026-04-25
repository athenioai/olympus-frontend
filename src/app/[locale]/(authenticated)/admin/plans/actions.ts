"use server";

import { revalidatePath, updateTag } from "next/cache";
import { z } from "zod";
import { ApiError } from "@/lib/api-envelope";
import { captureUnexpected } from "@/lib/observability/capture";
import { requireAdmin } from "@/lib/auth/require-admin";
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

const idSchema = z.string().uuid();

export async function createPlanAction(
  input: unknown,
): Promise<PlanActionResult> {
  const guard = await requireAdmin();
  if (!guard.ok) return { success: false, error: guard.error };

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
  const guard = await requireAdmin();
  if (!guard.ok) return { success: false, error: guard.error };

  if (!idSchema.safeParse(id).success) {
    return { success: false, error: "INVALID_ID" };
  }
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
  const guard = await requireAdmin();
  if (!guard.ok) return { success: false, error: guard.error };

  if (!idSchema.safeParse(id).success) {
    return { success: false, error: "INVALID_ID" };
  }
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
  captureUnexpected(err);
  if (err instanceof ApiError || err instanceof Error) return err.message;
  return "UNKNOWN_ERROR";
}
