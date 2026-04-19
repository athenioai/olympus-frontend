"use server";

import { revalidatePath, updateTag } from "next/cache";
import { z } from "zod";
import { ApiError } from "@/lib/api-envelope";
import { CACHE_TAGS } from "@/lib/cache-config";
import { adminUserService } from "@/lib/services";
import type { AdminUserPublic } from "@/lib/services";

export interface AdminActionResult<T = undefined> {
  readonly success: boolean;
  readonly data?: T;
  readonly error?: string;
}

const workTypeSchema = z.enum(["services", "sales", "hybrid"]);
const roleSchema = z.enum(["admin", "user"]);

const createUserSchema = z.object({
  name: z.string().trim().min(1).max(255),
  email: z.string().trim().email(),
  workType: workTypeSchema,
  planId: z.string().uuid().optional().or(z.literal("").transform(() => undefined)),
});

const updateUserSchema = z.object({
  name: z.string().trim().min(1).max(255).optional(),
  email: z.string().trim().email().optional(),
  workType: workTypeSchema.optional(),
  role: roleSchema.optional(),
  planId: z.string().uuid().optional().or(z.literal("").transform(() => undefined)),
});

export async function createAdminUserAction(
  input: unknown,
): Promise<AdminActionResult<AdminUserPublic>> {
  const parsed = createUserSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "INVALID_INPUT" };

  try {
    const data = await adminUserService.create(parsed.data);
    updateTag(CACHE_TAGS.adminUsers);
    updateTag(CACHE_TAGS.adminDashboard);
    revalidatePath("/admin/users");
    return { success: true, data };
  } catch (err) {
    return { success: false, error: apiErrorMessage(err) };
  }
}

export async function updateAdminUserAction(
  id: string,
  input: unknown,
): Promise<AdminActionResult<AdminUserPublic>> {
  const parsed = updateUserSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "INVALID_INPUT" };

  try {
    const data = await adminUserService.update(id, parsed.data);
    updateTag(CACHE_TAGS.adminUsers);
    updateTag(CACHE_TAGS.adminUserDetail);
    revalidatePath("/admin/users");
    revalidatePath(`/admin/users/${id}`);
    return { success: true, data };
  } catch (err) {
    return { success: false, error: apiErrorMessage(err) };
  }
}

export async function seedHolidaysAction(
  yearsCsv: string,
): Promise<AdminActionResult> {
  const years = yearsCsv
    .split(",")
    .map((y) => y.trim())
    .filter((y) => y.length > 0)
    .map((y) => Number.parseInt(y, 10))
    .filter((y) => Number.isFinite(y) && y >= 2000 && y <= 2100);

  try {
    await adminUserService.seedHolidays(years.length ? { years } : undefined);
    return { success: true };
  } catch (err) {
    return { success: false, error: apiErrorMessage(err) };
  }
}

function apiErrorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    // Known codes get a stable identifier the client can localize.
    if (err.code === "AUTH_REGISTER_001") return "EMAIL_EXISTS";
    return err.message;
  }
  if (err instanceof Error) return err.message;
  return "UNKNOWN_ERROR";
}
