import { cookies } from "next/headers";
import { authFetch } from "./auth-fetch";
import { ApiError, unwrapEnvelope } from "@/lib/api-envelope";
import { CACHE_TIMES, CACHE_TAGS } from "@/lib/cache-config";
import { API_URL } from "@/lib/env";
import type {
  CreateCatalogPayload,
  FinanceDashboard,
  IFinanceService,
  ListProductsParams,
  ListServicesParams,
  PaginatedResponse,
  PrepaymentSetting,
  Product,
  Service,
  UpdateCatalogPayload,
} from "./interfaces/finance-service";

/**
 * Build a query string from optional params.
 * @param params - Optional search/pagination params
 * @returns URL query string (without leading "?") or empty string
 */
function buildSearchQuery(
  params?: ListServicesParams,
): string {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.set("page", String(params.page));
  if (params?.limit) searchParams.set("limit", String(params.limit));
  if (params?.search) searchParams.set("search", params.search);
  if (params?.active !== undefined) {
    searchParams.set("active", String(params.active));
  }
  if (params?.priceMin !== undefined) {
    searchParams.set("priceMin", String(params.priceMin));
  }
  if (params?.priceMax !== undefined) {
    searchParams.set("priceMax", String(params.priceMax));
  }
  if (params?.hasSpecialDiscount !== undefined) {
    searchParams.set("hasSpecialDiscount", String(params.hasSpecialDiscount));
  }
  if (params?.hasImage !== undefined) {
    searchParams.set("hasImage", String(params.hasImage));
  }
  return searchParams.toString();
}

class FinanceService implements IFinanceService {
  /**
   * List services with optional filtering and pagination.
   * @param params - Optional filters: page, limit, search
   * @returns Paginated list of services
   * @throws Error if the request fails
   */
  async listServices(
    params?: ListServicesParams,
  ): Promise<PaginatedResponse<Service>> {
    const query = buildSearchQuery(params);
    const path = query ? `/services?${query}` : "/services";

    const response = await authFetch(path, {
      revalidate: CACHE_TIMES.services,
      tags: [CACHE_TAGS.services],
    });
    return unwrapEnvelope<PaginatedResponse<Service>>(response);
  }

