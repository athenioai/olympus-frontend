"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { ChevronDown, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type {
  BusinessAddress,
  BusinessProfile,
  SocialPlatform,
} from "@/lib/services";
import { saveExtrasAction, type SaveExtrasInput } from "../../actions";
import type { StepProps } from "../wizard";

const SOCIAL_PLATFORMS: readonly SocialPlatform[] = [
  "website",
  "instagram",
  "google_reviews",
  "facebook",
  "linkedin",
  "youtube",
  "tiktok",
];

interface AddressState {
  street: string;
  neighborhood: string;
  city: string;
  state: string;
}

interface SocialLinkDraft {
  readonly id: number;
  platform: SocialPlatform;
  url: string;
}

interface ServiceAreaDraft {
  readonly id: number;
  name: string;
}

interface CompanyState {
  cnpj: string;
  legalName: string;
  foundedYear: string;
  differentials: string;
}

const EMPTY_ADDRESS: AddressState = {
  street: "",
  neighborhood: "",
  city: "",
  state: "",
};

const EMPTY_COMPANY: CompanyState = {
  cnpj: "",
  legalName: "",
  foundedYear: "",
  differentials: "",
};

export function Step7Extras({ state, onAdvance, onBack }: StepProps) {
  const t = useTranslations("onboarding.step7");
  const tc = useTranslations("common");
  const tNav = useTranslations("onboarding");

  const modality = state.profileView?.profile?.serviceModality;
  const showAddress = modality !== "remoto";
  const showAreas =
    modality === "domicilio" || modality === "hibrido" || modality === "remoto";

  const [openSection, setOpenSection] = useState<string | null>("address");
  const [address, setAddress] = useState<AddressState>({
    ...EMPTY_ADDRESS,
    ...mapExistingAddress(state.profileView?.address),
  });
  const [socialLinks, setSocialLinks] = useState<SocialLinkDraft[]>([]);
  const [serviceAreas, setServiceAreas] = useState<ServiceAreaDraft[]>([]);
  const [company, setCompany] = useState<CompanyState>({
    ...EMPTY_COMPANY,
    ...mapExistingCompany(state.profileView?.profile),
  });
  const [isPending, startTransition] = useTransition();

  function buildInput(): SaveExtrasInput {
    const input: SaveExtrasInput = {};
    if (showAddress && address.street.trim() && address.city.trim() && address.state.trim()) {
      input.address = {
        street: address.street.trim(),
        city: address.city.trim(),
        state: address.state.trim().toUpperCase(),
        ...(address.neighborhood.trim()
          ? { neighborhood: address.neighborhood.trim() }
          : {}),
      };
    }
    const links = socialLinks
      .filter((l) => l.url.trim().length > 0)
      .map((l) => ({ platform: l.platform, url: l.url.trim() }));
    if (links.length) input.socialLinks = links;

    if (showAreas) {
      const areas = serviceAreas
        .filter((a) => a.name.trim().length > 0)
        .map((a) => ({ name: a.name.trim() }));
      if (areas.length) input.serviceAreas = areas;
    }

    const companyPayload: SaveExtrasInput["company"] = {};
    if (company.cnpj.trim()) companyPayload.cnpj = company.cnpj.trim();
    if (company.legalName.trim()) companyPayload.legalName = company.legalName.trim();
    if (company.foundedYear.trim()) {
      const year = Number.parseInt(company.foundedYear, 10);
      if (!Number.isNaN(year)) companyPayload.foundedYear = year;
    }
    if (company.differentials.trim()) {
      companyPayload.differentials = company.differentials.trim();
    }
    if (Object.keys(companyPayload).length > 0) input.company = companyPayload;

    return input;
  }

  function handleContinue() {
    const input = buildInput();
    if (Object.keys(input).length === 0) {
      onAdvance({}, 8);
      return;
    }

    startTransition(async () => {
      const result = await saveExtrasAction(input);
      if (!result.success) {
        toast.error(tNav("genericError"));
        if (!result.profileView) return;
      }
      onAdvance({ profileView: result.profileView }, 8);
    });
  }

  function handleSkip() {
    onAdvance({}, 8);
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="font-display text-2xl font-bold text-on-surface">
          {t("title")}
        </h2>
        <p className="text-sm text-on-surface-variant">{t("subtitle")}</p>
      </div>

      <div className="space-y-3">
        {showAddress && (
          <Section
            isOpen={openSection === "address"}
            onToggle={() =>
              setOpenSection(openSection === "address" ? null : "address")
            }
            title={t("addressSection")}
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <TextField
                label={t("streetLabel")}
                onChange={(v) => setAddress((p) => ({ ...p, street: v }))}
                value={address.street}
              />
              <TextField
                label={t("neighborhoodLabel")}
                onChange={(v) => setAddress((p) => ({ ...p, neighborhood: v }))}
                value={address.neighborhood}
              />
              <TextField
                label={t("cityLabel")}
                onChange={(v) => setAddress((p) => ({ ...p, city: v }))}
                value={address.city}
              />
              <TextField
                label={t("stateLabel")}
                maxLength={2}
                onChange={(v) =>
                  setAddress((p) => ({ ...p, state: v.toUpperCase() }))
                }
                value={address.state}
              />
            </div>
          </Section>
        )}

        <Section
          isOpen={openSection === "social"}
          onToggle={() =>
            setOpenSection(openSection === "social" ? null : "social")
          }
          title={t("socialSection")}
        >
          <div className="space-y-3">
            {socialLinks.map((link) => (
              <div className="flex items-end gap-2" key={link.id}>
                <div className="flex-1">
                  <label className="mb-1 block text-xs font-semibold text-on-surface">
                    {t("socialPlatformLabel")}
                  </label>
                  <select
                    className="h-10 w-full rounded-lg bg-surface-container-high px-3 text-sm text-on-surface outline-none focus:ring-1 focus:ring-primary/30"
                    onChange={(e) =>
                      setSocialLinks((prev) =>
                        prev.map((l) =>
                          l.id === link.id
                            ? { ...l, platform: e.target.value as SocialPlatform }
                            : l,
                        ),
                      )
                    }
                    value={link.platform}
                  >
                    {SOCIAL_PLATFORMS.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex-[2]">
                  <label className="mb-1 block text-xs font-semibold text-on-surface">
                    {t("socialUrlLabel")}
                  </label>
                  <input
                    className="h-10 w-full rounded-lg bg-surface-container-high px-3 text-sm text-on-surface outline-none focus:ring-1 focus:ring-primary/30"
                    onChange={(e) =>
                      setSocialLinks((prev) =>
                        prev.map((l) =>
                          l.id === link.id ? { ...l, url: e.target.value } : l,
                        ),
                      )
                    }
                    type="url"
                    value={link.url}
                  />
                </div>
                <button
                  className="flex h-10 w-10 items-center justify-center rounded-lg text-on-surface-variant hover:text-danger"
                  onClick={() =>
                    setSocialLinks((prev) => prev.filter((l) => l.id !== link.id))
                  }
                  type="button"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
            <button
              className="flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
              onClick={() =>
                setSocialLinks((prev) => [
                  ...prev,
                  { id: Date.now(), platform: "instagram", url: "" },
                ])
              }
              type="button"
            >
              <Plus className="h-4 w-4" />
              {t("addSocial")}
            </button>
          </div>
        </Section>

        {showAreas && (
          <Section
            isOpen={openSection === "areas"}
            onToggle={() =>
              setOpenSection(openSection === "areas" ? null : "areas")
            }
            title={t("areasSection")}
          >
            <div className="space-y-3">
              {serviceAreas.map((area) => (
                <div className="flex items-end gap-2" key={area.id}>
                  <div className="flex-1">
                    <label className="mb-1 block text-xs font-semibold text-on-surface">
                      {t("areaNameLabel")}
                    </label>
                    <input
                      className="h-10 w-full rounded-lg bg-surface-container-high px-3 text-sm text-on-surface outline-none focus:ring-1 focus:ring-primary/30"
                      onChange={(e) =>
                        setServiceAreas((prev) =>
                          prev.map((a) =>
                            a.id === area.id ? { ...a, name: e.target.value } : a,
                          ),
                        )
                      }
                      type="text"
                      value={area.name}
                    />
                  </div>
                  <button
                    className="flex h-10 w-10 items-center justify-center rounded-lg text-on-surface-variant hover:text-danger"
                    onClick={() =>
                      setServiceAreas((prev) =>
                        prev.filter((a) => a.id !== area.id),
                      )
                    }
                    type="button"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
              <button
                className="flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
                onClick={() =>
                  setServiceAreas((prev) => [
                    ...prev,
                    { id: Date.now(), name: "" },
                  ])
                }
                type="button"
              >
                <Plus className="h-4 w-4" />
                {t("addArea")}
              </button>
            </div>
          </Section>
        )}

        <Section
          isOpen={openSection === "company"}
          onToggle={() =>
            setOpenSection(openSection === "company" ? null : "company")
          }
          title={t("companySection")}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <TextField
              label={t("cnpjLabel")}
              onChange={(v) => setCompany((p) => ({ ...p, cnpj: v }))}
              value={company.cnpj}
            />
            <TextField
              label={t("legalNameLabel")}
              onChange={(v) => setCompany((p) => ({ ...p, legalName: v }))}
              value={company.legalName}
            />
            <TextField
              label={t("foundedYearLabel")}
              maxLength={4}
              onChange={(v) =>
                setCompany((p) => ({
                  ...p,
                  foundedYear: v.replace(/\D/g, ""),
                }))
              }
              value={company.foundedYear}
            />
            <TextField
              label={t("differentialsLabel")}
              onChange={(v) => setCompany((p) => ({ ...p, differentials: v }))}
              value={company.differentials}
            />
          </div>
        </Section>
      </div>

      <div className="flex items-center justify-between pt-2">
        <div className="flex gap-3">
          <button
            className="text-sm font-medium text-on-surface-variant hover:text-on-surface"
            onClick={onBack}
            type="button"
          >
            {tNav("back")}
          </button>
          <button
            className="text-sm font-medium text-on-surface-variant hover:text-on-surface"
            onClick={handleSkip}
            type="button"
          >
            {tNav("skip")}
          </button>
        </div>
        <button
          className="flex h-12 items-center gap-2 rounded-xl bg-gradient-to-br from-primary to-primary-dim px-6 font-display font-bold text-on-primary shadow-lg shadow-primary/10 transition-all duration-200 hover:opacity-95 active:scale-[0.98] disabled:opacity-60"
          disabled={isPending}
          onClick={handleContinue}
          type="button"
        >
          {isPending ? tc("loading") : tNav("next")}
        </button>
      </div>
    </div>
  );
}

function Section({
  title,
  isOpen,
  onToggle,
  children,
}: {
  readonly title: string;
  readonly isOpen: boolean;
  readonly onToggle: () => void;
  readonly children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-xl bg-surface-container-high">
      <button
        aria-expanded={isOpen}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
        onClick={onToggle}
        type="button"
      >
        <span className="font-display text-sm font-semibold text-on-surface">
          {title}
        </span>
        <ChevronDown
          className={`h-4 w-4 text-on-surface-variant transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>
      {isOpen && <div className="border-t border-white/40 p-4">{children}</div>}
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
  maxLength,
}: {
  readonly label: string;
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly maxLength?: number;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-semibold text-on-surface">
        {label}
      </label>
      <input
        className="h-10 w-full rounded-lg bg-surface-container-lowest px-3 text-sm text-on-surface outline-none focus:ring-1 focus:ring-primary/30"
        maxLength={maxLength}
        onChange={(e) => onChange(e.target.value)}
        type="text"
        value={value}
      />
    </div>
  );
}

function mapExistingAddress(
  address: BusinessAddress | null | undefined,
): Partial<AddressState> {
  if (!address) return {};
  return {
    street: address.street,
    neighborhood: address.neighborhood ?? "",
    city: address.city,
    state: address.state,
  };
}

function mapExistingCompany(
  profile: BusinessProfile | null | undefined,
): Partial<CompanyState> {
  if (!profile) return {};
  return {
    cnpj: profile.cnpj ?? "",
    legalName: profile.legalName ?? "",
    foundedYear: profile.foundedYear != null ? String(profile.foundedYear) : "",
    differentials: profile.differentials ?? "",
  };
}
