"use server";

import { z } from "zod";
import { revalidatePath, updateTag } from "next/cache";
import { ApiError } from "@/lib/api-envelope";
import { CACHE_TAGS } from "@/lib/cache-config";
import { financeService } from "@/lib/services";
import { captureUnexpected } from "@/lib/observability/capture";
import type {
  CreateCatalogPayload,
  Service,
  Product,
} from "@/lib/services";

function invalidateCatalogCaches(): void {
  updateTag(CACHE_TAGS.services);
  updateTag(CACHE_TAGS.products);
}

const FRIENDLY_ERRORS: Record<string, string> = {
  CATALOG_ACCESS_001: "Seu plano não dá acesso a esta área.",
  CATALOG_DUPLICATE_001: "Já existe um item com este nome.",
  CATALOG_NOT_FOUND_001: "Item não encontrado.",
  AVATAR_MIME_001: "Formato de imagem não suportado. Envie um PNG, JPEG ou WebP.",
  AVATAR_SIZE_001: "Imagem muito grande. O limite é 5MB.",
  AVATAR_CONTENT_001: "Arquivo corrompido ou não condiz com o tipo declarado.",
  AVATAR_UPLOAD_001: "Falha ao enviar imagem. Tente novamente.",
};

const GENERIC_ERROR =
  "Não foi possível completar a operação. Tente novamente.";

function catalogErrorMessage(err: unknown): string {
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

// ---------------------------------------------------------------------------
// Shared types
// ---------------------------------------------------------------------------

interface ActionResult<T = undefined> {
  readonly success: boolean;
  readonly error?: string;
  readonly data?: T;
}

// ---------------------------------------------------------------------------
// Image validation (magic bytes)
// ---------------------------------------------------------------------------

const MAGIC_BYTES: Record<string, number[]> = {
  "image/jpeg": [0xff, 0xd8, 0xff],
  "image/png": [0x89, 0x50, 0x4e, 0x47],
  "image/webp": [0x52, 0x49, 0x46, 0x46],
};

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB

/**
 * Validate that a file's first bytes match a known image format.
 * @param file - The file to validate
 * @returns Whether the file matches JPEG, PNG, or WebP magic bytes
 */
async function validateImageMagicBytes(file: File): Promise<boolean> {
  const buffer = await file.slice(0, 8).arrayBuffer();
  const bytes = new Uint8Array(buffer);
  return Object.values(MAGIC_BYTES).some((magic) =>
    magic.every((byte, i) => bytes[i] === byte),
  );
}

// ---------------------------------------------------------------------------
// Validation schemas
// ---------------------------------------------------------------------------

const serviceSchema = z.object({
  name: z
    .string()
    .min(1, "Nome é obrigatório.")
    .max(255, "Nome deve ter no máximo 255 caracteres."),
  description: z
    .string()
    .max(2000, "Descrição deve ter no máximo 2000 caracteres.")
    .optional(),
  price: z.coerce
    .number({ message: "Preço inválido." })
    .min(0, "O preço não pode ser negativo.")
    .max(999_999.99, "O preço máximo é R$ 999.999,99."),
  agentInstructions: z
    .string()
    .max(2000, "Instruções devem ter no máximo 2000 caracteres.")
    .optional(),
});

const productSchema = serviceSchema;

const uuidSchema = z.string().uuid();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Extract and validate an optional image file from FormData.
 * @param formData - The form data containing an optional "image" field
 * @returns Error string if validation fails, null if valid or absent
 */
async function validateImageFromFormData(
  formData: FormData,
): Promise<string | null> {
  const image = formData.get("image");
  if (!image || !(image instanceof File) || image.size === 0) {
    return null;
  }

  if (image.size > MAX_IMAGE_SIZE) {
    return "A imagem deve ter no máximo 5MB.";
  }

  const validMagic = await validateImageMagicBytes(image);
  if (!validMagic) {
    return "A imagem deve ser JPEG, PNG ou WebP.";
  }

  return null;
}

/**
 * Build a JSON payload for the catalog service from validated fields.
 */
function buildCatalogPayload(
  fields: z.infer<typeof serviceSchema>,
): CreateCatalogPayload {
  return {
    name: fields.name,
    price: fields.price,
    ...(fields.description ? { description: fields.description } : {}),
    ...(fields.agentInstructions
      ? { agentInstructions: fields.agentInstructions }
      : {}),
  };
}

/**
 * Extract the image file from FormData when the user picked one. Returns null
 * when the "image" field is absent or empty so callers can skip the upload.
 */
function getImageFile(formData: FormData): File | null {
  const image = formData.get("image");
  if (!(image instanceof File) || image.size === 0) return null;
  return image;
}

// ---------------------------------------------------------------------------
// Service actions
// ---------------------------------------------------------------------------

/**
 * Create a new service via the finance service.
 * @param formData - Form data with name, price, description, agentInstructions, image
 * @returns Action result with the created service or error
 */
export async function createService(
  formData: FormData,
): Promise<ActionResult<Service>> {
  const raw = {
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    price: formData.get("price"),
    agentInstructions: formData.get("agentInstructions") || undefined,
  };

  const parsed = serviceSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message };
  }

  const imageError = await validateImageFromFormData(formData);
  if (imageError) {
    return { success: false, error: imageError };
  }

  try {
    const imageFile = getImageFile(formData);
    const data = await financeService.createService(
      buildCatalogPayload(parsed.data),
      imageFile ?? undefined,
    );
    invalidateCatalogCaches();
    revalidatePath("/services");
    return { success: true, data };
  } catch (err) {
    return { success: false, error: catalogErrorMessage(err) };
  }
}

