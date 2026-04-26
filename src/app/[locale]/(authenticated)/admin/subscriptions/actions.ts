"use server";

import { z } from "zod";
import { revalidatePath, updateTag } from "next/cache";
import { ApiError } from "@/lib/api-envelope";
import { CACHE_TAGS } from "@/lib/cache-config";
import { requireAdmin } from "@/lib/auth/require-admin";
import { adminSubscriptionService } from "@/lib/services";
import { captureUnexpected } from "@/lib/observability/capture";
import type {
  SubscriptionPublic,
  SubscriptionStatus,
} from "@/lib/services";

const FRIENDLY_ERRORS: Record<string, string> = {
  SUB_NOT_FOUND_001: "Assinatura não encontrada.",
  SUB_ACTIVE_001: "Este usuário já possui assinatura ativa.",
  SUBSCRIPTION_NOT_ACTIVE_001: "A assinatura precisa estar ativa.",
  INVALID_PLAN_CHANGE_001: "Mudança de plano inválida.",
  PLAN_NOT_FOUND_001: "Plano não encontrado.",
  BILLING_GATEWAY_001: "Falha temporária no gateway. Tente novamente.",
  BILLING_GATEWAY_002: "O gateway rejeitou os dados.",
  BUSINESS_DOCUMENT_REQUIRED_001: "Preencha seu CPF ou CNPJ.",
  BUSINESS_DOCUMENT_INVALID_001: "CPF ou CNPJ inválido.",
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

export interface SubscriptionActionResult<T = undefined> {
  readonly success: boolean;
  readonly error?: string;
  readonly data?: T;
}

const uuid = z.string().uuid("ID inválido.");
const statusSchema = z.enum([
  "active",
  "past_due",
  "suspended",
  "cancelled",
  "ended",
  "refunded",
]);

function invalidate(): void {
  updateTag(CACHE_TAGS.adminSubscriptions);
  revalidatePath("/admin/subscriptions");
}

function normalizeCpfCnpj(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const digits = raw.replace(/\D/g, "");
  if (digits.length !== 11 && digits.length !== 14) return null;
  return digits;
}

export async function subscribeUserAction(
  userId: string,
  planId: string,
  cpfCnpj: string,
): Promise<SubscriptionActionResult<SubscriptionPublic>> {
  const guard = await requireAdmin();
  if (!guard.ok) return { success: false, error: guard.error };

  if (!uuid.safeParse(userId).success) {
    return { success: false, error: "ID de usuário inválido." };
  }
  if (!uuid.safeParse(planId).success) {
    return { success: false, error: "ID de plano inválido." };
  }
  const normalized = normalizeCpfCnpj(cpfCnpj);
  if (normalized === null) {
    return { success: false, error: "CPF ou CNPJ inválido." };
  }
  try {
    const data = await adminSubscriptionService.subscribe(userId, planId, normalized);
    invalidate();
    return { success: true, data };
  } catch (err) {
    return { success: false, error: errorMessage(err) };
  }
}

export async function cancelUserAction(
  userId: string,
): Promise<SubscriptionActionResult<SubscriptionPublic>> {
  const guard = await requireAdmin();
  if (!guard.ok) return { success: false, error: guard.error };

  if (!uuid.safeParse(userId).success) {
    return { success: false, error: "ID de usuário inválido." };
  }
  try {
    const data = await adminSubscriptionService.cancel(userId);
    invalidate();
    return { success: true, data };
  } catch (err) {
    return { success: false, error: errorMessage(err) };
  }
}

export async function forceStatusAction(
  subscriptionId: string,
  status: SubscriptionStatus,
): Promise<SubscriptionActionResult<SubscriptionPublic>> {
  const guard = await requireAdmin();
  if (!guard.ok) return { success: false, error: guard.error };

  if (!uuid.safeParse(subscriptionId).success) {
    return { success: false, error: "ID de assinatura inválido." };
  }
  if (!statusSchema.safeParse(status).success) {
    return { success: false, error: "Status inválido." };
  }
  try {
    const data = await adminSubscriptionService.updateStatus(
      subscriptionId,
      { status },
    );
    invalidate();
    return { success: true, data };
  } catch (err) {
    return { success: false, error: errorMessage(err) };
  }
}
