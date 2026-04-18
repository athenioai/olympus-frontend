"use server";

import { revalidatePath, updateTag } from "next/cache";
import { z } from "zod";
import { ApiError } from "@/lib/api-envelope";
import { CACHE_TAGS } from "@/lib/cache-config";
import { adminInvoiceService } from "@/lib/services";
import type { AdminInvoicePublic } from "@/lib/services";

export interface InvoiceActionResult {
  readonly success: boolean;
  readonly data?: AdminInvoicePublic;
  readonly error?: string;
}

const createSchema = z.object({
  userId: z.string().uuid(),
  subscriptionId: z.string().uuid().optional(),
  amount: z.number().min(0.01).max(999999.99),
  description: z.string().trim().max(500).optional(),
  dueDate: z.string().min(1),
  lateFeePercent: z.number().min(0).max(100).optional(),
  lateInterestType: z.enum(["simple", "compound"]).optional(),
  lateInterestPercent: z.number().min(0).max(100).optional(),
});

export async function createInvoiceAction(
  input: unknown,
): Promise<InvoiceActionResult> {
  const parsed = createSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "INVALID_INPUT" };
  try {
    const data = await adminInvoiceService.create(parsed.data);
    invalidateInvoiceCaches();
    revalidatePath("/admin/invoices");
    return { success: true, data };
  } catch (err) {
    return { success: false, error: mapErr(err) };
  }
}

export async function markInvoicePaidAction(
  id: string,
): Promise<InvoiceActionResult> {
  try {
    const data = await adminInvoiceService.markPaid(id);
    invalidateInvoiceCaches();
    revalidatePath("/admin/invoices");
    return { success: true, data };
  } catch (err) {
    return { success: false, error: mapErr(err) };
  }
}

export async function cancelInvoiceAction(
  id: string,
): Promise<InvoiceActionResult> {
  try {
    const data = await adminInvoiceService.cancel(id);
    invalidateInvoiceCaches();
    revalidatePath("/admin/invoices");
    return { success: true, data };
  } catch (err) {
    return { success: false, error: mapErr(err) };
  }
}

function invalidateInvoiceCaches() {
  updateTag(CACHE_TAGS.adminInvoices);
  updateTag(CACHE_TAGS.adminInvoiceSummary);
  updateTag(CACHE_TAGS.adminDashboard);
}

function mapErr(err: unknown): string {
  if (err instanceof ApiError || err instanceof Error) return err.message;
  return "UNKNOWN_ERROR";
}
