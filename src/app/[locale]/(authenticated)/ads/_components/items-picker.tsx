"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Plus, Search, Tag, X } from "lucide-react";
import { motion } from "motion/react";
import { formatBRL } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { AdItem, AdItemRef, Product, Service } from "@/lib/services";

const MAX_ITEMS = 50;

interface ItemsPickerProps {
  readonly value: readonly AdItem[];
  readonly onChange: (next: readonly AdItem[]) => void;
  readonly services: readonly Service[];
  readonly products: readonly Product[];
}

type PickerTab = "services" | "products";

export function ItemsPicker({
  value,
  onChange,
  services,
  products,
}: ItemsPickerProps) {
  const t = useTranslations("ads");
  const tc = useTranslations("common");
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<PickerTab>("services");
  const [query, setQuery] = useState("");
  const [drafted, setDrafted] = useState<Record<string, boolean>>({});

  const selectedKeys = useMemo(
    () => new Set(value.map((i) => `${i.type}:${i.id}`)),
    [value],
  );

  const filtered = useMemo(() => {
    const list = tab === "services" ? services : products;
    if (!query.trim()) return list;
    const q = query.trim().toLowerCase();
    return list.filter((i) => i.name.toLowerCase().includes(q));
  }, [services, products, tab, query]);

  const remainingSlots = MAX_ITEMS - value.length;
  const draftedCount = Object.values(drafted).filter(Boolean).length;
  const canAddMore = draftedCount > 0 && draftedCount <= remainingSlots;

  function removeItem(ref: AdItemRef) {
    onChange(value.filter((i) => !(i.type === ref.type && i.id === ref.id)));
  }

  function toggleDraft(key: string) {
    setDrafted((prev) => {
      const next = { ...prev };
      if (next[key]) delete next[key];
      else next[key] = true;
      return next;
    });
  }

  function commitDrafted() {
    const additions: AdItem[] = [];
    for (const key of Object.keys(drafted)) {
      const [tabSegment, id] = key.split(":") as [PickerTab, string];
      const source = tabSegment === "services" ? services : products;
      const found = source.find((i) => i.id === id);
      if (!found) continue;
      const itemType = tabSegment === "services" ? "service" : "product";
      additions.push({
        type: itemType,
        id: found.id,
        name: found.name,
        price: found.price,
      });
    }
    if (additions.length === 0) {
      setOpen(false);
      return;
    }
    const merged: AdItem[] = [...value];
    for (const add of additions) {
      if (!selectedKeys.has(`${add.type}:${add.id}`)) merged.push(add);
    }
    onChange(merged.slice(0, MAX_ITEMS));
    setDrafted({});
    setOpen(false);
  }

  return (
    <div className="space-y-3">
      {value.length === 0 ? (
        <p className="text-[13px] italic text-on-surface-variant/80">
          {t("linksEmpty")}
        </p>
      ) : (
        <ul className="flex flex-wrap gap-2">
          {value.map((item) => (
            <li key={`${item.type}:${item.id}`}>
              <span className="inline-flex items-center gap-2 rounded-full bg-surface-container-high px-3 py-1.5 text-[13px] text-on-surface">
                <Tag
                  className={cn(
                    "h-3.5 w-3.5",
                    item.type === "service" ? "text-primary" : "text-teal",
                  )}
                />
                <span className="font-medium">{item.name}</span>
                <span className="text-on-surface-variant">
                  {formatBRL(item.price)}
                </span>
                <button
                  aria-label="remover"
                  className="ml-1 flex h-4 w-4 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container-lowest hover:text-on-surface"
                  onClick={() => removeItem(item)}
                  type="button"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}

      <div className="flex items-center justify-between">
        <button
          className="flex h-9 items-center gap-2 rounded-xl bg-surface-container-high px-4 text-sm font-medium text-on-surface transition-colors hover:bg-surface-container-low disabled:opacity-50"
          disabled={value.length >= MAX_ITEMS}
          onClick={() => {
            setOpen(true);
            setDrafted({});
            setQuery("");
          }}
          type="button"
        >
          <Plus className="h-4 w-4" />
          {t("addItem")}
        </button>
        {value.length >= MAX_ITEMS - 5 && (
          <span
            className={cn(
              "text-[12px] font-medium",
              value.length >= MAX_ITEMS
                ? "text-danger"
                : "text-on-surface-variant",
            )}
          >
            {t("itemsLimit", { used: value.length, max: MAX_ITEMS })}
          </span>
        )}
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-on-surface/20 backdrop-blur-sm"
            onClick={() => setOpen(false)}
            onKeyDown={() => {}}
            role="presentation"
          />
          <motion.div
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="relative z-10 flex w-full max-w-xl flex-col overflow-hidden rounded-xl bg-surface-container-lowest shadow-ambient-strong"
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            style={{ maxHeight: "min(80vh, 640px)" }}
          >
            <div className="flex border-b border-surface-container-high">
              {(["services", "products"] as const).map((id) => (
                <button
                  className={cn(
                    "flex-1 py-3 text-sm font-medium transition-colors",
                    tab === id
                      ? "text-on-surface"
                      : "text-on-surface-variant hover:text-on-surface",
                  )}
                  key={id}
                  onClick={() => setTab(id)}
                  type="button"
                >
                  {t(`tabs.${id}`)}
                  {tab === id && (
                    <div className="mx-auto mt-2 h-[2px] w-12 rounded-full bg-primary" />
                  )}
                </button>
              ))}
            </div>

            <div className="border-b border-surface-container-high px-4 py-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant/60" />
                <input
                  className="h-10 w-full rounded-xl bg-surface-container-high pl-9 pr-3 text-sm text-on-surface outline-none focus:ring-1 focus:ring-primary/30"
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t("itemSearchPlaceholder")}
                  type="text"
                  value={query}
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-2 py-2">
              {filtered.length === 0 ? (
                <p className="px-4 py-10 text-center text-sm text-on-surface-variant">
                  {t("empty")}
                </p>
              ) : (
                <ul className="space-y-1">
                  {filtered.map((item) => {
                    const key = `${tab}:${item.id}`;
                    const itemType =
                      tab === "services" ? "service" : "product";
                    const alreadyLinked = selectedKeys.has(
                      `${itemType}:${item.id}`,
                    );
                    const isDrafted = Boolean(drafted[key]);
                    return (
                      <li key={item.id}>
                        <button
                          className={cn(
                            "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors",
                            alreadyLinked
                              ? "cursor-not-allowed opacity-50"
                              : "hover:bg-surface-container-high",
                          )}
                          disabled={alreadyLinked}
                          onClick={() => toggleDraft(key)}
                          type="button"
                        >
                          <span
                            className={cn(
                              "flex h-5 w-5 shrink-0 items-center justify-center rounded border",
                              isDrafted
                                ? "border-primary bg-primary text-on-primary"
                                : "border-surface-container-high",
                            )}
                          >
                            {isDrafted && (
                              <svg
                                className="h-3 w-3"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="3"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  d="M5 13l4 4L19 7"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            )}
                          </span>
                          <span className="flex-1 truncate font-medium text-on-surface">
                            {item.name}
                          </span>
                          <span className="text-on-surface-variant">
                            {formatBRL(item.price)}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            <div className="flex items-center justify-between border-t border-surface-container-high px-4 py-3">
              <span className="text-[12px] text-on-surface-variant">
                {t("itemsLimit", {
                  used: value.length + draftedCount,
                  max: MAX_ITEMS,
                })}
              </span>
              <div className="flex items-center gap-2">
                <button
                  className="h-9 rounded-xl px-4 text-sm text-on-surface-variant transition-colors hover:bg-surface-container-high"
                  onClick={() => setOpen(false)}
                  type="button"
                >
                  {tc("cancel")}
                </button>
                <button
                  className="h-9 rounded-xl bg-primary px-4 text-sm font-bold text-on-primary transition-opacity hover:opacity-90 disabled:opacity-50"
                  disabled={!canAddMore}
                  onClick={commitDrafted}
                  type="button"
                >
                  {t("addItemsCount", { count: draftedCount })}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
