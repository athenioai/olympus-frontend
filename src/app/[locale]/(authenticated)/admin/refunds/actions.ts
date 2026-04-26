"use server";

import { z } from "zod";
import { revalidatePath, updateTag } from "next/cache";
import { ApiError } from "@/lib/api-envelope";
import { CACHE_TAGS } from "@/lib/cache-config";
import { requireAdmin } from "@/lib/auth/require-admin";
import { adminRefundsService } from "@/lib/services";
import { captureUnexpected } from "@/lib/observability/capture";

const FRIENDLY_ERRORS: Record<string, string> = {
  REFUND_REQUEST_NOT_FOUND_001: "Solicitação não encontrada.",
  REFUND_REQUEST_PENDING_001: "Esta solicitação já não está pendente.",
  BILLING_GATEWAY_001: "Falha temporária no Asaas. Tente novamente.",
  BILLING_GATEWAY_002: "O Asaas rejeitou o estorno.",
  GENERAL_VALIDATION_001:
    "Não há pagamento confirmado para estornar.",
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

interface ActionResult {
  readonly success: boolean;
  readonly error?: string;
}

const UUID_REGEX =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
const uuid = z.string().regex(UUID_REGEX, "ID inválido.");
const optionalNotes = z
  .string()
  .max(2000, "Máximo 2000 caracteres.")
  .optional();
const requiredNotes = z
  .string()
  .min(1, "Motivo obrigatório.")
  .max(2000, "Máximo 2000 caracteres.");

function invalidate(): void {
  updateTag(CACHE_TAGS.refunds);
  revalidatePath("/admin/refunds");
}

export async function approveRefund(
  id: string,
  formData: FormData,
): Promise<ActionResult> {
  const guard = await requireAdmin();
  if (!guard.ok) return { success: false, error: guard.error };

  if (!uuid.safeParse(id).success) {
    return { success: false, error: "ID de solicitação inválido." };
  }
  const raw = formData.get("notes");
  const notes =
    typeof raw === "string" && raw.trim() !== "" ? raw.trim() : undefined;
  const parsed = optionalNotes.safeParse(notes);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message };
  }
  try {
    await adminRefundsService.approve(id, parsed.data);
    invalidate();
    return { success: true };
  } catch (err) {
    return { success: false, error: errorMessage(err) };
  }
}

export async function rejectRefund(
  id: string,
  formData: FormData,
): Promise<ActionResult> {
  const guard = await requireAdmin();
  if (!guard.ok) return { success: false, error: guard.error };

  if (!uuid.safeParse(id).success) {
    return { success: false, error: "ID de solicitação inválido." };
  }
  const raw = formData.get("notes");
  const parsed = requiredNotes.safeParse(
    typeof raw === "string" ? raw.trim() : "",
  );
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message };
  }
  try {
    await adminRefundsService.reject(id, parsed.data);
    invalidate();
    return { success: true };
  } catch (err) {
    return { success: false, error: errorMessage(err) };
  }
}
