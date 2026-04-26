"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { motion } from "motion/react";
import type { Ad, AdItem, Product, Service } from "@/lib/services";
import { ItemsPicker } from "./items-picker";

const PLATFORM_OPTIONS = [
  "instagram",
  "facebook",
  "tiktok",
  "whatsapp",
  "google",
  "other",
] as const;

interface AdFormModalProps {
  readonly ad?: Ad;
  readonly services: readonly Service[];
  readonly products: readonly Product[];
  readonly onClose: () => void;
  readonly onSubmit: (formData: FormData) => void;
  readonly isPending: boolean;
}

/**
 * Convert an ISO datetime to a `<input type="datetime-local">`-compatible
 * string (YYYY-MM-DDTHH:mm in local time). Returns "" for null/undefined.
 */
function isoToLocalInput(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function localInputToIso(local: string): string {
  if (!local) return "";
  const d = new Date(local);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString();
}

export function AdFormModal({
  ad,
  services,
  products,
  onClose,
  onSubmit,
  isPending,
}: AdFormModalProps) {
  const t = useTranslations("ads");
  const tc = useTranslations("common");
  const [items, setItems] = useState<readonly AdItem[]>(ad?.items ?? []);
  const [itemsTouched, setItemsTouched] = useState(false);

  function setLocalizedValidity(el: HTMLInputElement | HTMLTextAreaElement) {
    if (el.validity.valueMissing) el.setCustomValidity(tc("fieldRequired"));
    else el.setCustomValidity("");
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fd = new FormData(event.currentTarget);
    const validFromLocal = String(fd.get("validFromLocal") ?? "");
    const validToLocal = String(fd.get("validToLocal") ?? "");
    fd.delete("validFromLocal");
    fd.delete("validToLocal");
    fd.set("validFrom", localInputToIso(validFromLocal));
    fd.set("validTo", localInputToIso(validToLocal));

    if (ad) {
      if (itemsTouched) {
        fd.set("itemsState", "replace");
        fd.set(
          "items",
          JSON.stringify(items.map((i) => ({ type: i.type, id: i.id }))),
        );
      } else {
        fd.set("itemsState", "preserve");
      }
    } else {
      fd.set(
        "items",
        JSON.stringify(items.map((i) => ({ type: i.type, id: i.id }))),
      );
    }

    onSubmit(fd);
  }

  function handleItemsChange(next: readonly AdItem[]) {
    setItems(next);
    setItemsTouched(true);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-on-surface/20 backdrop-blur-sm"
        onClick={onClose}
        onKeyDown={() => {}}
        role="presentation"
      />
      <motion.div
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative z-10 flex w-full max-w-2xl flex-col rounded-xl bg-surface-container-lowest shadow-ambient-strong"
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        style={{ maxHeight: "min(90vh, 720px)" }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="px-8 pb-4 pt-8">
          <h2 className="font-display text-xl font-bold tracking-tight text-on-surface">
            {ad ? tc("edit") : t("newAd")}
          </h2>
        </div>
        <form
          className="flex flex-1 flex-col overflow-hidden"
          onSubmit={handleSubmit}
        >
          <div className="flex-1 space-y-5 overflow-y-auto px-8 pb-6">
            <div className="space-y-1.5">
              <label
                className="text-sm font-medium text-on-surface"
                htmlFor="ad-name"
              >
                {t("name")}
              </label>
              <input
                className="h-10 w-full rounded-xl bg-surface-container-high px-4 text-sm text-on-surface outline-none transition-colors focus:bg-surface-container-lowest focus:ring-1 focus:ring-primary/30"
                defaultValue={ad?.name ?? ""}
                id="ad-name"
                maxLength={255}
                name="name"
                onInput={(e) => setLocalizedValidity(e.currentTarget)}
                onInvalid={(e) => setLocalizedValidity(e.currentTarget)}
                required
                type="text"
              />
            </div>

            <div className="space-y-1.5">
              <label
                className="text-sm font-medium text-on-surface"
                htmlFor="ad-content"
              >
                {t("content")}
              </label>
              <textarea
                className="min-h-[100px] w-full rounded-xl bg-surface-container-high px-4 py-3 text-sm text-on-surface outline-none transition-colors focus:bg-surface-container-lowest focus:ring-1 focus:ring-primary/30"
                defaultValue={ad?.content ?? ""}
                id="ad-content"
                maxLength={5000}
                name="content"
                onInput={(e) => setLocalizedValidity(e.currentTarget)}
                onInvalid={(e) => setLocalizedValidity(e.currentTarget)}
                required
              />
              <p className="text-xs text-on-surface-variant">
                {t("contentHint")}
              </p>
            </div>

            <div className="space-y-1.5">
              <label
                className="text-sm font-medium text-on-surface"
                htmlFor="ad-platform"
              >
                {t("platform")}
              </label>
              <select
                className="h-10 w-full rounded-xl bg-surface-container-high px-4 text-sm text-on-surface outline-none transition-colors focus:bg-surface-container-lowest focus:ring-1 focus:ring-primary/30"
                defaultValue={ad?.platform ?? "instagram"}
                id="ad-platform"
                name="platform"
                required
              >
                {PLATFORM_OPTIONS.map((p) => (
                  <option key={p} value={p}>
                    {t(`platforms.${p}`)}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label
                  className="text-sm font-medium text-on-surface"
                  htmlFor="ad-validFrom"
                >
                  {t("validFrom")}
                </label>
                <input
                  className="h-10 w-full rounded-xl bg-surface-container-high px-4 text-sm text-on-surface outline-none transition-colors focus:bg-surface-container-lowest focus:ring-1 focus:ring-primary/30"
                  defaultValue={isoToLocalInput(ad?.validFrom)}
                  id="ad-validFrom"
                  name="validFromLocal"
                  type="datetime-local"
                />
              </div>
              <div className="space-y-1.5">
                <label
                  className="text-sm font-medium text-on-surface"
                  htmlFor="ad-validTo"
                >
                  {t("validTo")}
                </label>
                <input
                  className="h-10 w-full rounded-xl bg-surface-container-high px-4 text-sm text-on-surface outline-none transition-colors focus:bg-surface-container-lowest focus:ring-1 focus:ring-primary/30"
                  defaultValue={isoToLocalInput(ad?.validTo)}
                  id="ad-validTo"
                  name="validToLocal"
                  type="datetime-local"
                />
              </div>
            </div>
            <p className="-mt-2 text-xs text-on-surface-variant">
              {t("validityHint")}
            </p>

            <input
              defaultValue={ad ? String(ad.active) : "true"}
              name="active"
              type="hidden"
            />

            <div className="rounded-xl bg-surface-container-low p-4">
              <div className="mb-3">
                <h3 className="font-display text-sm font-bold tracking-tight text-on-surface">
                  {t("linksTitle")}
                </h3>
                <p className="mt-0.5 text-[12px] text-on-surface-variant">
                  {t("linksSubtitle")}
                </p>
              </div>
              <ItemsPicker
                onChange={handleItemsChange}
                products={products}
                services={services}
                value={items}
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-surface-container-high px-8 py-5">
            <button
              className="h-10 rounded-xl px-5 text-sm font-medium text-on-surface-variant transition-colors hover:bg-surface-container-high"
              disabled={isPending}
              onClick={onClose}
              type="button"
            >
              {tc("cancel")}
            </button>
            <button
              className="h-10 rounded-xl bg-primary px-5 text-sm font-bold text-on-primary transition-opacity hover:opacity-90 disabled:opacity-60"
              disabled={isPending}
              type="submit"
            >
              {isPending ? tc("loading") : tc("save")}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
