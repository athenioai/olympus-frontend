import { authFetch } from "./auth-fetch";
import { unwrapEnvelope } from "@/lib/api-envelope";
import type {
  BusinessException,
  CreateExceptionPayload,
  IBusinessExceptionService,
  ListBusinessExceptionsParams,
  PaginatedBusinessExceptions,
  UpdateExceptionPayload,
} from "./interfaces/business-exception-service";

class BusinessExceptionService implements IBusinessExceptionService {
  // Settings reads bypass the Data Cache — see business-profile-service.
  async list(
    params?: ListBusinessExceptionsParams,
  ): Promise<PaginatedBusinessExceptions> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set("page", String(params.page));
    if (params?.limit) searchParams.set("limit", String(params.limit));
    if (params?.type) searchParams.set("type", params.type);
    if (params?.dateFrom) searchParams.set("dateFrom", params.dateFrom);
    if (params?.dateTo) searchParams.set("dateTo", params.dateTo);

    const query = searchParams.toString();
    const path = query ? `/business-exceptions?${query}` : "/business-exceptions";

    const response = await authFetch(path, {
      cache: "no-store",
    });
    return unwrapEnvelope<PaginatedBusinessExceptions>(response);
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
