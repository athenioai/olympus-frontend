// src/lib/services/subscriptions-service.ts
import { authFetch } from "./auth-fetch";
import { unwrapEnvelope } from "@/lib/api-envelope";
import type {
  ISubscriptionsService,
  MyPayment,
  MySubscription,
  SubscribeResponse,
} from "./interfaces/subscriptions-service";

class SubscriptionsService implements ISubscriptionsService {
  /** Subscription detail is hot — bypass the Data Cache. */
  async getMe(): Promise<MySubscription> {
    const response = await authFetch("/subscriptions/me", { cache: "no-store" });
    return unwrapEnvelope<MySubscription>(response);
  }

  async listMyPayments(): Promise<readonly MyPayment[]> {
    const response = await authFetch("/subscriptions/me/payments", {
      cache: "no-store",
    });
    return unwrapEnvelope<readonly MyPayment[]>(response);
  }

  async subscribe(planId: string, cpfCnpj: string): Promise<SubscribeResponse> {
    const response = await authFetch("/subscriptions/subscribe", {
      method: "POST",
      body: JSON.stringify({ planId, cpfCnpj }),
    });
    return unwrapEnvelope<SubscribeResponse>(response);
  }

  async upgrade(planId: string): Promise<MySubscription> {
    const response = await authFetch("/subscriptions/upgrade", {
      method: "POST",
      body: JSON.stringify({ planId }),
    });
    return unwrapEnvelope<MySubscription>(response);
  }

  async downgrade(planId: string): Promise<MySubscription> {
    const response = await authFetch("/subscriptions/downgrade", {
      method: "POST",
      body: JSON.stringify({ planId }),
    });
    return unwrapEnvelope<MySubscription>(response);
  }

  async cancel(reason?: string): Promise<MySubscription> {
    const body = reason ? { reason } : {};
    const response = await authFetch("/subscriptions/cancel", {
      method: "POST",
      body: JSON.stringify(body),
    });
    return unwrapEnvelope<MySubscription>(response);
  }

  async refundRequest(reason: string): Promise<void> {
    const response = await authFetch("/subscriptions/refund-request", {
      method: "POST",
      body: JSON.stringify({ reason }),
    });
    await unwrapEnvelope<unknown>(response);
  }
}

export const subscriptionsService = new SubscriptionsService();
