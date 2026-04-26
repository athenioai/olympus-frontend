import type { SubscriptionPublic, SubscriptionStatus } from "./admin-types";

/**
 * Manual override of subscription status (support tooling). Use only after
 * reconciling with Asaas — backend will not push to gateway as part of this
 * call.
 */
export interface UpdateSubscriptionStatusPayload {
  readonly status: SubscriptionStatus;
}

export interface ListAdminSubscriptionsParams {
  readonly page?: number;
  readonly limit?: number;
  readonly status?: SubscriptionStatus;
  readonly planId?: string;
  readonly userId?: string;
}

export interface PaginatedAdminSubscriptions {
  readonly items: readonly SubscriptionPublic[];
  readonly total: number;
  readonly page: number;
  readonly limit: number;
}

/**
 * Admin-side facade over `/admin/subscriptions`. Subscribe / upgrade /
 * downgrade / cancel all act on a target user; the response is the resulting
 * `SubscriptionPublic` (or void for cancel which only mutates state).
 */
export interface IAdminSubscriptionService {
  list(
    params?: ListAdminSubscriptionsParams,
  ): Promise<PaginatedAdminSubscriptions>;
  getById(id: string): Promise<SubscriptionPublic>;
  /** Force a status — support escape hatch. */
  updateStatus(
    id: string,
    payload: UpdateSubscriptionStatusPayload,
  ): Promise<SubscriptionPublic>;
  subscribe(userId: string, planId: string): Promise<SubscriptionPublic>;
  upgrade(userId: string, planId: string): Promise<SubscriptionPublic>;
  downgrade(userId: string, planId: string): Promise<SubscriptionPublic>;
  cancel(userId: string): Promise<SubscriptionPublic>;
}
