"use server";

import { z } from "zod";
import { revalidatePath, updateTag } from "next/cache";
import { ApiError } from "@/lib/api-envelope";
import { CACHE_TAGS } from "@/lib/cache-config";
import { subscriptionsService } from "@/lib/services";
import { captureUnexpected } from "@/lib/observability/capture";
import type { MySubscription, SubscribeResponse } from "@/lib/services";

const FRIENDLY_ERRORS: Record<string, string> = {
  SUB_NOT_FOUND_001: "Assinatura não encontrada.",
  SUB_ACTIVE_001: "Você já possui uma assinatura ativa.",
  SUBSCRIPTION_NOT_ACTIVE_001:
    "Sua assinatura precisa estar ativa para esta operação.",
  INVALID_PLAN_CHANGE_001: "Mudança de plano inválida para esta operação.",
  PLAN_NOT_FOUND_001: "Plano não encontrado.",
  BILLING_GATEWAY_001:
    "Falha temporária no gateway de cobrança. Tente novamente em instantes.",
  BILLING_GATEWAY_002:
    "O gateway de cobrança rejeitou os dados. Verifique e tente de novo.",
  BUSINESS_DOCUMENT_REQUIRED_001: "Preencha seu CPF ou CNPJ.",
  BUSINESS_DOCUMENT_INVALID_001: "CPF ou CNPJ inválido.",
  REFUND_WINDOW_EXPIRED_001:
    "A janela de 15 dias para reembolso já expirou.",
  REFUND_REQUEST_PENDING_001:
    "Você já tem uma solicitação de reembolso em análise.",
};

const GENERIC_ERROR =
  "Não foi possível completar a operação. Tente novamente.";

function errorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    return FRIENDLY_ERRORS[err.code] ?? GENERIC_ERROR;
  }
  captureUnexpected(err);
  return GENERIC_ERROR;
}

interface ActionResult<T = undefined> {
  readonly success: boolean;
  readonly error?: string;
  readonly data?: T;
}

const UUID_REGEX =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
const uuid = z.string().regex(UUID_REGEX, "ID inválido.");

const reasonSchema = z
  .string()
  .min(10, "Motivo precisa ter no mínimo 10 caracteres.")
  .max(2000, "Motivo deve ter no máximo 2000 caracteres.");

const cancelReasonSchema = z
  .string()
  .max(500, "Motivo deve ter no máximo 500 caracteres.")
  .optional();

function invalidate(): void {
  updateTag(CACHE_TAGS.subscriptions);
  revalidatePath("/billing");
}

function normalizeCpfCnpj(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const digits = raw.replace(/\D/g, "");
  if (digits.length !== 11 && digits.length !== 14) return null;
  return digits;
}

export async function subscribePlan(
  planId: string,
  cpfCnpj: string,
): Promise<ActionResult<SubscribeResponse>> {
  if (!uuid.safeParse(planId).success) {
    return { success: false, error: "ID de plano inválido." };
  }
  const normalized = normalizeCpfCnpj(cpfCnpj);
  if (normalized === null) {
    return { success: false, error: "CPF ou CNPJ inválido." };
  }
  try {
    const data = await subscriptionsService.subscribe(planId, normalized);
    invalidate();
    return { success: true, data };
  } catch (err) {
    return { success: false, error: errorMessage(err) };
  }
}

export async function changePlan(
  action: "upgrade" | "downgrade",
  planId: string,
): Promise<ActionResult<MySubscription>> {
  if (!uuid.safeParse(planId).success) {
    return { success: false, error: "ID de plano inválido." };
  }
  try {
    const data =
      action === "upgrade"
        ? await subscriptionsService.upgrade(planId)
        : await subscriptionsService.downgrade(planId);
    invalidate();
    return { success: true, data };
  } catch (err) {
    return { success: false, error: errorMessage(err) };
  }
}

export async function cancelSubscription(
  formData: FormData,
): Promise<ActionResult<MySubscription>> {
  const raw = formData.get("reason");
  const reason =
    typeof raw === "string" && raw.trim() !== "" ? raw.trim() : undefined;
  const parsed = cancelReasonSchema.safeParse(reason);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message };
  }
  try {
    const data = await subscriptionsService.cancel(parsed.data);
    invalidate();
    return { success: true, data };
  } catch (err) {
    return { success: false, error: errorMessage(err) };
  }
}

export async function requestRefund(
  formData: FormData,
): Promise<ActionResult> {
  const raw = formData.get("reason");
  const parsed = reasonSchema.safeParse(typeof raw === "string" ? raw : "");
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message };
  }
  try {
    await subscriptionsService.refundRequest(parsed.data);
    invalidate();
    return { success: true };
  } catch (err) {
    return { success: false, error: errorMessage(err) };
  }
}

/**
 * Retrieve the invoice URL for the first overdue payment, if any.
 * Used by the global suspended banner to open the payment link.
 * @returns The invoice URL string, or null if none found
 */
export async function getOverdueInvoiceUrl(): Promise<string | null> {
  try {
    const payments = await subscriptionsService.listMyPayments();
    const overdue = payments.find((p) => p.status === "overdue");
    return overdue?.invoiceUrl ?? null;
  } catch {
    return null;
  }
}
