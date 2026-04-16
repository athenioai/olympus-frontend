"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { financeService } from "@/lib/services";
import type { Service, Product } from "@/lib/services";

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
  name: z.string().min(1).max(255),
  description: z.string().max(2000).optional(),
  price: z.coerce.number().min(0).max(999_999.99),
  agentInstructions: z.string().max(2000).optional(),
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
    return "Image must be under 5MB.";
  }

  const validMagic = await validateImageMagicBytes(image);
  if (!validMagic) {
    return "Image must be JPEG, PNG, or WebP.";
  }

  return null;
}

/**
 * Build a FormData payload for the finance service from validated fields.
 * @param fields - Validated schema fields
 * @param rawFormData - Original FormData (for the image file)
 * @returns FormData ready for the finance service
 */
function buildServiceFormData(
  fields: z.infer<typeof serviceSchema>,
  rawFormData: FormData,
): FormData {
  const fd = new FormData();
  fd.set("name", fields.name);
  if (fields.description) fd.set("description", fields.description);
  fd.set("price", String(fields.price));
  if (fields.agentInstructions) {
    fd.set("agentInstructions", fields.agentInstructions);
  }

  const image = rawFormData.get("image");
  if (image instanceof File && image.size > 0) {
    fd.set("image", image);
  }

  return fd;
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
    const fd = buildServiceFormData(parsed.data, formData);
    const data = await financeService.createService(fd);
    revalidatePath("/services");
    return { success: true, data };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: message };
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
    return { success: false, error: "Invalid service ID." };
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
    const fd = buildServiceFormData(parsed.data, formData);
    const data = await financeService.updateService(id, fd);
    revalidatePath("/services");
    return { success: true, data };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: message };
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
    return { success: false, error: "Invalid service ID." };
  }

  try {
    await financeService.deleteService(id);
    revalidatePath("/services");
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: message };
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
    return { success: false, error: "Invalid service ID." };
  }

  try {
    const fd = new FormData();
    fd.set("active", String(active));
    await financeService.updateService(id, fd);
    revalidatePath("/services");
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: message };
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
    const fd = buildServiceFormData(parsed.data, formData);
    const data = await financeService.createProduct(fd);
    revalidatePath("/products");
    return { success: true, data };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: message };
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
    const fd = buildServiceFormData(parsed.data, formData);
    const data = await financeService.updateProduct(id, fd);
    revalidatePath("/products");
    return { success: true, data };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: message };
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
    revalidatePath("/products");
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: message };
  }
}
