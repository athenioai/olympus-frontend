import { authFetch } from "./auth-fetch";
import { unwrapEnvelope } from "@/lib/api-envelope";
import { CACHE_TIMES, CACHE_TAGS } from "@/lib/cache-config";
import type {
  BusinessVertical,
  IBusinessVerticalService,
} from "./interfaces/business-vertical-service";

class BusinessVerticalService implements IBusinessVerticalService {
  async list(): Promise<readonly BusinessVertical[]> {
    const response = await authFetch("/business-verticals", {
      revalidate: CACHE_TIMES.businessVerticals,
      tags: [CACHE_TAGS.businessVerticals],
    });
    return unwrapEnvelope<readonly BusinessVertical[]>(response);
  }
}

export const businessVerticalService = new BusinessVerticalService();
