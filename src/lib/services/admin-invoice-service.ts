import { authFetch } from "./auth-fetch";
import { unwrapEnvelope } from "@/lib/api-envelope";
import { CACHE_TAGS, CACHE_TIMES } from "@/lib/cache-config";
import type {
  AdminInvoicePublic,
  AdminInvoiceSummary,
} from "./interfaces/admin-types";
import type {
  CreateInvoicePayload,
  IAdminInvoiceService,
  ListAdminInvoicesParams,
  PaginatedAdminInvoices,
} from "./interfaces/admin-invoice-service";

class AdminInvoiceService implements IAdminInvoiceService {
  async create(payload: CreateInvoicePayload): Promise<AdminInvoicePublic> {
    const response = await authFetch("/admin/invoices", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return unwrapEnvelope<AdminInvoicePublic>(response);
  }

  async list(
    params?: ListAdminInvoicesParams,
  ): Promise<PaginatedAdminInvoices> {
    const query = new URLSearchParams();
    if (params?.page !== undefined) query.set("page", String(params.page));
    if (params?.limit !== undefined) query.set("limit", String(params.limit));
    if (params?.status) query.set("status", params.status);
    if (params?.userId) query.set("userId", params.userId);
    if (params?.dueDateFrom) query.set("dueDateFrom", params.dueDateFrom);
    if (params?.dueDateTo) query.set("dueDateTo", params.dueDateTo);
    const qs = query.toString();
    const response = await authFetch(
      qs ? `/admin/invoices?${qs}` : "/admin/invoices",
      {
        revalidate: CACHE_TIMES.adminInvoices,
        tags: [CACHE_TAGS.adminInvoices],
      },
    );
    return unwrapEnvelope<PaginatedAdminInvoices>(response);
  }

  async getById(id: string): Promise<AdminInvoicePublic> {
    const response = await authFetch(
      `/admin/invoices/${encodeURIComponent(id)}`,
      {
        revalidate: CACHE_TIMES.adminInvoices,
        tags: [CACHE_TAGS.adminInvoices],
      },
    );
    return unwrapEnvelope<AdminInvoicePublic>(response);
  }

  async getDashboard(): Promise<AdminInvoiceSummary> {
    const response = await authFetch("/admin/invoices/dashboard", {
      revalidate: CACHE_TIMES.adminInvoices,
      tags: [CACHE_TAGS.adminInvoiceSummary],
    });
    return unwrapEnvelope<AdminInvoiceSummary>(response);
  }

  async markPaid(id: string): Promise<AdminInvoicePublic> {
    const response = await authFetch(
      `/admin/invoices/${encodeURIComponent(id)}/mark-paid`,
      { method: "PATCH" },
    );
    return unwrapEnvelope<AdminInvoicePublic>(response);
  }

  async cancel(id: string): Promise<AdminInvoicePublic> {
    const response = await authFetch(
      `/admin/invoices/${encodeURIComponent(id)}/cancel`,
      { method: "PATCH" },
    );
    return unwrapEnvelope<AdminInvoicePublic>(response);
  }
}

export const adminInvoiceService = new AdminInvoiceService();
