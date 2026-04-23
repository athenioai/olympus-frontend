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

const idSchema = z.string().uuid();

export async function uploadAgentAvatarAction(
  formData: FormData,
): Promise<AvatarActionResult> {
  const guard = await requireAdmin();
  if (!guard.ok) return { success: false, error: guard.error };

  const file = formData.get("file");
  const sortOrderRaw = formData.get("sortOrder");

  if (!(file instanceof File) || file.size === 0) {
    return { success: false, error: "FILE_REQUIRED" };
  }

  const sortOrder =
    typeof sortOrderRaw === "string" && sortOrderRaw.trim() !== ""
      ? Number.parseInt(sortOrderRaw, 10)
      : undefined;

  try {
    const data = await adminAgentAvatarService.create({
      file,
      ...(sortOrder !== undefined && !Number.isNaN(sortOrder) ? { sortOrder } : {}),
    });
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

// Map of backend error codes to friendly pt-BR messages. Keep in sync with
// the admin-avatars contract. AVATAR_UPLOAD_001 is the consolidated code
// that replaced the earlier split (MIME/SIZE/CONTENT), but the split ones
// stay here for backwards compatibility with older backend builds.
const FRIENDLY_ERRORS: Record<string, string> = {
  AVATAR_LIMIT_EXCEEDED_001:
    "Limite de 10 avatares ativos atingido. Exclua um antes de adicionar outro.",
  AVATAR_UPLOAD_001: "Falha ao enviar imagem. Tente novamente.",
  AVATAR_STORAGE_001: "Não foi possível salvar o avatar. Tente novamente.",
  AVATAR_MIME_001: "Formato não suportado. Envie um PNG, JPEG ou WebP.",
  AVATAR_SIZE_001: "Imagem muito grande. O limite é 5MB.",
  AVATAR_CONTENT_001: "Arquivo corrompido ou não condiz com o tipo declarado.",
  AVATAR_NOT_FOUND_001: "Avatar não encontrado.",
  NOT_FOUND: "Avatar não encontrado.",
  FORBIDDEN: "Você não tem permissão para esta ação.",
};

const GENERIC_ERROR =
  "Não foi possível completar a operação. Tente novamente.";

function mapErr(err: unknown): string {
  captureUnexpected(err);
  const isDev = process.env.NODE_ENV !== "production";

  if (err instanceof ApiError) {
    const friendly = FRIENDLY_ERRORS[err.code] ?? err.message;
    if (!FRIENDLY_ERRORS[err.code]) {
      console.error("[avatar-upload] unmapped ApiError", {
        code: err.code,
        message: err.message,
        status: err.status,
      });
    }
    return isDev ? `Erro (${err.code}): ${friendly}` : friendly;
  }
  if (err instanceof Error) {
    const friendly = FRIENDLY_ERRORS[err.message];
    if (friendly) return friendly;
    console.error("[avatar-upload] unmapped Error", {
      message: err.message,
      stack: err.stack,
    });
    return isDev ? `Erro: ${err.message}` : GENERIC_ERROR;
  }
  console.error("[avatar-upload] non-Error thrown", err);
  return GENERIC_ERROR;
}
