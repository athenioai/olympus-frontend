export interface Service {
  readonly id: string;
  readonly name: string;
  readonly description: string | null;
  readonly price: number;
  readonly pixDiscountPercent: number;
  readonly cardDiscountPercent: number;
  readonly specialDiscountName: string | null;
  readonly specialDiscountPercent: number;
  readonly specialDiscountStartsAt: string | null;
  readonly specialDiscountEndsAt: string | null;
  readonly imageUrl: string | null;
  readonly agentInstructions: string | null;
  readonly active: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export type Product = Service;

export interface Invoice {
  readonly id: string;
  readonly leadId: string;
  readonly type: "service" | "product" | "manual";
  readonly referenceId: string | null;
  readonly description: string;
  readonly amount: number;
  readonly paymentMethod: "pix" | "card" | null;
  readonly discountPercent: number;
  readonly finalAmount: number;
  readonly status:
    | "pending"
    | "sent"
    | "paid"
    | "overdue"
    | "cancelled";
  readonly dueDate: string;
  readonly paidAt: string | null;
  readonly lateFeePercent: number;
  readonly lateInterestType: "simple" | "compound";
  readonly lateInterestPercent: number;
  readonly appointmentId: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface FinanceDashboard {
  readonly revenueThisMonth: number;
  readonly pendingAmount: number;
  readonly overdueAmount: number;
  readonly averageTicket: number;
  readonly byType: {
    readonly service: number;
    readonly product: number;
    readonly manual: number;
  };
  readonly conversationsThisMonth: number;
  readonly appointmentsThisMonth: number;
  readonly appointmentsCancelledThisMonth: number;
  readonly leadsThisMonth: number;
  readonly conversionRate: number;
  readonly dailyRevenue: ReadonlyArray<{
    readonly date: string;
    readonly amount: number;
  }>;
  readonly planCost: number;
  readonly roi: number | null;
}

export interface Pagination {
  readonly page: number;
  readonly limit: number;
  readonly total: number;
}

export interface PaginatedResponse<T> {
  readonly data: T[];
  readonly pagination: Pagination;
}

export interface ListServicesParams {
  readonly page?: number;
  readonly limit?: number;
  readonly search?: string;
}

export type ListProductsParams = ListServicesParams;

export interface PrepaymentSetting {
  readonly enabled: boolean;
}

export interface IFinanceService {
  listServices(
    params?: ListServicesParams,
  ): Promise<PaginatedResponse<Service>>;
  createService(formData: FormData): Promise<Service>;
  updateService(id: string, formData: FormData): Promise<Service>;
  deleteService(id: string): Promise<void>;
  listProducts(
    params?: ListProductsParams,
  ): Promise<PaginatedResponse<Product>>;
  createProduct(formData: FormData): Promise<Product>;
  updateProduct(id: string, formData: FormData): Promise<Product>;
  deleteProduct(id: string): Promise<void>;
  getFinanceDashboard(): Promise<FinanceDashboard>;
  getPrepaymentSetting(): Promise<PrepaymentSetting>;
  updatePrepaymentSetting(enabled: boolean): Promise<PrepaymentSetting>;
}
