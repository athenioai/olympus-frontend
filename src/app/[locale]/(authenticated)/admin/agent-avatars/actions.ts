"use server";

import { revalidatePath, updateTag } from "next/cache";
import { z } from "zod";
import { ApiError } from "@/lib/api-envelope";
import { captureUnexpected } from "@/lib/observability/capture";
import { requireAdmin } from "@/lib/auth/require-admin";
import { CACHE_TAGS } from "@/lib/cache-config";
import { adminAgentAvatarService } from "@/lib/services";
import type { AgentAvatarAdmin } from "@/lib/services";

export interface AvatarActionResult {
  readonly success: boolean;
  readonly data?: AgentAvatarAdmin;
  readonly error?: string;
}

const updateSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  sortOrder: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

const idSchema = z.string().uuid();

export async function uploadAgentAvatarAction(
  formData: FormData,
): Promise<AvatarActionResult> {
  const guard = await requireAdmin();
  if (!guard.ok) return { success: false, error: guard.error };

  const file = formData.get("file");
  const name = formData.get("name");
  const sortOrderRaw = formData.get("sortOrder");
  const isActiveRaw = formData.get("isActive");

  if (!(file instanceof File) || file.size === 0) {
    return { success: false, error: "FILE_REQUIRED" };
  }
  if (typeof name !== "string" || name.trim() === "") {
    return { success: false, error: "NAME_REQUIRED" };
  }

  const sortOrder =
    typeof sortOrderRaw === "string" && sortOrderRaw.trim() !== ""
      ? Number.parseInt(sortOrderRaw, 10)
      : undefined;
  const isActive =
    typeof isActiveRaw === "string" ? isActiveRaw === "true" : undefined;

  try {
    const data = await adminAgentAvatarService.create({
      file,
      name: name.trim(),
      ...(sortOrder !== undefined && !Number.isNaN(sortOrder) ? { sortOrder } : {}),
      ...(isActive !== undefined ? { isActive } : {}),
    });
    updateTag(CACHE_TAGS.adminAvatars);
    revalidatePath("/admin/agent-avatars");
    return { success: true, data };
  } catch (err) {
    return { success: false, error: mapErr(err) };
  }
}

export async function updateAgentAvatarAction(
  id: string,
  input: unknown,
): Promise<AvatarActionResult> {
  const guard = await requireAdmin();
  if (!guard.ok) return { success: false, error: guard.error };

  if (!idSchema.safeParse(id).success) {
    return { success: false, error: "INVALID_ID" };
  }
  const parsed = updateSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "INVALID_INPUT" };
  try {
    const data = await adminAgentAvatarService.update(id, parsed.data);
    updateTag(CACHE_TAGS.adminAvatars);
    revalidatePath("/admin/agent-avatars");
    return { success: true, data };
  } catch (err) {
    return { success: false, error: mapErr(err) };
  }
}

export async function deleteAgentAvatarAction(
  id: string,
): Promise<AvatarActionResult> {
  const guard = await requireAdmin();
  if (!guard.ok) return { success: false, error: guard.error };

  if (!idSchema.safeParse(id).success) {
    return { success: false, error: "INVALID_ID" };
  }
  try {
    await adminAgentAvatarService.remove(id);
    updateTag(CACHE_TAGS.adminAvatars);
    revalidatePath("/admin/agent-avatars");
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
