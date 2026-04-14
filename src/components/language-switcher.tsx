"use client";

import { useLocale } from "next-intl";
import { useRouter, usePathname } from "next/navigation";
import { Globe } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { locales, type Locale } from "@/i18n/config";

const LOCALE_LABELS: Record<Locale, string> = {
  "pt-BR": "Português",
  "en-US": "English",
  es: "Español",
};

const LOCALE_FLAGS: Record<Locale, string> = {
  "pt-BR": "🇧🇷",
  "en-US": "🇺🇸",
  es: "🇪🇸",
};

export function LanguageSwitcher() {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function switchLocale(newLocale: Locale) {
    const segments = pathname.split("/").filter(Boolean);
    const isCurrentLocale = locales.includes(segments[0] as Locale);
    const pathWithoutLocale = isCurrentLocale
      ? `/${segments.slice(1).join("/")}`
      : pathname;

    router.push(`/${newLocale}${pathWithoutLocale}`);
    setOpen(false);
  }

  return (
    <div className="relative" ref={ref}>
      <button
        className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-on-surface-variant transition-colors hover:bg-surface-container-high"
        onClick={() => setOpen(!open)}
        type="button"
      >
        <Globe className="h-4 w-4" />
        <span>{LOCALE_FLAGS[locale]}</span>
      </button>

      {open && (
        <div className="absolute bottom-full left-0 mb-2 min-w-[160px] rounded-xl bg-surface-container-lowest p-1 shadow-ambient">
          {locales.map((l) => (
            <button
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                l === locale
                  ? "bg-primary/8 font-semibold text-primary"
                  : "text-on-surface hover:bg-surface-container-high"
              }`}
              key={l}
              onClick={() => switchLocale(l)}
              type="button"
            >
              <span>{LOCALE_FLAGS[l]}</span>
              <span>{LOCALE_LABELS[l]}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
