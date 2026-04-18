"use client";

import { useTranslations } from "next-intl";
import type { BusinessProfile } from "@/lib/services";
import { Section, TextField } from "./step-7-primitives";

export interface CompanyState {
  cnpj: string;
  legalName: string;
  foundedYear: string;
  differentials: string;
}

export const EMPTY_COMPANY: CompanyState = {
  cnpj: "",
  legalName: "",
  foundedYear: "",
  differentials: "",
};

export function mapExistingCompany(
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

interface CompanySectionProps {
  readonly isOpen: boolean;
  readonly onToggle: () => void;
  readonly value: CompanyState;
  readonly onChange: (value: CompanyState) => void;
}

export function CompanySection({
  isOpen,
  onToggle,
  value,
  onChange,
}: CompanySectionProps) {
  const t = useTranslations("onboarding.step7");

  return (
    <Section isOpen={isOpen} onToggle={onToggle} title={t("companySection")}>
      <div className="grid gap-3 sm:grid-cols-2">
        <TextField
          label={t("cnpjLabel")}
          onChange={(v) => onChange({ ...value, cnpj: v })}
          value={value.cnpj}
        />
        <TextField
          label={t("legalNameLabel")}
          onChange={(v) => onChange({ ...value, legalName: v })}
          value={value.legalName}
        />
        <TextField
          label={t("foundedYearLabel")}
          maxLength={4}
          onChange={(v) =>
            onChange({ ...value, foundedYear: v.replace(/\D/g, "") })
          }
          value={value.foundedYear}
        />
        <TextField
          label={t("differentialsLabel")}
          onChange={(v) => onChange({ ...value, differentials: v })}
          value={value.differentials}
        />
      </div>
    </Section>
  );
}
