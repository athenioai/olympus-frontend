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

  function addLink() {
    onChange([
      ...links,
      { id: Date.now(), platform: "instagram", url: "" },
    ]);
  }

  return (
    <Section isOpen={isOpen} onToggle={onToggle} title={t("socialSection")}>
      <div className="space-y-3">
        {links.map((link) => (
          <div className="flex items-end gap-2" key={link.id}>
            <div className="flex-1">
              <label className="mb-1 block text-xs font-semibold text-on-surface">
                {t("socialPlatformLabel")}
              </label>
              <select
                className="h-10 w-full rounded-lg bg-surface-container-high px-3 text-sm text-on-surface outline-none focus:ring-1 focus:ring-primary/30"
                onChange={(e) =>
                  updateLink(link.id, {
                    platform: e.target.value as SocialPlatform,
                  })
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
                onChange={(e) => updateLink(link.id, { url: e.target.value })}
                type="url"
                value={link.url}
              />
            </div>
            <button
              aria-label="remove"
              className="flex h-10 w-10 items-center justify-center rounded-lg text-on-surface-variant hover:text-danger"
              onClick={() => removeLink(link.id)}
              type="button"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
        <button
          className="flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
          onClick={addLink}
          type="button"
        >
          <Plus className="h-4 w-4" />
          {t("addSocial")}
        </button>
      </div>
    </Section>
  );
}
