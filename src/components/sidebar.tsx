"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  LayoutDashboard,
  Users,
  MessageSquare,
  CalendarDays,
  Package,
  ShoppingBag,
  Building2,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  LogOut,
  Shield,
  CreditCard,
  FileText,
  Receipt,
  Filter,
  Sparkles,
} from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { Tooltip } from "@/components/ui/tooltip";
import { LanguageSwitcher } from "@/components/language-switcher";
import { logoutAction } from "@/app/[locale]/(authenticated)/actions";
import type { AuthUser } from "@/lib/services/interfaces/auth-service";
import type { WorkType } from "@/lib/services";

interface SidebarProps {
  readonly user: AuthUser;
  /**
   * Drives which catalog items (Services / Products) appear in the nav.
   * `null` means "we don't know yet" (pre-onboarding or profile fetch
   * failed) — treat as permissive and render every item rather than
   * hiding navigation from a user we can't classify.
   */
  readonly workType: WorkType | null;
}

interface NavItem {
  readonly key: string;
  readonly href: string;
  readonly icon: React.ComponentType<{ className?: string }>;
  readonly labelKey: string;
  /** When true, opens in a new tab (skips Next.js client routing). */
  readonly external?: boolean;
}

const USER_NAV: NavItem[] = [
  { key: "dashboard", href: "/dashboard", icon: LayoutDashboard, labelKey: "sidebar.dashboard" },
  { key: "crm", href: "/crm", icon: Filter, labelKey: "sidebar.crm" },
  { key: "leads", href: "/leads", icon: Users, labelKey: "sidebar.leads" },
  { key: "conversations", href: "/conversations", icon: MessageSquare, labelKey: "sidebar.conversations" },
  { key: "calendar", href: "/calendar", icon: CalendarDays, labelKey: "sidebar.calendar" },
  { key: "services", href: "/services", icon: Package, labelKey: "sidebar.services" },
  { key: "products", href: "/products", icon: ShoppingBag, labelKey: "sidebar.products" },
  { key: "settings", href: "/settings", icon: Building2, labelKey: "sidebar.business" },
];

const ADMIN_NAV: NavItem[] = [
  { key: "admin-dashboard", href: "/admin/dashboard", icon: Shield, labelKey: "sidebar.admin.dashboard" },
  { key: "admin-users", href: "/admin/users", icon: Users, labelKey: "sidebar.admin.users" },
  { key: "admin-plans", href: "/admin/plans", icon: CreditCard, labelKey: "sidebar.admin.plans" },
  { key: "admin-subscriptions", href: "/admin/subscriptions", icon: FileText, labelKey: "sidebar.admin.subscriptions" },
  { key: "admin-invoices", href: "/admin/invoices", icon: Receipt, labelKey: "sidebar.admin.invoices" },
  { key: "admin-avatars", href: "/admin/agent-avatars", icon: Sparkles, labelKey: "sidebar.admin.avatars" },
];

const STORAGE_KEY = "olympus-sidebar-collapsed";

function getVisibleUserNav(workType: WorkType | null): NavItem[] {
  if (workType === null) return USER_NAV;
  return USER_NAV.filter((item) => {
    if (item.key === "services") return workType === "services" || workType === "hybrid";
    if (item.key === "products") return workType === "sales" || workType === "hybrid";
    return true;
  });
}

function renderNavLink(
  item: NavItem,
  isActive: (href: string) => boolean,
  collapsed: boolean,
  t: (key: string) => string,
) {
  const active = !item.external && isActive(item.href);
  const label = t(item.labelKey);
  const linkClassName = `group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
    active
      ? "bg-primary/8 text-primary"
      : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
  }`;
  const linkContent = (
    <>
      {active && (
        <div className="absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-r-full bg-primary" />
      )}
      <item.icon className={`h-5 w-5 shrink-0 ${active ? "text-primary" : ""}`} />
      {!collapsed && <span>{label}</span>}
    </>
  );
  const link = item.external ? (
    <a
      className={linkClassName}
      href={item.href}
      rel="noopener noreferrer"
      target="_blank"
    >
      {linkContent}
    </a>
  ) : (
    <Link className={linkClassName} href={item.href}>
      {linkContent}
    </Link>
  );

  if (!collapsed) {
    return <div key={item.key}>{link}</div>;
  }

  return (
    <div key={item.key}>
      <Tooltip content={label} side="right">
        {link}
      </Tooltip>
    </div>
  );
}

