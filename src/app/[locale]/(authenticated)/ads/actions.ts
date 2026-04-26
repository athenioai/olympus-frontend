"use server";

import { z } from "zod";
import { revalidatePath, updateTag } from "next/cache";
import { ApiError } from "@/lib/api-envelope";
import { CACHE_TAGS } from "@/lib/cache-config";
import { adsService } from "@/lib/services";
import { captureUnexpected } from "@/lib/observability/capture";
import type {
  Ad,
  AdItemRef,
  CreateAdPayload,
  UpdateAdPayload,
} from "@/lib/services";

const FRIENDLY_ERRORS: Record<string, string> = {
  AD_ITEM_NOT_FOUND_001:
    "Item não encontrado ou não pertence à sua conta.",
  AD_NOT_FOUND_001: "Anúncio não encontrado.",
};

const GENERIC_ERROR =
  "Não foi possível completar a operação. Tente novamente.";

function adsErrorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    const friendly = FRIENDLY_ERRORS[err.code];
    if (friendly) return friendly;
    if (err.details.length > 0) {
      const [first] = err.details;
      return `${first.field}: ${first.message}`;
    }
    return GENERIC_ERROR;
  }
  captureUnexpected(err);
  return GENERIC_ERROR;
}

interface ActionResult<T = undefined> {
  readonly success: boolean;
  readonly error?: string;
  readonly data?: T;
}

/** Loose UUID check — Zod 4's .uuid() enforces version/variant nibbles. */
const uuidSchema = z
  .string()
  .regex(
    /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/,
    "ID inválido.",
  );

/** Accept any RFC-4122-shaped hex string (Zod 4 .uuid() enforces version nibble). */
const looseUuid = z
  .string()
  .regex(
    /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/,
    "ID de item inválido.",
  );

const itemRefSchema = z.object({
  type: z.enum(["service", "product"], {
    message: "Tipo de item inválido.",
  }),
  id: looseUuid,
});

const itemsSchema = z
  .array(itemRefSchema)
  .max(50, "Você pode vincular no máximo 50 itens por anúncio.");

const isoDatetime = z
  .string()
  .datetime({ message: "Data inválida." })
  .or(z.literal(""))
  .transform((v) => (v === "" ? null : v));

const baseFieldsSchema = z.object({
  name: z
    .string()
    .min(1, "Nome é obrigatório.")
    .max(255, "Nome deve ter no máximo 255 caracteres."),
  content: z
    .string()
    .min(1, "Conteúdo é obrigatório.")
    .max(5000, "Conteúdo deve ter no máximo 5000 caracteres."),
  platform: z
    .string()
    .min(1, "Plataforma é obrigatória.")
    .max(64, "Plataforma deve ter no máximo 64 caracteres."),
  validFrom: isoDatetime.nullable().optional(),
  validTo: isoDatetime.nullable().optional(),
});

function parseItemsField(raw: FormDataEntryValue | null): AdItemRef[] | null {
  if (raw === null) return null;
  if (typeof raw !== "string" || raw.trim() === "") return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("Itens inválidos.");
  }
  const result = itemsSchema.safeParse(parsed);
  if (!result.success) {
    const firstIssue = result.error.issues[0];
    throw new Error(firstIssue?.message ?? "Itens inválidos.");
  }
  return [...result.data];
}

function invalidateAdsCache(): void {
  updateTag(CACHE_TAGS.ads);
}

/**
 * Create an ad (with optional catalog item links).
 * @param formData - name, content, platform, validFrom?, validTo?, active?, items? (JSON-encoded array)
 * @returns Action result with the created ad or a friendly error message
 */
