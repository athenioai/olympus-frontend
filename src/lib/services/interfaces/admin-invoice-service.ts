import type {
  AdminInvoicePublic,
  AdminInvoiceStatus,
  AdminInvoiceSummary,
  LateInterestType,
} from "./admin-types";

export interface CreateInvoicePayload {
  readonly userId: string;
  readonly subscriptionId?: string;
  readonly amount: number;
  readonly description?: string;
  readonly dueDate: string;
  readonly lateFeePercent?: number;
  readonly lateInterestType?: LateInterestType;
  readonly lateInterestPercent?: number;
}

export interface ListAdminInvoicesParams {
  readonly page?: number;
  readonly limit?: number;
  readonly status?: AdminInvoiceStatus;
  readonly userId?: string;
  readonly dueDateFrom?: string;
  readonly dueDateTo?: string;
}

export interface PaginatedAdminInvoices {
  readonly items: readonly AdminInvoicePublic[];
  readonly total: number;
  readonly page: number;
  readonly limit: number;
}

export interface IAdminInvoiceService {
  create(payload: CreateInvoicePayload): Promise<AdminInvoicePublic>;
  list(params?: ListAdminInvoicesParams): Promise<PaginatedAdminInvoices>;
  getById(id: string): Promise<AdminInvoicePublic>;
  getDashboard(): Promise<AdminInvoiceSummary>;
  markPaid(id: string): Promise<AdminInvoicePublic>;
  cancel(id: string): Promise<AdminInvoicePublic>;
}
