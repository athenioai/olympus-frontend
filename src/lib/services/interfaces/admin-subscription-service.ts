import type { SubscriptionPublic, SubscriptionStatus } from "./admin-types";

export interface CreateSubscriptionPayload {
  readonly userId: string;
  readonly planId: string;
  readonly billingDay: number;
}

export interface UpdateSubscriptionPayload {
  readonly planId?: string;
  readonly billingDay?: number;
  readonly status?: SubscriptionStatus;
}

export interface ListAdminSubscriptionsParams {
  readonly page?: number;
  readonly limit?: number;
  readonly status?: SubscriptionStatus;
  readonly planId?: string;
  readonly userId?: string;
  readonly billingDay?: number;
}

export interface PaginatedAdminSubscriptions {
  readonly items: readonly SubscriptionPublic[];
  readonly total: number;
  readonly page: number;
  readonly limit: number;
}

export interface IAdminSubscriptionService {
  create(payload: CreateSubscriptionPayload): Promise<SubscriptionPublic>;
  list(
    params?: ListAdminSubscriptionsParams,
  ): Promise<PaginatedAdminSubscriptions>;
  getById(id: string): Promise<SubscriptionPublic>;
  update(
    id: string,
    payload: UpdateSubscriptionPayload,
  ): Promise<SubscriptionPublic>;
}
