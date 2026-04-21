"use server";

import { revalidatePath } from "next/cache";
import { businessFaqService } from "@/lib/services";
import { captureUnexpected } from "@/lib/observability/capture";
import type { BusinessFaq, CreateFaqPayload, UpdateFaqPayload } from "@/lib/services";

interface ActionResult<T = undefined> {
  readonly success: boolean;
  readonly error?: string;
  readonly data?: T;
}

export async function fetchFaqs(): Promise<ActionResult<BusinessFaq[]>> {
  try {
    const data = await businessFaqService.list();
    return { success: true, data };
  } catch (err) {
    captureUnexpected(err);
    const msg = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: msg };
  }
}

export async function createFaq(payload: CreateFaqPayload): Promise<ActionResult<BusinessFaq>> {
  try {
    const data = await businessFaqService.create(payload);
    revalidatePath("/settings");
    return { success: true, data };
  } catch (err) {
    captureUnexpected(err);
    const msg = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: msg };
  }
}

export async function updateFaq(id: string, payload: UpdateFaqPayload): Promise<ActionResult<BusinessFaq>> {
  try {
    const data = await businessFaqService.update(id, payload);
    revalidatePath("/settings");
    return { success: true, data };
  } catch (err) {
    captureUnexpected(err);
    const msg = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: msg };
  }
}

export async function deleteFaq(id: string): Promise<ActionResult> {
  try {
    await businessFaqService.remove(id);
    revalidatePath("/settings");
    return { success: true };
  } catch (err) {
    captureUnexpected(err);
    const msg = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: msg };
  }
}
