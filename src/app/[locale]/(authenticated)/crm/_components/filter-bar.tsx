"use client";

import { useEffect, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Search,
  Flame,
  Thermometer,
  Snowflake,
  X,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import type { LeadTemperature } from "@/lib/services/interfaces/lead-service";
import type { CrmFilters } from "../page";

const TEMP_CHIPS: ReadonlyArray<{
  readonly value: LeadTemperature;
  readonly icon: typeof Flame;
  readonly label: string;
  readonly activeClass: string;
}> = [
  { value: "hot", icon: Flame, label: "Quente", activeClass: "bg-danger/10 text-danger ring-danger/30" },
  { value: "warm", icon: Thermometer, label: "Morno", activeClass: "bg-warning/10 text-warning ring-warning/30" },
  { value: "cold", icon: Snowflake, label: "Frio", activeClass: "bg-primary/10 text-primary ring-primary/30" },
];

export function FilterBar({ filters }: { readonly filters: CrmFilters }) {
  const router = useRouter();
  const pathname = usePathname();
  const [searchDraft, setSearchDraft] = useState(filters.search ?? "");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setSearchDraft(filters.search ?? "");
  }, [filters.search]);

  function pushWithParams(next: { search?: string; temperature?: LeadTemperature }) {
    const params = new URLSearchParams();
    if (next.search) params.set("search", next.search);
    if (next.temperature) params.set("temperature", next.temperature);
    const qs = params.toString();
    startTransition(() => {
      router.push(qs ? `${pathname}?${qs}` : pathname);
    });
  }

  // Debounced search
  useEffect(() => {
    const current = filters.search ?? "";
    if (searchDraft === current) return;

    const handle = window.setTimeout(() => {
      pushWithParams({
        search: searchDraft || undefined,
        temperature: filters.temperature,
      });
    }, 300);

    return () => window.clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchDraft]);

  function toggleTemp(value: LeadTemperature) {
    const next = filters.temperature === value ? undefined : value;
    pushWithParams({ search: filters.search, temperature: next });
  }

  const hasActiveFilters = Boolean(filters.search || filters.temperature);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative min-w-[260px] flex-1 max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant/60" />
        <Input
          className="pl-9"
          onChange={(e) => setSearchDraft(e.target.value)}
          placeholder="Buscar por nome, email ou telefone..."
          type="search"
          value={searchDraft}
        />
      </div>

      <div className="flex items-center gap-1.5">
        {TEMP_CHIPS.map((chip) => {
          const active = filters.temperature === chip.value;
          const Icon = chip.icon;
          return (
            <button
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-semibold ring-1 transition-colors",
                active
                  ? chip.activeClass
                  : "bg-surface-container-high text-on-surface-variant ring-transparent hover:ring-surface-container-highest",
              )}
              key={chip.value}
              onClick={() => toggleTemp(chip.value)}
              type="button"
            >
              <Icon className="h-3 w-3" />
              {chip.label}
            </button>
          );
        })}
      </div>

      {hasActiveFilters && (
        <button
          className="inline-flex items-center gap-1 rounded-full px-2 py-1.5 text-[12px] font-semibold text-on-surface-variant transition-colors hover:text-on-surface"
          onClick={() => pushWithParams({})}
          type="button"
        >
          <X className="h-3 w-3" />
          Limpar
        </button>
      )}

      {isPending && <Loader2 className="h-4 w-4 animate-spin text-on-surface-variant" />}
    </div>
  );
}
