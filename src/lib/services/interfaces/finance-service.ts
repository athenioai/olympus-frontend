export interface ActiveSpecialDiscount {
  readonly name: string;
  readonly percent: number;
  /** ISO 8601 with timezone. */
  readonly startsAt: string;
  readonly endsAt: string;
}

export interface CatalogItemPublic {
  readonly id: string;
  readonly name: string;
  readonly description: string | null;
  readonly price: number;
  readonly imageUrl: string | null;
  readonly pixDiscount: number;
  readonly cardDiscount: number;
  /** Only present when a discount is active right now (startsAt ≤ now ≤ endsAt). */
  readonly specialDiscount: ActiveSpecialDiscount | null;
  /** Mirrors user_settings.requirePrepayment — same value across all items. */
  readonly requirePrepayment: boolean;
  readonly agentInstructions: string | null;
  readonly active: boolean;
  readonly createdAt: string;
}

export type Service = CatalogItemPublic;
export type Product = CatalogItemPublic;

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

export interface DailyDataPoint {
  readonly date: string;
  readonly value: number;
}

export interface TodayAppointment {
  readonly id: string;
  readonly lead: { readonly id: string; readonly name: string };
  readonly serviceName: string;
  readonly startTime: string;
  readonly endTime: string;
  readonly status: string;
}

export interface LeadToFollowUp {
  readonly id: string;
  readonly name: string;
  readonly channel: string;
  readonly status: string;
  readonly temperature: string;
  readonly daysSinceUpdate: number;
}

export interface PendingInvoiceDueSoon {
  readonly id: string;
  readonly leadName: string;
  readonly description: string;
  readonly finalAmount: number;
  readonly dueDate: string;
  readonly isOverdue: boolean;
}

export interface BestService {
  readonly serviceId: string;
  readonly serviceName: string;
  readonly revenue: number;
  readonly percentage: number;
}

export interface FinanceDashboard {
  // Momentum
  readonly revenueThisMonth: number;
  readonly revenueGrowth: number;
  readonly conversionRate: number;
  readonly averageTicket: number;

  // Urgency
  readonly hotLeadsWaiting: number;
  readonly overdueInvoices: number;
  readonly overdueAmount: number;
  readonly leadsGoneCold: number;

  // Today
  readonly todayAppointments: readonly TodayAppointment[];
  readonly leadsToFollowUp: readonly LeadToFollowUp[];
  readonly pendingInvoicesDueSoon: readonly PendingInvoiceDueSoon[];

  // Projection
  readonly revenueProjection: number;
  readonly bestService: BestService | null;

  // Funnel
  readonly leadFunnel: {
    readonly new?: number;
    readonly contacted?: number;
    readonly qualified?: number;
    readonly converted?: number;
    readonly lost?: number;
  };

  // Summary
  readonly totalLeads: number;
  readonly newLeadsThisMonth: number;
  readonly appointmentsThisMonth: number;
  readonly upcomingAppointments: number;
  readonly invoiceCount: number;
  readonly totalRevenue: number;
  readonly totalPending: number;
  readonly collectionRate: number;
  readonly roi: number;

  // Charts
  readonly charts: {
    readonly dailyRevenue: readonly DailyDataPoint[];
    readonly dailyNewLeads: readonly DailyDataPoint[];
    readonly dailyAppointments: readonly DailyDataPoint[];
  };
}

export interface PaginatedResponse<T> {
  readonly items: T[];
  readonly total: number;
  readonly page: number;
  readonly limit: number;
}

export interface ListCatalogParams {
  readonly page?: number;
  readonly limit?: number;
  readonly search?: string;
  readonly active?: boolean;
  readonly priceMin?: number;
  readonly priceMax?: number;
  readonly hasSpecialDiscount?: boolean;
  readonly hasImage?: boolean;
}

export type ListServicesParams = ListCatalogParams;
export type ListProductsParams = ListCatalogParams;

export interface PrepaymentSetting {
  readonly requirePrepayment: boolean;
}

export interface CreateCatalogPayload {
  readonly name: string;
  readonly description?: string;
  readonly price: number;
  readonly pixDiscountPercent?: number;
  readonly cardDiscountPercent?: number;
  readonly specialDiscountName?: string;
  readonly specialDiscountPercent?: number;
  readonly specialDiscountStartsAt?: string;
  readonly specialDiscountEndsAt?: string;
  readonly agentInstructions?: string;
}

export interface UpdateCatalogPayload {
  readonly name?: string;
  readonly description?: string;
  readonly price?: number;
  readonly pixDiscountPercent?: number;
  readonly cardDiscountPercent?: number;
  readonly specialDiscountName?: string;
  readonly specialDiscountPercent?: number;
  readonly specialDiscountStartsAt?: string | null;
  readonly specialDiscountEndsAt?: string | null;
  readonly agentInstructions?: string;
  readonly active?: boolean;
}

export interface IFinanceService {
  listServices(
    params?: ListServicesParams,
  ): Promise<PaginatedResponse<Service>>;
  createService(
    payload: CreateCatalogPayload,
    file?: File,
  ): Promise<Service>;
  updateService(id: string, payload: UpdateCatalogPayload): Promise<Service>;
  deleteService(id: string): Promise<void>;
  uploadServiceImage(id: string, file: File): Promise<Service>;
  deleteServiceImage(id: string): Promise<Service>;
  listProducts(
    params?: ListProductsParams,
  ): Promise<PaginatedResponse<Product>>;
  createProduct(
    payload: CreateCatalogPayload,
    file?: File,
  ): Promise<Product>;
  updateProduct(id: string, payload: UpdateCatalogPayload): Promise<Product>;
  deleteProduct(id: string): Promise<void>;
  uploadProductImage(id: string, file: File): Promise<Product>;
  deleteProductImage(id: string): Promise<Product>;
  getFinanceDashboard(): Promise<FinanceDashboard>;
  getPrepaymentSetting(): Promise<PrepaymentSetting>;
  updatePrepaymentSetting(requirePrepayment: boolean): Promise<PrepaymentSetting>;
}
