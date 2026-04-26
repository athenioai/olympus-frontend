// src/lib/services/admin-refunds-service.ts
import { authFetch } from "./auth-fetch";
import { unwrapEnvelope } from "@/lib/api-envelope";
import { CACHE_TAGS, CACHE_TIMES } from "@/lib/cache-config";
import type {
  IAdminRefundsService,
  ListRefundRequestsParams,
  RefundRequestPublic,
} from "./interfaces/admin-refunds-service";

function buildQuery(params?: ListRefundRequestsParams): string {
  const search = new URLSearchParams();
  if (params?.status) search.set("status", params.status);
  return search.toString();
}

class AdminRefundsService implements IAdminRefundsService {
  async list(
    params?: ListRefundRequestsParams,
  ): Promise<readonly RefundRequestPublic[]> {
    const query = buildQuery(params);
    const path = query ? `/admin/refunds?${query}` : "/admin/refunds";
    const response = await authFetch(path, {
      revalidate: CACHE_TIMES.refunds,
      tags: [CACHE_TAGS.refunds],
    });
    return unwrapEnvelope<readonly RefundRequestPublic[]>(response);
  }

  async approve(id: string, notes?: string): Promise<RefundRequestPublic> {
    const body = notes ? { notes } : {};
    const response = await authFetch(
      `/admin/refunds/${encodeURIComponent(id)}/approve`,
      { method: "POST", body: JSON.stringify(body) },
    );
    return unwrapEnvelope<RefundRequestPublic>(response);
  }

  async reject(id: string, notes: string): Promise<RefundRequestPublic> {
    const response = await authFetch(
      `/admin/refunds/${encodeURIComponent(id)}/reject`,
      { method: "POST", body: JSON.stringify({ notes }) },
    );
    return unwrapEnvelope<RefundRequestPublic>(response);
  }
}

export const adminRefundsService = new AdminRefundsService();
