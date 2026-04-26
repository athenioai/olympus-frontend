import { authFetch } from "./auth-fetch";
import { unwrapEnvelope } from "@/lib/api-envelope";
import { CACHE_TAGS, CACHE_TIMES } from "@/lib/cache-config";
import type {
  Ad,
  CreateAdPayload,
  IAdsService,
  ListAdsParams,
  PaginatedAds,
  UpdateAdPayload,
} from "./interfaces/ads-service";

function buildAdsQuery(params?: ListAdsParams): string {
  const search = new URLSearchParams();
  if (params?.page) search.set("page", String(params.page));
  if (params?.limit) search.set("limit", String(params.limit));
  if (params?.search) search.set("search", params.search);
  if (params?.active !== undefined) search.set("active", String(params.active));
  return search.toString();
}

class AdsService implements IAdsService {
  async listAds(params?: ListAdsParams): Promise<PaginatedAds> {
    const query = buildAdsQuery(params);
    const path = query ? `/ads?${query}` : "/ads";
    const response = await authFetch(path, {
      revalidate: CACHE_TIMES.ads,
      tags: [CACHE_TAGS.ads],
    });
    return unwrapEnvelope<PaginatedAds>(response);
  }

  async getAd(id: string): Promise<Ad> {
    const response = await authFetch(`/ads/${encodeURIComponent(id)}`, {
      revalidate: CACHE_TIMES.ads,
      tags: [CACHE_TAGS.ads],
    });
    return unwrapEnvelope<Ad>(response);
  }

  async createAd(payload: CreateAdPayload): Promise<Ad> {
    const response = await authFetch("/ads", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return unwrapEnvelope<Ad>(response);
  }

  async updateAd(id: string, payload: UpdateAdPayload): Promise<Ad> {
    const response = await authFetch(`/ads/${encodeURIComponent(id)}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
    return unwrapEnvelope<Ad>(response);
  }

  async deleteAd(id: string): Promise<void> {
    const response = await authFetch(`/ads/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    await unwrapEnvelope<unknown>(response);
  }
}

export const adsService = new AdsService();
