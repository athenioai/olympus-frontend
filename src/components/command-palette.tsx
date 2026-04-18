"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import { AnimatePresence, motion } from "motion/react";
import {
  Search,
  LayoutDashboard,
  Filter,
  Users,
  MessageSquare,
  CalendarDays,
  Package,
  ShoppingBag,
  Building2,
  Plus,
  CornerDownLeft,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/format";
import { STAGE_PAST_PILL, stageDotClass } from "@/lib/stage-palette";
import { searchLeadsQuick } from "@/app/[locale]/(authenticated)/crm/actions";
import type { LeadPublic } from "@/lib/services/interfaces/lead-service";

interface NavEntry {
  readonly href: string;
  readonly icon: LucideIcon;
  readonly label: string;
}

const NAV_ENTRIES: readonly NavEntry[] = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/crm", icon: Filter, label: "Funil" },
  { href: "/leads", icon: Users, label: "Leads" },
  { href: "/conversations", icon: MessageSquare, label: "Conversas" },
  { href: "/calendar", icon: CalendarDays, label: "Calendário" },
  { href: "/services", icon: Package, label: "Serviços" },
  { href: "/products", icon: ShoppingBag, label: "Produtos" },
  { href: "/settings", icon: Building2, label: "Configurações" },
];

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [leads, setLeads] = useState<LeadPublic[]>([]);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<number | null>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setLeads([]);
    }
  }, [open]);

  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    if (query.trim().length === 0) {
      setLeads([]);
      setSearching(false);
      return;
    }

    setSearching(true);
    debounceRef.current = window.setTimeout(async () => {
      const result = await searchLeadsQuick(query, 8);
      setLeads(result.success && result.data ? result.data : []);
      setSearching(false);
    }, 200);

    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [query]);

  function navigate(href: string) {
    setOpen(false);
    router.push(href);
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-[100] flex items-start justify-center px-4 pt-[12vh]"
          exit={{ opacity: 0 }}
          initial={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <button
            aria-label="Fechar"
            className="fixed inset-0 bg-on-surface/20 backdrop-blur-sm"
            onClick={() => setOpen(false)}
            type="button"
          />
          <motion.div
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="relative w-full max-w-xl overflow-hidden rounded-2xl bg-surface-container-lowest shadow-ambient-strong ring-1 ring-black/5"
            exit={{ opacity: 0, scale: 0.97, y: -4 }}
            initial={{ opacity: 0, scale: 0.97, y: -4 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
          >
            <Command className="flex flex-col" label="Command palette" shouldFilter={false}>
              <div className="flex items-center gap-3 px-4 pt-4 pb-3">
                <Search className="h-4 w-4 shrink-0 text-on-surface-variant/60" />
                <Command.Input
                  autoFocus
                  className="h-9 flex-1 bg-transparent text-sm text-on-surface outline-none placeholder:text-on-surface-variant/60"
                  onValueChange={setQuery}
                  placeholder="Buscar leads, ações, páginas..."
                  value={query}
                />
                <kbd className="hidden items-center gap-1 rounded-md bg-surface-container-high px-1.5 py-0.5 text-[10px] font-semibold text-on-surface-variant sm:inline-flex">
                  esc
                </kbd>
              </div>

              <div className="h-px bg-surface-container-high/60" />

              <Command.List className="max-h-[60vh] overflow-y-auto px-2 py-2">
                <Command.Empty className="px-3 py-8 text-center text-[13px] text-on-surface-variant">
                  {searching
                    ? "Buscando..."
                    : query.length > 0
                      ? "Nenhum resultado."
                      : "Comece a digitar pra buscar leads, ou escolha uma ação abaixo."}
                </Command.Empty>

                {leads.length > 0 && (
                  <Group title="Leads">
                    {leads.map((lead) => (
                      <LeadItem
                        key={lead.id}
                        lead={lead}
                        onSelect={() => navigate(`/leads/${lead.id}`)}
                      />
                    ))}
                  </Group>
                )}

                <Group title="Navegação">
                  {NAV_ENTRIES.map((entry) => (
                    <NavItem
                      entry={entry}
                      key={entry.href}
                      onSelect={() => navigate(entry.href)}
                    />
                  ))}
                </Group>

                <Group title="Ações">
                  <ActionItem
                    icon={Plus}
                    label="Novo lead"
                    onSelect={() => navigate("/crm")}
                  />
                </Group>
              </Command.List>

              <Footer />
            </Command>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Group({ title, children }: { readonly title: string; readonly children: React.ReactNode }) {
  return (
    <Command.Group
      className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:pt-3 [&_[cmdk-group-heading]]:pb-1.5 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-bold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.2em] [&_[cmdk-group-heading]]:text-on-surface-variant/70"
      heading={title}
    >
      {children}
    </Command.Group>
  );
}

const ROW_CLASS =
  "flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-on-surface transition-colors aria-selected:bg-surface-container-high";

function LeadItem({
  lead,
  onSelect,
}: {
  readonly lead: LeadPublic;
  readonly onSelect: () => void;
}) {
  return (
    <Command.Item className={ROW_CLASS} onSelect={onSelect} value={`lead-${lead.id}-${lead.name}`}>
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10">
        <span className="text-[11px] font-bold text-primary">
          {initials(lead.name)}
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate font-medium text-on-surface">{lead.name}</span>
          <span
            className={cn(
              "inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold",
              STAGE_PAST_PILL,
            )}
          >
            <span className={cn("h-1 w-1 rounded-full", stageDotClass(lead.status))} />
            <span className="capitalize">{lead.status}</span>
          </span>
        </div>
        {lead.email && (
          <p className="truncate text-[11px] text-on-surface-variant">{lead.email}</p>
        )}
      </div>
      <span className="shrink-0 text-[11px] tabular-nums text-on-surface-variant">
        {formatRelativeTime(lead.updatedAt)}
      </span>
    </Command.Item>
  );
}

function NavItem({
  entry,
  onSelect,
}: {
  readonly entry: NavEntry;
  readonly onSelect: () => void;
}) {
  const Icon = entry.icon;
  return (
    <Command.Item
      className={ROW_CLASS}
      onSelect={onSelect}
      value={`nav-${entry.href}-${entry.label}`}
    >
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-surface-container-high">
        <Icon className="h-3.5 w-3.5 text-on-surface-variant" />
      </div>
      <span className="font-medium text-on-surface">{entry.label}</span>
    </Command.Item>
  );
}

function ActionItem({
  icon: Icon,
  label,
  onSelect,
}: {
  readonly icon: LucideIcon;
  readonly label: string;
  readonly onSelect: () => void;
}) {
  return (
    <Command.Item className={ROW_CLASS} onSelect={onSelect} value={`action-${label}`}>
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10">
        <Icon className="h-3.5 w-3.5 text-primary" />
      </div>
      <span className="font-medium text-on-surface">{label}</span>
    </Command.Item>
  );
}

function Footer() {
  return (
    <div className="flex items-center justify-between gap-3 border-t border-surface-container-high/60 px-4 py-2.5 text-[11px] text-on-surface-variant">
      <div className="flex items-center gap-3">
        <span className="inline-flex items-center gap-1">
          <Kbd>
            <ArrowUp className="h-2.5 w-2.5" />
          </Kbd>
          <Kbd>
            <ArrowDown className="h-2.5 w-2.5" />
          </Kbd>
          navegar
        </span>
        <span className="inline-flex items-center gap-1">
          <Kbd>
            <CornerDownLeft className="h-2.5 w-2.5" />
          </Kbd>
          selecionar
        </span>
      </div>
      <span className="inline-flex items-center gap-1">
        <Kbd>esc</Kbd>
        fechar
      </span>
    </div>
  );
}

function Kbd({ children }: { readonly children: React.ReactNode }) {
  return (
    <kbd className="inline-flex h-4 min-w-4 items-center justify-center rounded-sm bg-surface-container-high px-1 text-[10px] font-semibold text-on-surface-variant">
      {children}
    </kbd>
  );
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
}
