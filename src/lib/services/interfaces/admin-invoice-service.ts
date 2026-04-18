import type {
  AdminInvoicePublic,
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

export interface IAdminInvoiceService {
  create(payload: CreateInvoicePayload): Promise<AdminInvoicePublic>;
  list(): Promise<readonly AdminInvoicePublic[]>;
  getById(id: string): Promise<AdminInvoicePublic>;
  getDashboard(): Promise<AdminInvoiceSummary>;
  markPaid(id: string): Promise<AdminInvoicePublic>;
  cancel(id: string): Promise<AdminInvoicePublic>;
}
