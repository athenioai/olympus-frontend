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

export interface IAdminSubscriptionService {
  create(payload: CreateSubscriptionPayload): Promise<SubscriptionPublic>;
  list(): Promise<readonly SubscriptionPublic[]>;
  getById(id: string): Promise<SubscriptionPublic>;
  update(
    id: string,
    payload: UpdateSubscriptionPayload,
  ): Promise<SubscriptionPublic>;
}
