"use client";

import { useTranslations } from "next-intl";
import { Plus, Trash2 } from "lucide-react";
import type { SocialPlatform } from "@/lib/services";
import { Section } from "./step-7-primitives";

export interface SocialLinkDraft {
  readonly id: number;
  platform: SocialPlatform;
  url: string;
}

const SOCIAL_PLATFORMS: readonly SocialPlatform[] = [
  "website",
  "instagram",
  "google_reviews",
  "facebook",
  "linkedin",
  "youtube",
  "tiktok",
];

interface SocialLinksSectionProps {
  readonly isOpen: boolean;
  readonly onToggle: () => void;
  readonly links: readonly SocialLinkDraft[];
  readonly onChange: (links: readonly SocialLinkDraft[]) => void;
}

export function SocialLinksSection({
  isOpen,
  onToggle,
  links,
  onChange,
}: SocialLinksSectionProps) {
  const t = useTranslations("onboarding.step7");

  function updateLink(id: number, patch: Partial<SocialLinkDraft>) {
    onChange(links.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  }

  function removeLink(id: number) {
    onChange(links.filter((l) => l.id !== id));
  }

  function pickAvailablePlatform(): SocialPlatform | null {
    const used = new Set(links.map((l) => l.platform));
    return SOCIAL_PLATFORMS.find((p) => !used.has(p)) ?? null;
  }

  function addLink() {
    const next = pickAvailablePlatform();
    if (!next) return;
    onChange([...links, { id: Date.now(), platform: next, url: "" }]);
  }

  const availableForNew = pickAvailablePlatform();

  function platformOptions(currentId: number) {
    const usedByOthers = new Set(
      links.filter((l) => l.id !== currentId).map((l) => l.platform),
    );
    return SOCIAL_PLATFORMS.map((p) => ({
      value: p,
      disabled: usedByOthers.has(p),
    }));
  }

  return (
    <Section isOpen={isOpen} onToggle={onToggle} title={t("socialSection")}>
      <div className="flex flex-col gap-3">
        {links.map((link) => (
          <div className="flex items-end gap-2" key={link.id}>
            <div className="flex flex-1 flex-col gap-1.5">
              <label className="onb-field-label">
                {t("socialPlatformLabel")}
              </label>
              <select
                className="onb-input"
                onChange={(e) =>
                  updateLink(link.id, {
                    platform: e.target.value as SocialPlatform,
                  })
                }
                value={link.platform}
              >
                {platformOptions(link.id).map(({ value, disabled }) => (
                  <option disabled={disabled} key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-[2] flex-col gap-1.5">
              <label className="onb-field-label">{t("socialUrlLabel")}</label>
              <input
                className="onb-input"
                onChange={(e) => updateLink(link.id, { url: e.target.value })}
                type="url"
                value={link.url}
              />
            </div>
            <button
              aria-label="remove"
              className="flex size-12 shrink-0 items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-danger"
              onClick={() => removeLink(link.id)}
              type="button"
            >
              <Trash2 className="size-4" />
            </button>
          </div>
        ))}
        <button
          className="onb-suggest"
          disabled={availableForNew === null}
          onClick={addLink}
          type="button"
        >
          <Plus className="size-3" />
          {t("addSocial")}
        </button>
      </div>
    </Section>
  );
}
