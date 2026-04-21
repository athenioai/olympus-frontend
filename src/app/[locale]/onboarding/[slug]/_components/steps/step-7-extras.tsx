"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { saveExtrasAction, type SaveExtrasInput } from "../../actions";
import type { StepProps } from "../wizard";
import { OnbNav } from "../onb-nav";
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

function isValidUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function Step7Extras({
  state,
  onAdvance,
  onBack,
  onSkip,
}: StepProps) {
  const t = useTranslations("onboarding.step7");
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

  type BuildResult =
    | { readonly ok: true; readonly input: SaveExtrasInput }
    | { readonly ok: false; readonly reason: "addressPartial" };

  function buildInput(): BuildResult {
    const input: SaveExtrasInput = {};

    if (showAddress) {
      const street = address.street.trim();
      const city = address.city.trim();
      const stateValue = address.state.trim();
      const anyFilled = Boolean(
        street || city || stateValue || address.neighborhood.trim(),
      );
      const allRequired = Boolean(street && city && stateValue);
      if (anyFilled && !allRequired) {
        return { ok: false, reason: "addressPartial" };
      }
      if (allRequired) {
        input.address = {
          street,
          city,
          state: stateValue.toUpperCase(),
          ...(address.neighborhood.trim()
            ? { neighborhood: address.neighborhood.trim() }
            : {}),
        };
      }
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

    return { ok: true, input };
  }

  function handleContinue() {
    const built = buildInput();
    if (!built.ok) {
      if (built.reason === "addressPartial") {
        toast.error(t("addressRequiredError"));
        setOpenSection("address");
      }
      return;
    }
    const input = built.input;

    // Client-side URL check — the backend would reject the whole
    // saveExtrasAction with a generic INVALID_INPUT otherwise, which then
    // surfaces as a vague "Algo deu errado" toast.
    for (const link of input.socialLinks ?? []) {
      if (!isValidUrl(link.url)) {
        toast.error(t("socialUrlInvalid"));
        setOpenSection("social");
        return;
      }
    }

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
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
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

      <OnbNav
        canContinue={true}
        isFinalStep
        isPending={isPending}
        onBack={onBack}
        onContinue={handleContinue}
        onSkip={onSkip}
      />
    </div>
  );
}
