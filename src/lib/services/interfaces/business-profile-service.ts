export type ServiceModality = "presencial" | "remoto" | "domicilio" | "hibrido";
export type SocialPlatform = "website" | "instagram" | "google_reviews" | "facebook" | "linkedin" | "youtube" | "tiktok";
export type ScoreTier = "none" | "bronze" | "silver" | "gold" | "diamond";
export type WorkType = "services" | "sales" | "hybrid";

export interface BusinessProfile {
  readonly userId: string;
  readonly businessName: string;
  readonly businessDescription: string;
  readonly workType: WorkType;
  readonly serviceModality: ServiceModality;
  readonly paymentPolicy: string;
  readonly cancellationPolicy: string;
  readonly differentials: string | null;
  readonly cnpj: string | null;
  readonly legalName: string | null;
  readonly foundedYear: number | null;
  readonly businessVertical: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface BusinessAddress {
  readonly street: string;
  readonly neighborhood: string | null;
  readonly city: string;
  readonly state: string;
}

export interface BusinessSocialLink {
  readonly id: string;
  readonly platform: SocialPlatform;
  readonly url: string;
}

export interface BusinessServiceArea {
  readonly id: string;
  readonly name: string;
}

export interface ScoreResult {
  readonly score: number;
  readonly maxScore: number;
  readonly percentage: number;
  readonly tier: ScoreTier;
  readonly missingRequired: readonly string[];
  readonly canConnectChannel: boolean;
}

export interface BusinessProfileView {
  readonly profile: BusinessProfile | null;
  readonly address: BusinessAddress | null;
  readonly socialLinks: readonly BusinessSocialLink[];
  readonly serviceAreas: readonly BusinessServiceArea[];
  readonly score: ScoreResult;
}

export interface UpdateBusinessProfilePayload {
  readonly businessName?: string;
  readonly businessDescription?: string;
  readonly workType?: WorkType;
  readonly serviceModality?: ServiceModality;
  readonly paymentPolicy?: string;
  readonly cancellationPolicy?: string;
  readonly differentials?: string | null;
  readonly cnpj?: string | null;
  readonly legalName?: string | null;
  readonly foundedYear?: number | null;
  readonly businessVertical?: string;
}

export interface UpdateAddressPayload {
  readonly street: string;
  readonly neighborhood?: string | null;
  readonly city: string;
  readonly state: string;
}

export interface CreateSocialLinkPayload {
  readonly platform: SocialPlatform;
  readonly url: string;
}

export interface CreateServiceAreaPayload {
  readonly name: string;
}

export interface IBusinessProfileService {
  getProfile(): Promise<BusinessProfileView>;
  getScore(): Promise<ScoreResult>;
  updateProfile(payload: UpdateBusinessProfilePayload): Promise<BusinessProfile>;
  updateAddress(payload: UpdateAddressPayload): Promise<BusinessProfileView>;
  deleteAddress(): Promise<void>;
  addSocialLink(payload: CreateSocialLinkPayload): Promise<BusinessSocialLink>;
  removeSocialLink(platform: SocialPlatform): Promise<void>;
  addServiceArea(payload: CreateServiceAreaPayload): Promise<BusinessServiceArea>;
  removeServiceArea(id: string): Promise<void>;
}
