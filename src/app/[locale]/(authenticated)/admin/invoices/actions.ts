"use server";

import { revalidatePath, updateTag } from "next/cache";
import { z } from "zod";
import { ApiError } from "@/lib/api-envelope";
import { captureUnexpected } from "@/lib/observability/capture";
import { requireAdmin } from "@/lib/auth/require-admin";
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
  dueDate: z
    .string()
    .min(1)
    .refine(
      (value) => {
        const parsed = new Date(value);
        if (Number.isNaN(parsed.getTime())) return false;
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);
        return parsed.getTime() >= startOfToday.getTime();
      },
      { message: "DUE_DATE_IN_PAST" },
    ),
  lateFeePercent: z.number().min(0).max(100).optional(),
  lateInterestType: z.enum(["simple", "compound"]).optional(),
  lateInterestPercent: z.number().min(0).max(100).optional(),
});

const idSchema = z.string().uuid();

export async function createInvoiceAction(
  input: unknown,
): Promise<InvoiceActionResult> {
  const guard = await requireAdmin();
  if (!guard.ok) return { success: false, error: guard.error };

  const parsed = createSchema.safeParse(input);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? "INVALID_INPUT";
    return { success: false, error: firstError };
  }
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
  const guard = await requireAdmin();
  if (!guard.ok) return { success: false, error: guard.error };

  if (!idSchema.safeParse(id).success) {
    return { success: false, error: "INVALID_ID" };
  }
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
  const guard = await requireAdmin();
  if (!guard.ok) return { success: false, error: guard.error };

  if (!idSchema.safeParse(id).success) {
    return { success: false, error: "INVALID_ID" };
  }
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

// INVOICE_STATUS_001 (409, shipped in 96b62aa) replaces the old 400 for an
// illegal status transition. UI already hides markPaid/cancel on terminal
// states (QA Bug 43), but if someone triggers it anyway we surface the
// localized reason instead of the raw backend message.
const FRIENDLY_ERRORS: Record<string, string> = {
  INVOICE_STATUS_001: "Essa cobrança não pode mudar de status. Recarregue a lista e tente novamente.",
  NOT_FOUND: "Cobrança não encontrada.",
  FORBIDDEN: "Você não tem permissão para esta ação.",
  DUE_DATE_IN_PAST: "A data de vencimento não pode estar no passado.",
  INVALID_INPUT: "Dados inválidos. Revise e tente novamente.",
};

function mapErr(err: unknown): string {
  captureUnexpected(err);
  if (err instanceof ApiError) {
    return FRIENDLY_ERRORS[err.code] ?? "Não foi possível completar a operação. Tente novamente.";
  }
  if (err instanceof Error) {
    return FRIENDLY_ERRORS[err.message] ?? "Não foi possível completar a operação. Tente novamente.";
  }
  return "Não foi possível completar a operação. Tente novamente.";
}
