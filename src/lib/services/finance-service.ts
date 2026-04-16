import { authFetch } from "./auth-fetch";
import { unwrapEnvelope } from "@/lib/api-envelope";
import { CACHE_TIMES, CACHE_TAGS } from "@/lib/cache-config";
import type {
  FinanceDashboard,
  IFinanceService,
  ListProductsParams,
  ListServicesParams,
  PaginatedResponse,
  PrepaymentSetting,
  Product,
  Service,
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

  /**
   * Create a new service. Uses FormData for file upload support.
   * @param formData - Service data as FormData (supports image upload)
   * @returns The created service
   * @throws Error if validation fails or request fails
   */
  async createService(formData: FormData): Promise<Service> {
    const response = await authFetch("/services", {
      method: "POST",
      body: formData,
    });
    return unwrapEnvelope<Service>(response);
  }

  /**
   * Update an existing service. Uses FormData for file upload support.
   * @param id - The service ID to update
   * @param formData - Fields to update as FormData
   * @returns The updated service
   * @throws Error if the service is not found or request fails
   */
  async updateService(
    id: string,
    formData: FormData,
  ): Promise<Service> {
    const response = await authFetch(`/services/${id}`, {
      method: "PATCH",
      body: formData,
    });
    return unwrapEnvelope<Service>(response);
  }

  /**
   * Delete a service by ID.
   * @param id - The service ID to delete
   * @throws Error if the service is not found or request fails
   */
  async deleteService(id: string): Promise<void> {
    const response = await authFetch(`/services/${id}`, {
      method: "DELETE",
    });
    await unwrapEnvelope<unknown>(response);
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

  /**
   * Create a new product. Uses FormData for file upload support.
   * @param formData - Product data as FormData (supports image upload)
   * @returns The created product
   * @throws Error if validation fails or request fails
   */
  async createProduct(formData: FormData): Promise<Product> {
    const response = await authFetch("/products", {
      method: "POST",
      body: formData,
    });
    return unwrapEnvelope<Product>(response);
  }

  /**
   * Update an existing product. Uses FormData for file upload support.
   * @param id - The product ID to update
   * @param formData - Fields to update as FormData
   * @returns The updated product
   * @throws Error if the product is not found or request fails
   */
  async updateProduct(
    id: string,
    formData: FormData,
  ): Promise<Product> {
    const response = await authFetch(`/products/${id}`, {
      method: "PATCH",
      body: formData,
    });
    return unwrapEnvelope<Product>(response);
  }

  /**
   * Delete a product by ID.
   * @param id - The product ID to delete
   * @throws Error if the product is not found or request fails
   */
  async deleteProduct(id: string): Promise<void> {
    const response = await authFetch(`/products/${id}`, {
      method: "DELETE",
    });
    await unwrapEnvelope<unknown>(response);
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

export const financeService = new FinanceService();