export async function createAd(
  formData: FormData,
): Promise<ActionResult<Ad>> {
  const raw = {
    name: formData.get("name"),
    content: formData.get("content"),
    platform: formData.get("platform"),
    validFrom: formData.get("validFrom") ?? "",
    validTo: formData.get("validTo") ?? "",
  };
  const parsed = baseFieldsSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message };
  }

  let items: AdItemRef[] | null;
  try {
    items = parseItemsField(formData.get("items"));
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Itens inválidos.",
    };
  }

  const activeRaw = formData.get("active");
  const active = activeRaw === null ? undefined : activeRaw === "true";

  const payload: CreateAdPayload = {
    name: parsed.data.name,
    content: parsed.data.content,
    platform: parsed.data.platform,
    ...(parsed.data.validFrom !== undefined
      ? { validFrom: parsed.data.validFrom }
      : {}),
    ...(parsed.data.validTo !== undefined
      ? { validTo: parsed.data.validTo }
      : {}),
    ...(active !== undefined ? { active } : {}),
    ...(items !== null ? { items } : {}),
  };

  try {
    const data = await adsService.createAd(payload);
    invalidateAdsCache();
    revalidatePath("/ads");
    return { success: true, data };
  } catch (err) {
    return { success: false, error: adsErrorMessage(err) };
  }
}

/**
 * Update an existing ad. Honors the v2 replace-strategy on `items`:
 * the form encodes intent in `itemsState`:
 *   - "preserve" → omit items from payload (default in edit mode)
 *   - "replace"  → send items as JSON-encoded array (possibly empty)
 *
 * @param id - UUID of the ad to update
 * @param formData - validated ad fields plus itemsState + optional items JSON
 */
export async function updateAd(
  id: string,
  formData: FormData,
): Promise<ActionResult<Ad>> {
  const idResult = uuidSchema.safeParse(id);
  if (!idResult.success) {
    return { success: false, error: "ID de anúncio inválido." };
  }

  const raw = {
    name: formData.get("name"),
    content: formData.get("content"),
    platform: formData.get("platform"),
    validFrom: formData.get("validFrom") ?? "",
    validTo: formData.get("validTo") ?? "",
  };
  const parsed = baseFieldsSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message };
  }

  const itemsState = formData.get("itemsState");
  let items: AdItemRef[] | null = null;
  if (itemsState === "replace") {
    try {
      items = parseItemsField(formData.get("items")) ?? [];
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Itens inválidos.",
      };
    }
  }

  const activeRaw = formData.get("active");
  const active = activeRaw === null ? undefined : activeRaw === "true";

  const payload: UpdateAdPayload = {
    name: parsed.data.name,
    content: parsed.data.content,
    platform: parsed.data.platform,
    ...(parsed.data.validFrom !== undefined
      ? { validFrom: parsed.data.validFrom }
      : {}),
    ...(parsed.data.validTo !== undefined
      ? { validTo: parsed.data.validTo }
      : {}),
    ...(active !== undefined ? { active } : {}),
    ...(itemsState === "replace" ? { items: items ?? [] } : {}),
  };

  try {
    const data = await adsService.updateAd(id, payload);
    invalidateAdsCache();
    revalidatePath("/ads");
    return { success: true, data };
  } catch (err) {
    return { success: false, error: adsErrorMessage(err) };
  }
}

/**
 * Toggle an ad's active flag. Sends only `active` so existing items stay intact.
 * @param id - UUID of the ad
 * @param active - desired active state
 */
export async function toggleAdStatus(
  id: string,
  active: boolean,
): Promise<ActionResult> {
  const idResult = uuidSchema.safeParse(id);
  if (!idResult.success) {
    return { success: false, error: "ID de anúncio inválido." };
  }
  try {
    await adsService.updateAd(id, { active });
    invalidateAdsCache();
    revalidatePath("/ads");
    return { success: true };
  } catch (err) {
    return { success: false, error: adsErrorMessage(err) };
  }
}

/**
 * Delete an ad. Backend cascades item links automatically.
 * @param id - UUID of the ad
 */
export async function deleteAd(id: string): Promise<ActionResult> {
  const idResult = uuidSchema.safeParse(id);
  if (!idResult.success) {
    return { success: false, error: "ID de anúncio inválido." };
  }
  try {
    await adsService.deleteAd(id);
    invalidateAdsCache();
    revalidatePath("/ads");
    return { success: true };
  } catch (err) {
    return { success: false, error: adsErrorMessage(err) };
  }
}
