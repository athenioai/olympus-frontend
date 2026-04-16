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

export interface DailyDataPoint {
  readonly date: string;
  readonly value: number;
}

export interface TodayAppointment {
  readonly id: string;
  readonly leadName: string;
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
  readonly requirePrepayment: boolean;
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
  updatePrepaymentSetting(requirePrepayment: boolean): Promise<PrepaymentSetting>;
}