  async createService(
    payload: CreateCatalogPayload,
    file?: File,
  ): Promise<Service> {
    if (file) {
      return createCatalogMultipart<Service>("services", payload, file);
    }
    const response = await authFetch("/services", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return unwrapEnvelope<Service>(response);
  }

  async updateService(
    id: string,
    payload: UpdateCatalogPayload,
  ): Promise<Service> {
    const response = await authFetch(`/services/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
    return unwrapEnvelope<Service>(response);
  }

  async deleteService(id: string): Promise<void> {
    const response = await authFetch(`/services/${id}`, {
      method: "DELETE",
    });
    await unwrapEnvelope<unknown>(response);
  }

  async uploadServiceImage(id: string, file: File): Promise<Service> {
    return uploadCatalogImage("services", id, file);
  }

  async deleteServiceImage(id: string): Promise<Service> {
    const response = await authFetch(`/services/${id}/image`, {
      method: "DELETE",
    });
    return unwrapEnvelope<Service>(response);
  }

  /**
   * List products with optional filtering and pagination.
   * @param params - Optional filters: page, limit, search
   * @returns Paginated list of products
   * @throws Error if the request fails
   */
  async listProducts(
    params?: ListProductsParams,
  ): Promise<PaginatedResponse<Product>> {
    const query = buildSearchQuery(params);
    const path = query ? `/products?${query}` : "/products";

    const response = await authFetch(path, {
      revalidate: CACHE_TIMES.products,
      tags: [CACHE_TAGS.products],
    });
    return unwrapEnvelope<PaginatedResponse<Product>>(response);
  }

  async createProduct(
    payload: CreateCatalogPayload,
    file?: File,
  ): Promise<Product> {
    if (file) {
      return createCatalogMultipart<Product>("products", payload, file);
    }
    const response = await authFetch("/products", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return unwrapEnvelope<Product>(response);
  }

  async updateProduct(
    id: string,
    payload: UpdateCatalogPayload,
  ): Promise<Product> {
    const response = await authFetch(`/products/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
    return unwrapEnvelope<Product>(response);
  }

  async deleteProduct(id: string): Promise<void> {
    const response = await authFetch(`/products/${id}`, {
      method: "DELETE",
    });
    await unwrapEnvelope<unknown>(response);
  }

  async uploadProductImage(id: string, file: File): Promise<Product> {
    return uploadCatalogImage("products", id, file);
  }

  async deleteProductImage(id: string): Promise<Product> {
    const response = await authFetch(`/products/${id}/image`, {
      method: "DELETE",
    });
    return unwrapEnvelope<Product>(response);
  }

  /**
   * Get the finance dashboard with aggregated metrics.
   * @returns Finance dashboard data
   * @throws Error if the request fails
   */
  async getFinanceDashboard(): Promise<FinanceDashboard> {
    const response = await authFetch("/dashboard", {
      revalidate: CACHE_TIMES.dashboard,
      tags: [CACHE_TAGS.dashboard],
    });
    return unwrapEnvelope<FinanceDashboard>(response);
  }

  /**
   * Get the current prepayment setting.
   * @returns Prepayment setting with enabled flag
   * @throws Error if the request fails
   */
  async getPrepaymentSetting(): Promise<PrepaymentSetting> {
    const response = await authFetch("/settings/prepayment", {
      revalidate: CACHE_TIMES.settings,
      tags: [CACHE_TAGS.prepayment],
    });
    return unwrapEnvelope<PrepaymentSetting>(response);
  }

  /**
   * Update the prepayment setting.
   * @param enabled - Whether prepayment is required
   * @returns Updated prepayment setting
   * @throws Error if the request fails
   */
  async updatePrepaymentSetting(
    requirePrepayment: boolean,
  ): Promise<PrepaymentSetting> {
    const response = await authFetch("/settings/prepayment", {
      method: "PATCH",
      body: JSON.stringify({ requirePrepayment }),
    });
    return unwrapEnvelope<PrepaymentSetting>(response);
  }
}

/**
 * Atomic create with image in a single multipart request. Every field of the
 * JSON payload is serialized as a string — the backend coerces numeric and
 * date fields on the way in. Same endpoint as the JSON path (POST /services
 * or /products), switched by Content-Type.
 */
async function createCatalogMultipart<T>(
  resource: "services" | "products",
  payload: CreateCatalogPayload,
  file: File,
): Promise<T> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("access_token")?.value;
  if (!accessToken) {
    throw new ApiError("NOT_AUTHENTICATED", "AUTH_TOKEN_003", 401);
  }
  const formData = new FormData();
  formData.append("file", file);
  for (const [key, value] of Object.entries(payload)) {
    if (value === undefined || value === null) continue;
    formData.append(key, String(value));
  }
  const response = await fetch(`${API_URL}/${resource}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: formData,
  });
  return unwrapEnvelope<T>(response);
}

/**
 * Multipart upload of a catalog item image. authFetch would force JSON
 * Content-Type — multipart precludes that, so we attach the Bearer token
 * manually and bypass the wrapper.
 */
async function uploadCatalogImage<T>(
  resource: "services" | "products",
  id: string,
  file: File,
): Promise<T> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("access_token")?.value;
  if (!accessToken) {
    throw new ApiError("NOT_AUTHENTICATED", "AUTH_TOKEN_003", 401);
  }
  const formData = new FormData();
  formData.append("file", file);
  const response = await fetch(
    `${API_URL}/${resource}/${encodeURIComponent(id)}/image`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
      body: formData,
    },
  );
  return unwrapEnvelope<T>(response);
}

export const financeService = new FinanceService();