/**
 * Update an existing service.
 * @param id - UUID of the service to update
 * @param formData - Form data with fields to update
 * @returns Action result with the updated service or error
 */
export async function updateService(
  id: string,
  formData: FormData,
): Promise<ActionResult<Service>> {
  const idResult = uuidSchema.safeParse(id);
  if (!idResult.success) {
    return { success: false, error: "ID de serviço inválido." };
  }

  const raw = {
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    price: formData.get("price"),
    agentInstructions: formData.get("agentInstructions") || undefined,
  };

  const parsed = serviceSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message };
  }

  const imageError = await validateImageFromFormData(formData);
  if (imageError) {
    return { success: false, error: imageError };
  }

  try {
    let data = await financeService.updateService(
      id,
      buildCatalogPayload(parsed.data),
    );
    const imageFile = getImageFile(formData);
    if (imageFile) {
      data = await financeService.uploadServiceImage(id, imageFile);
    }
    invalidateCatalogCaches();
    revalidatePath("/services");
    return { success: true, data };
  } catch (err) {
    return { success: false, error: catalogErrorMessage(err) };
  }
}

/**
 * Delete a service by ID.
 * @param id - UUID of the service to delete
 * @returns Action result indicating success or error
 */
export async function deleteService(
  id: string,
): Promise<ActionResult> {
  const idResult = uuidSchema.safeParse(id);
  if (!idResult.success) {
    return { success: false, error: "ID de serviço inválido." };
  }

  try {
    await financeService.deleteService(id);
    invalidateCatalogCaches();
    revalidatePath("/services");
    return { success: true };
  } catch (err) {
    return { success: false, error: catalogErrorMessage(err) };
  }
}

/**
 * Toggle a service's active status.
 * @param id - UUID of the service
 * @param active - New active state
 * @returns Action result indicating success or error
 */
export async function toggleServiceStatus(
  id: string,
  active: boolean,
): Promise<ActionResult> {
  const idResult = uuidSchema.safeParse(id);
  if (!idResult.success) {
    return { success: false, error: "ID de serviço inválido." };
  }

  try {
    await financeService.updateService(id, { active });
    invalidateCatalogCaches();
    revalidatePath("/services");
    return { success: true };
  } catch (err) {
    return { success: false, error: catalogErrorMessage(err) };
  }
}

// ---------------------------------------------------------------------------
// Product actions
// ---------------------------------------------------------------------------

/**
 * Create a new product via the finance service.
 * @param formData - Form data with name, price, description, agentInstructions, image
 * @returns Action result with the created product or error
 */
export async function createProduct(
  formData: FormData,
): Promise<ActionResult<Product>> {
  const raw = {
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    price: formData.get("price"),
    agentInstructions: formData.get("agentInstructions") || undefined,
  };

  const parsed = productSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message };
  }

  const imageError = await validateImageFromFormData(formData);
  if (imageError) {
    return { success: false, error: imageError };
  }

  try {
    const imageFile = getImageFile(formData);
    const data = await financeService.createProduct(
      buildCatalogPayload(parsed.data),
      imageFile ?? undefined,
    );
    invalidateCatalogCaches();
    revalidatePath("/products");
    return { success: true, data };
  } catch (err) {
    return { success: false, error: catalogErrorMessage(err) };
  }
}

/**
 * Update an existing product.
 * @param id - UUID of the product to update
 * @param formData - Form data with fields to update
 * @returns Action result with the updated product or error
 */
export async function updateProduct(
  id: string,
  formData: FormData,
): Promise<ActionResult<Product>> {
  const idResult = uuidSchema.safeParse(id);
  if (!idResult.success) {
    return { success: false, error: "Invalid product ID." };
  }

  const raw = {
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    price: formData.get("price"),
    agentInstructions: formData.get("agentInstructions") || undefined,
  };

  const parsed = productSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message };
  }

  const imageError = await validateImageFromFormData(formData);
  if (imageError) {
    return { success: false, error: imageError };
  }

  try {
    let data = await financeService.updateProduct(
      id,
      buildCatalogPayload(parsed.data),
    );
    const imageFile = getImageFile(formData);
    if (imageFile) {
      data = await financeService.uploadProductImage(id, imageFile);
    }
    invalidateCatalogCaches();
    revalidatePath("/products");
    return { success: true, data };
  } catch (err) {
    return { success: false, error: catalogErrorMessage(err) };
  }
}

/**
 * Delete a product by ID.
 * @param id - UUID of the product to delete
 * @returns Action result indicating success or error
 */
export async function deleteProduct(
  id: string,
): Promise<ActionResult> {
  const idResult = uuidSchema.safeParse(id);
  if (!idResult.success) {
    return { success: false, error: "Invalid product ID." };
  }

  try {
    await financeService.deleteProduct(id);
    invalidateCatalogCaches();
    revalidatePath("/products");
    return { success: true };
  } catch (err) {
    return { success: false, error: catalogErrorMessage(err) };
  }
}
