import { authFetch } from "./auth-fetch";
import { unwrapEnvelope } from "@/lib/api-envelope";
import { CACHE_TIMES, CACHE_TAGS } from "@/lib/cache-config";
import type {
  BusinessException,
  CreateExceptionPayload,
  IBusinessExceptionService,
  UpdateExceptionPayload,
} from "./interfaces/business-exception-service";

class BusinessExceptionService implements IBusinessExceptionService {
  async list(params?: { from?: string; to?: string }): Promise<BusinessException[]> {
    const searchParams = new URLSearchParams();
    if (params?.from) searchParams.set("from", params.from);
    if (params?.to) searchParams.set("to", params.to);

    const query = searchParams.toString();
    const path = query ? `/business-exceptions?${query}` : "/business-exceptions";

    const response = await authFetch(path, {
      revalidate: CACHE_TIMES.settings,
      tags: [CACHE_TAGS.businessExceptions],
    });
    return unwrapEnvelope<BusinessException[]>(response);
  }

  async create(payload: CreateExceptionPayload): Promise<BusinessException> {
    const response = await authFetch("/business-exceptions", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return unwrapEnvelope<BusinessException>(response);
  }

  async update(id: string, payload: UpdateExceptionPayload): Promise<BusinessException> {
    const response = await authFetch(`/business-exceptions/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
    return unwrapEnvelope<BusinessException>(response);
  }

  async remove(id: string): Promise<void> {
    const response = await authFetch(`/business-exceptions/${id}`, {
      method: "DELETE",
    });
    await unwrapEnvelope<unknown>(response);
  }
}

export const businessExceptionService = new BusinessExceptionService();
