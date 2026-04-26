// src/lib/services/interfaces/admin-refunds-service.ts
export type RefundRequestStatus = "pending" | "approved" | "rejected";

export interface RefundRequestPublic {
  readonly id: string;
  readonly subscriptionId: string;
  readonly userId: string;
  readonly userName: string;
  readonly userEmail: string;
  readonly reason: string;
  readonly status: RefundRequestStatus;
  readonly reviewedBy: string | null;
  readonly reviewedAt: string | null;
  readonly reviewerNotes: string | null;
  readonly asaasRefundId: string | null;
  readonly createdAt: string;
}

export interface ListRefundRequestsParams {
  readonly status?: RefundRequestStatus;
}

export interface IAdminRefundsService {
  list(
    params?: ListRefundRequestsParams,
  ): Promise<readonly RefundRequestPublic[]>;
  approve(id: string, notes?: string): Promise<RefundRequestPublic>;
  /** `notes` is required by the backend (rejection reason shown to the user). */
  reject(id: string, notes: string): Promise<RefundRequestPublic>;
}
