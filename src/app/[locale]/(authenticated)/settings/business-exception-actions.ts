"use server";

import { revalidatePath } from "next/cache";
import { businessExceptionService } from "@/lib/services";
import { captureUnexpected } from "@/lib/observability/capture";
import type { BusinessException, CreateExceptionPayload, UpdateExceptionPayload } from "@/lib/services";

interface ActionResult<T = undefined> {
  readonly success: boolean;
  readonly error?: string;
  readonly data?: T;
}

export async function fetchExceptions(params?: { from?: string; to?: string }): Promise<ActionResult<BusinessException[]>> {
  try {
    const data = await businessExceptionService.list(params);
    return { success: true, data };
  } catch (err) {
    captureUnexpected(err);
    const msg = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: msg };
  }
}

export async function createException(payload: CreateExceptionPayload): Promise<ActionResult<BusinessException>> {
  try {
    const data = await businessExceptionService.create(payload);
    revalidatePath("/settings");
    return { success: true, data };
  } catch (err) {
    captureUnexpected(err);
    const msg = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: msg };
  }
}

export async function updateException(id: string, payload: UpdateExceptionPayload): Promise<ActionResult<BusinessException>> {
  try {
    const data = await businessExceptionService.update(id, payload);
    revalidatePath("/settings");
    return { success: true, data };
  } catch (err) {
    captureUnexpected(err);
    const msg = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: msg };
  }
}

export async function deleteException(id: string): Promise<ActionResult> {
  try {
    await businessExceptionService.remove(id);
    revalidatePath("/settings");
    return { success: true };
  } catch (err) {
    captureUnexpected(err);
    const msg = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: msg };
  }
}
