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
  Settings,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  LogOut,
  Shield,
  CreditCard,
  FileText,
  Receipt,
} from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { LanguageSwitcher } from "@/components/language-switcher";
import { logoutAction } from "@/app/[locale]/(authenticated)/actions";
import type { AuthUser } from "@/lib/services/interfaces/auth-service";

interface SidebarProps {
  readonly user: AuthUser;
}

interface NavItem {
  readonly key: string;
  readonly href: string;
  readonly icon: React.ComponentType<{ className?: string }>;
  readonly labelKey: string;
}

const USER_NAV: NavItem[] = [
  { key: "dashboard", href: "/dashboard", icon: LayoutDashboard, labelKey: "sidebar.dashboard" },
  { key: "crm", href: "/crm", icon: Users, labelKey: "sidebar.crm" },
  { key: "conversations", href: "/conversations", icon: MessageSquare, labelKey: "sidebar.conversations" },
  { key: "calendar", href: "/calendar", icon: CalendarDays, labelKey: "sidebar.calendar" },
  { key: "services", href: "/services", icon: Package, labelKey: "sidebar.services" },
  { key: "products", href: "/products", icon: ShoppingBag, labelKey: "sidebar.products" },
  { key: "settings", href: "/settings", icon: Settings, labelKey: "sidebar.settings" },
];

const ADMIN_NAV: NavItem[] = [
  { key: "admin-dashboard", href: "/admin/dashboard", icon: Shield, labelKey: "sidebar.admin.dashboard" },
  { key: "admin-users", href: "/admin/users", icon: Users, labelKey: "sidebar.admin.users" },
  { key: "admin-plans", href: "/admin/plans", icon: CreditCard, labelKey: "sidebar.admin.plans" },
  { key: "admin-subscriptions", href: "/admin/subscriptions", icon: FileText, labelKey: "sidebar.admin.subscriptions" },
  { key: "admin-invoices", href: "/admin/admin-invoices", icon: Receipt, labelKey: "sidebar.admin.invoices" },
];

const STORAGE_KEY = "olympus-sidebar-collapsed";

function getVisibleUserNav(workType: AuthUser["workType"]): NavItem[] {
  return USER_NAV.filter((item) => {
    if (item.key === "services") return workType === "services" || workType === "hybrid";
    if (item.key === "products") return workType === "sales" || workType === "hybrid";
    return true;
  });
}

export function Sidebar({ user }: SidebarProps) {
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

  const visibleNav = getVisibleUserNav(user.workType);
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
      <nav className="flex-1 space-y-1 px-3 py-4">
        {visibleNav.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-primary/8 text-primary"
                  : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
              }`}
              href={item.href}
              key={item.key}
            >
              {active && (
                <div className="absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-r-full bg-primary" />
              )}
              <item.icon className={`h-5 w-5 shrink-0 ${active ? "text-primary" : ""}`} />
              {!collapsed && <span>{t(item.labelKey)}</span>}
            </Link>
          );
        })}

        {/* Admin section — hidden until admin routes are implemented (post-MVP) */}
        {isAdmin && false && (
          <>
            <div className="my-4 h-px bg-surface-container-high" />
            {!collapsed && (
              <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/60">
                {t("sidebar.admin.title")}
              </p>
            )}
            {ADMIN_NAV.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                    active
                      ? "bg-primary/8 text-primary"
                      : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
                  }`}
                  href={item.href}
                  key={item.key}
                >
                  {active && (
                    <div className="absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-r-full bg-primary" />
                  )}
                  <item.icon className={`h-5 w-5 shrink-0 ${active ? "text-primary" : ""}`} />
                  {!collapsed && <span>{t(item.labelKey)}</span>}
                </Link>
              );
            })}
          </>
        )}
      </nav>

      {/* Footer */}
      <div className="space-y-2 px-3 pb-4">
        <LanguageSwitcher />
        <button
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-danger"
          onClick={handleLogout}
          type="button"
        >
          <LogOut className="h-5 w-5 shrink-0" />
          {!collapsed && <span>{t("auth.logout")}</span>}
        </button>
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

      {/* Mobile drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[300px] bg-surface-container-lowest transition-transform duration-300 lg:hidden ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {navContent}
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