export function Sidebar({ user, workType }: SidebarProps) {
  const t = useTranslations();
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "true") setCollapsed(true);
  }, []);

  function toggleCollapsed() {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem(STORAGE_KEY, String(next));
  }

  function isActive(href: string): boolean {
    const logicalPath = pathname.replace(/^\/(pt-BR|en-US|es)/, "");
    return logicalPath === href || logicalPath.startsWith(`${href}/`);
  }

  async function handleLogout() {
    await logoutAction();
    router.push("/login");
  }

  const visibleNav = getVisibleUserNav(workType);
  const isAdmin = user.role === "admin";

  const navContent = (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex h-16 items-center justify-between px-4">
        {!collapsed && <Logo />}
        <button
          className="hidden rounded-lg p-1.5 text-on-surface-variant transition-colors hover:bg-surface-container-high lg:block"
          onClick={toggleCollapsed}
          type="button"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
        <button
          className="rounded-lg p-1.5 text-on-surface-variant lg:hidden"
          onClick={() => setMobileOpen(false)}
          type="button"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {/* Admin section — rendered above user nav for quick access */}
        {isAdmin && (
          <>
            {!collapsed && (
              <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/60">
                {t("sidebar.admin.title")}
              </p>
            )}
            {ADMIN_NAV.map((item) => renderNavLink(item, isActive, collapsed, t))}
            <div className="my-4 h-px bg-surface-container-high" />
          </>
        )}

        {visibleNav.map((item) => renderNavLink(item, isActive, collapsed, t))}
      </nav>

      {/* Footer */}
      <div className="space-y-2 px-3 pb-4">
        {!collapsed && (
          <div className="flex items-center justify-between px-3 py-2 text-[11px] text-on-surface-variant/70">
            <span>Busca rápida</span>
            <kbd className="inline-flex items-center gap-0.5 rounded-md bg-surface-container-high px-1.5 py-0.5 font-semibold">
              ⌘K
            </kbd>
          </div>
        )}
        <LanguageSwitcher />
        {(() => {
          const logoutButton = (
            <button
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-danger"
              onClick={handleLogout}
              type="button"
            >
              <LogOut className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{t("auth.logout")}</span>}
            </button>
          );
          return collapsed ? (
            <Tooltip content={t("auth.logout")} side="right">
              {logoutButton}
            </Tooltip>
          ) : (
            logoutButton
          );
        })()}
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        className="fixed left-4 top-4 z-50 rounded-xl bg-surface-container-lowest p-2 shadow-ambient lg:hidden"
        onClick={() => setMobileOpen(true)}
        type="button"
      >
        <Menu className="h-5 w-5 text-on-surface" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-on-surface/20 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
          onKeyDown={() => {}}
          role="presentation"
        />
      )}

      {/* Mobile drawer — only mounts `navContent` when open, otherwise both
          aside copies coexist in the DOM and QA sees two "Sair" buttons
          (mobile one hidden off-screen, desktop one visible). */}
      <aside
        aria-hidden={!mobileOpen}
        className={`fixed inset-y-0 left-0 z-50 w-[300px] bg-surface-container-lowest transition-transform duration-300 lg:hidden ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {mobileOpen ? navContent : null}
      </aside>

      {/* Desktop sidebar */}
      <aside
        className={`hidden h-screen shrink-0 bg-surface-container-lowest transition-[width] duration-300 lg:block ${
          collapsed ? "w-16" : "w-[260px]"
        }`}
      >
        {navContent}
      </aside>
    </>
  );
}
