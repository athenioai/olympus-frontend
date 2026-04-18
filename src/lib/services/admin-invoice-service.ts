import { authFetch } from "./auth-fetch";
import { unwrapEnvelope } from "@/lib/api-envelope";
import type {
  AdminInvoicePublic,
  AdminInvoiceSummary,
} from "./interfaces/admin-types";
import type {
  CreateInvoicePayload,
  IAdminInvoiceService,
} from "./interfaces/admin-invoice-service";

class AdminInvoiceService implements IAdminInvoiceService {
  async create(payload: CreateInvoicePayload): Promise<AdminInvoicePublic> {
    const response = await authFetch("/admin/invoices", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return unwrapEnvelope<AdminInvoicePublic>(response);
  }

  async list(): Promise<readonly AdminInvoicePublic[]> {
    const response = await authFetch("/admin/invoices", { cache: "no-store" });
    return unwrapEnvelope<readonly AdminInvoicePublic[]>(response);
  }

  async getById(id: string): Promise<AdminInvoicePublic> {
    const response = await authFetch(
      `/admin/invoices/${encodeURIComponent(id)}`,
      { cache: "no-store" },
    );
    return unwrapEnvelope<AdminInvoicePublic>(response);
  }

  async getDashboard(): Promise<AdminInvoiceSummary> {
    const response = await authFetch("/admin/invoices/dashboard", {
      cache: "no-store",
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
