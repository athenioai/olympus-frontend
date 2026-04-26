export type AdItemType = "service" | "product";

export interface AdItemRef {
  readonly type: AdItemType;
  readonly id: string;
}

export interface AdItem {
  readonly type: AdItemType;
  readonly id: string;
  readonly name: string;
  readonly price: number;
}

export interface AdPublic {
  readonly id: string;
  readonly name: string;
  readonly content: string;
  readonly active: boolean;
  readonly platform: string;
  readonly items: readonly AdItem[];
  readonly validFrom: string | null;
  readonly validTo: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export type Ad = AdPublic;

export interface CreateAdPayload {
  readonly name: string;
  readonly content: string;
  readonly platform: string;
  readonly active?: boolean;
  readonly validFrom?: string | null;
  readonly validTo?: string | null;
  readonly items?: readonly AdItemRef[];
}

export interface UpdateAdPayload {
  readonly name?: string;
  readonly content?: string;
  readonly platform?: string;
  readonly active?: boolean;
  readonly validFrom?: string | null;
  readonly validTo?: string | null;
  /**
   * Replace-strategy:
   * - field omitted (key absent) → preserve existing links
   * - `[]` → clear all links
   * - `[refs]` → replace with this list
   * Never send `null`: backend Zod rejects it.
   */
  readonly items?: readonly AdItemRef[];
}

export interface ListAdsParams {
  readonly page?: number;
  readonly limit?: number;
  readonly search?: string;
  readonly active?: boolean;
}

export interface IAdsService {
  /**
   * Backend currently returns a flat array (no pagination envelope).
   * Query params are still accepted but the response is `Ad[]`.
   */
  listAds(params?: ListAdsParams): Promise<readonly Ad[]>;
  getAd(id: string): Promise<Ad>;
  createAd(payload: CreateAdPayload): Promise<Ad>;
  updateAd(id: string, payload: UpdateAdPayload): Promise<Ad>;
  deleteAd(id: string): Promise<void>;
}
