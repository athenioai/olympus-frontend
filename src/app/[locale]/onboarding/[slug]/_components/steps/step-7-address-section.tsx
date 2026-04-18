"use client";

import { useTranslations } from "next-intl";
import type { BusinessAddress } from "@/lib/services";
import { Section, TextField } from "./step-7-primitives";

export interface AddressState {
  street: string;
  neighborhood: string;
  city: string;
  state: string;
}

export const EMPTY_ADDRESS: AddressState = {
  street: "",
  neighborhood: "",
  city: "",
  state: "",
};

export function mapExistingAddress(
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

interface AddressSectionProps {
  readonly isOpen: boolean;
  readonly onToggle: () => void;
  readonly value: AddressState;
  readonly onChange: (value: AddressState) => void;
}

export function AddressSection({
  isOpen,
  onToggle,
  value,
  onChange,
}: AddressSectionProps) {
  const t = useTranslations("onboarding.step7");

  return (
    <Section isOpen={isOpen} onToggle={onToggle} title={t("addressSection")}>
      <div className="grid gap-3 sm:grid-cols-2">
        <TextField
          label={t("streetLabel")}
          onChange={(v) => onChange({ ...value, street: v })}
          value={value.street}
        />
        <TextField
          label={t("neighborhoodLabel")}
          onChange={(v) => onChange({ ...value, neighborhood: v })}
          value={value.neighborhood}
        />
        <TextField
          label={t("cityLabel")}
          onChange={(v) => onChange({ ...value, city: v })}
          value={value.city}
        />
        <TextField
          label={t("stateLabel")}
          maxLength={2}
          onChange={(v) => onChange({ ...value, state: v.toUpperCase() })}
          value={value.state}
        />
      </div>
    </Section>
  );
}
