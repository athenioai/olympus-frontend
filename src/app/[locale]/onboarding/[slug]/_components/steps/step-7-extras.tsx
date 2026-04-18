"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { saveExtrasAction, type SaveExtrasInput } from "../../actions";
import type { StepProps } from "../wizard";
import {
  AddressSection,
  EMPTY_ADDRESS,
  mapExistingAddress,
  type AddressState,
} from "./step-7-address-section";
import {
  CompanySection,
  EMPTY_COMPANY,
  mapExistingCompany,
  type CompanyState,
} from "./step-7-company-section";
import {
  ServiceAreasSection,
  type ServiceAreaDraft,
} from "./step-7-areas-section";
import {
  SocialLinksSection,
  type SocialLinkDraft,
} from "./step-7-social-section";

type SectionKey = "address" | "social" | "areas" | "company";

export function Step7Extras({ state, onAdvance, onBack }: StepProps) {
  const t = useTranslations("onboarding.step7");
  const tc = useTranslations("common");
  const tNav = useTranslations("onboarding");

  const modality = state.profileView?.profile?.serviceModality;
  const showAddress = modality !== "remoto";
  const showAreas =
    modality === "domicilio" || modality === "hibrido" || modality === "remoto";

  const [openSection, setOpenSection] = useState<SectionKey | null>("address");
  const [address, setAddress] = useState<AddressState>({
    ...EMPTY_ADDRESS,
    ...mapExistingAddress(state.profileView?.address),
  });
  const [socialLinks, setSocialLinks] = useState<readonly SocialLinkDraft[]>(
    [],
  );
  const [serviceAreas, setServiceAreas] = useState<readonly ServiceAreaDraft[]>(
    [],
  );
  const [company, setCompany] = useState<CompanyState>({
    ...EMPTY_COMPANY,
    ...mapExistingCompany(state.profileView?.profile),
  });
  const [isPending, startTransition] = useTransition();

  function toggle(section: SectionKey) {
    setOpenSection((prev) => (prev === section ? null : section));
  }

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
          <AddressSection
            isOpen={openSection === "address"}
            onChange={setAddress}
            onToggle={() => toggle("address")}
            value={address}
          />
        )}

        <SocialLinksSection
          isOpen={openSection === "social"}
          links={socialLinks}
          onChange={setSocialLinks}
          onToggle={() => toggle("social")}
        />

        {showAreas && (
          <ServiceAreasSection
            areas={serviceAreas}
            isOpen={openSection === "areas"}
            onChange={setServiceAreas}
            onToggle={() => toggle("areas")}
          />
        )}

        <CompanySection
          isOpen={openSection === "company"}
          onChange={setCompany}
          onToggle={() => toggle("company")}
          value={company}
        />
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
            onClick={() => onAdvance({}, 8)}
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
