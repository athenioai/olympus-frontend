// src/lib/services/interfaces/subscriptions-service.ts
import type { SubscriptionStatus } from "./admin-types";

export type PaymentStatus = "pending" | "confirmed" | "overdue" | "refunded";

export interface SubscriptionPlan {
  readonly id: string;
  readonly name: string;
  readonly cost: number;
}

export interface PendingPlanChange {
  readonly toPlanId: string;
  readonly toPlanName: string;
  /** ISO 8601 — when the downgrade kicks in. */
  readonly effectiveAt: string;
}

/** User-facing snapshot of the caller's own subscription. */
export interface MySubscription {
  readonly subscriptionId: string;
  readonly plan: SubscriptionPlan;
  readonly status: SubscriptionStatus;
  readonly currentPeriodEnd: string;
  readonly nextPaymentAt: string | null;
  /** ISO 8601 — last moment the user can request a refund. */
  readonly refundEligibleUntil: string;
  readonly pendingChange: PendingPlanChange | null;
  readonly cancelAtPeriodEnd: boolean;
}

export interface MyPayment {
  readonly id: string;
  readonly amount: number;
  readonly status: PaymentStatus;
  /** YYYY-MM-DD. */
  readonly dueDate: string;
  readonly paidAt: string | null;
  readonly refundedAt: string | null;
  readonly invoiceUrl: string | null;
}

export interface SubscribeResponse {
  readonly subscriptionId: string;
  readonly asaasInvoiceUrl: string;
}

export interface ISubscriptionsService {
  getMe(): Promise<MySubscription>;
  listMyPayments(): Promise<readonly MyPayment[]>;
  subscribe(planId: string): Promise<SubscribeResponse>;
  upgrade(planId: string): Promise<MySubscription>;
  downgrade(planId: string): Promise<MySubscription>;
  cancel(reason?: string): Promise<MySubscription>;
  refundRequest(reason: string): Promise<void>;
}
