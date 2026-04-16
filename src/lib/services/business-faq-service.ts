import { authFetch } from "./auth-fetch";
import { unwrapEnvelope } from "@/lib/api-envelope";
import { CACHE_TIMES, CACHE_TAGS } from "@/lib/cache-config";
import type {
  BusinessFaq,
  CreateFaqPayload,
  IBusinessFaqService,
  UpdateFaqPayload,
} from "./interfaces/business-faq-service";

class BusinessFaqService implements IBusinessFaqService {
  async list(): Promise<BusinessFaq[]> {
    const response = await authFetch("/business-faqs", {
      revalidate: CACHE_TIMES.settings,
      tags: [CACHE_TAGS.businessFaqs],
    });
    return unwrapEnvelope<BusinessFaq[]>(response);
  }

  async create(payload: CreateFaqPayload): Promise<BusinessFaq> {
    const response = await authFetch("/business-faqs", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return unwrapEnvelope<BusinessFaq>(response);
  }

  async update(id: string, payload: UpdateFaqPayload): Promise<BusinessFaq> {
    const response = await authFetch(`/business-faqs/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
    return unwrapEnvelope<BusinessFaq>(response);
  }

  async remove(id: string): Promise<void> {
    const response = await authFetch(`/business-faqs/${id}`, {
      method: "DELETE",
    });
    await unwrapEnvelope<unknown>(response);
  }
}

export const businessFaqService = new BusinessFaqService();
