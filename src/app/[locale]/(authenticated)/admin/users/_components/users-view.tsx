"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight, Plus, Search, UserCog } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { SearchableSelect } from "@/components/ui/searchable-select";
import type {
  AdminUserPublic,
  PaginatedAdminUsers,
  PlanOption,
} from "@/lib/services";
import { AdminHeader } from "../../_components/admin-header";
import { formatDate } from "../../_lib/format";
import {
  createAdminUserAction,
  updateAdminUserAction,
} from "../actions";
import { UserFormModal, type UserFormValues } from "./user-form-modal";

const SEARCH_DEBOUNCE_MS = 300;

interface UsersViewFilters {
  readonly search: string;
  readonly planId: string;
  readonly onboardingStatus: string;
}

interface UsersViewProps {
  readonly initialPage: PaginatedAdminUsers;
  readonly initialPlans: readonly PlanOption[];
  readonly filters: UsersViewFilters;
  readonly errorMessage: string | null;
}

export function UsersView({
  initialPage,
  initialPlans,
  filters,
  errorMessage,
}: UsersViewProps) {
  const t = useTranslations("admin.users");
  const tc = useTranslations("admin.common");
  const tCommon = useTranslations("common");

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [searchInput, setSearchInput] = useState(filters.search);
  const [formState, setFormState] = useState<
    | { mode: "create" }
    | { mode: "edit"; user: AdminUserPublic }
    | null
  >(null);
  const [pendingRoleChange, setPendingRoleChange] = useState<
    | {
        readonly id: string;
        readonly values: UserFormValues;
        readonly target: "admin" | "user";
      }
    | null
  >(null);
  const [isMutating, startMutation] = useTransition();
  const [isRefreshing, startRefresh] = useTransition();

  const searchParamsRef = useRef(searchParams);
  searchParamsRef.current = searchParams;
  const searchTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (searchTimerRef.current !== null) {
        window.clearTimeout(searchTimerRef.current);
      }
    };
  }, []);

  function pushParams(mutate: (p: URLSearchParams) => void) {
    const next = new URLSearchParams(searchParamsRef.current.toString());
    mutate(next);
    const qs = next.toString();
    startRefresh(() => {
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    });
  }

  function commitSearch(value: string) {
    pushParams((p) => {
      const trimmed = value.trim();
      if (trimmed) p.set("search", trimmed);
      else p.delete("search");
      p.delete("page");
    });
  }

  function handleSearchChange(value: string) {
    setSearchInput(value);
    if (searchTimerRef.current !== null) {
      window.clearTimeout(searchTimerRef.current);
    }
    searchTimerRef.current = window.setTimeout(() => {
      commitSearch(value);
    }, SEARCH_DEBOUNCE_MS);
  }

  function handleFilterChange(key: keyof UsersViewFilters, value: string) {
    pushParams((p) => {
      if (value) p.set(key, value);
      else p.delete(key);
      p.delete("page");
    });
  }

  function goToPage(n: number) {
    pushParams((p) => {
      if (n <= 1) p.delete("page");
      else p.set("page", String(n));
    });
  }

  function handleCreateSubmit(values: UserFormValues) {
    startMutation(async () => {
      const result = await createAdminUserAction(values);
      if (!result.success || !result.data) {
        const code = result.error;
        toast.error(
          code === "EMAIL_EXISTS"
            ? t("emailExists")
            : (code ?? tc("loadError")),
        );
        return;
      }
      setFormState(null);
      toast.success(t("created"));
      router.refresh();
    });
  }

  function handleEditSubmit(values: UserFormValues) {
    if (formState?.mode !== "edit") return;
    const currentRole = formState.user.role;
    const nextRole = values.role;
    if (nextRole && nextRole !== currentRole) {
      setPendingRoleChange({
        id: formState.user.id,
        values,
        target: nextRole,
      });
      return;
    }
    submitEdit(formState.user.id, values);
  }

  function submitEdit(id: string, values: UserFormValues) {
    startMutation(async () => {
      const result = await updateAdminUserAction(id, values);
      if (!result.success || !result.data) {
        const code = result.error;
        toast.error(
          code === "EMAIL_EXISTS"
            ? t("emailExists")
            : (code ?? tc("loadError")),
        );
        return;
      }
      setFormState(null);
      setPendingRoleChange(null);
      toast.success(t("updated"));
      router.refresh();
    });
  }

  const users = initialPage.items;
  const totalPages = Math.max(
    1,
    Math.ceil(initialPage.total / initialPage.limit),
  );
  const currentPage = Math.min(Math.max(1, initialPage.page), totalPages);
  const canPrev = currentPage > 1;
  const canNext = currentPage < totalPages;
  const rangeStart =
    users.length === 0 ? 0 : (currentPage - 1) * initialPage.limit + 1;
  const rangeEnd = rangeStart + users.length - (users.length === 0 ? 0 : 1);

  const isPending = isMutating || isRefreshing;

  const hasActiveFilters = useMemo(
    () =>
      Boolean(filters.search || filters.planId || filters.onboardingStatus),
    [filters],
  );

  return (
    <div className="space-y-6">
      <AdminHeader
        actions={
          <button
            className="flex h-10 items-center gap-2 rounded-xl bg-gradient-to-br from-primary to-primary-dim px-4 text-sm font-bold text-on-primary shadow-lg shadow-primary/10 disabled:opacity-60"
            disabled={isPending}
            onClick={() => setFormState({ mode: "create" })}
            type="button"
          >
            <Plus className="h-4 w-4" />
            {t("create")}
          </button>
        }
        subtitle={t("subtitle")}
        title={t("title")}
      />

      {errorMessage && (
        <div className="rounded-xl bg-danger-muted px-4 py-3 text-sm text-danger">
          {errorMessage}
        </div>
      )}

      <div className="grid gap-3 rounded-xl bg-surface-container-lowest p-4 sm:grid-cols-2 lg:grid-cols-4">
        <label className="relative col-span-full lg:col-span-2">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-on-surface-variant" />
          <input
            className="h-10 w-full rounded-lg bg-surface-container-high pl-9 pr-3 text-sm text-on-surface outline-none placeholder:text-on-surface-variant focus:bg-surface-container-lowest focus:ring-1 focus:ring-primary/30"
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder={t("filters.searchPlaceholder")}
            type="search"
            value={searchInput}
          />
        </label>
        <SearchableSelect
          allowClear
          clearLabel={t("filters.allPlans")}
          onChange={(v) => handleFilterChange("planId", v)}
          options={initialPlans.map((p) => ({ value: p.id, label: p.name }))}
          placeholder={t("filters.allPlans")}
          value={filters.planId}
        />
        <select
          className={FILTER_SELECT_CLASS}
          onChange={(e) =>
            handleFilterChange("onboardingStatus", e.target.value)
          }
          value={filters.onboardingStatus}
        >
          <option value="">{t("filters.allOnboarding")}</option>
          <option value="pending">{t("filters.onboardingPending")}</option>
          <option value="completed">{t("filters.onboardingCompleted")}</option>
        </select>
      </div>

      {users.length === 0 ? (
        <div className="rounded-xl bg-surface-container-lowest p-8 text-center text-sm text-on-surface-variant">
          {hasActiveFilters ? t("emptyFiltered") : t("empty")}
        </div>
      ) : (
        <div
          aria-busy={isRefreshing}
          className="overflow-hidden rounded-xl bg-surface-container-lowest shadow-ambient transition-opacity"
          style={{ opacity: isRefreshing ? 0.6 : 1 }}
        >
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs font-semibold uppercase tracking-widest text-on-surface-variant">
                <th className="px-5 py-3">{t("table.name")}</th>
                <th className="px-5 py-3">{t("table.email")}</th>
                <th className="px-5 py-3">{t("table.createdAt")}</th>
                <th className="px-5 py-3">{t("table.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr
                  className="border-t border-surface-container-high"
                  key={user.id}
                >
                  <td className="px-5 py-3 font-medium text-on-surface">
                    {user.name ?? tc("noSelection")}
                  </td>
                  <td className="px-5 py-3 text-on-surface-variant">
                    {user.email}
                  </td>
                  <td className="px-5 py-3 text-on-surface-variant">
                    {formatDate(user.createdAt)}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex gap-3">
                      <Link
                        className="text-sm font-semibold text-primary hover:underline"
                        href={`/admin/users/${user.id}`}
                      >
                        {t("table.view")}
                      </Link>
                      <button
                        className="text-sm font-semibold text-on-surface-variant hover:text-on-surface"
                        onClick={() => setFormState({ mode: "edit", user })}
                        type="button"
                      >
                        <UserCog className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {initialPage.total > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-on-surface-variant">
          <span>
            {t("pagination.showing", {
              from: rangeStart,
              to: rangeEnd,
              total: initialPage.total,
            })}
          </span>
          <div className="flex items-center gap-2">
            <button
              aria-label={t("pagination.previous")}
              className="flex size-9 items-center justify-center rounded-lg bg-surface-container-high text-on-surface-variant transition-opacity hover:opacity-80 disabled:opacity-40"
              disabled={!canPrev || isRefreshing}
              onClick={() => goToPage(currentPage - 1)}
              type="button"
            >
              <ChevronLeft className="size-4" />
            </button>
            <span className="min-w-[5rem] text-center font-mono text-xs uppercase tracking-widest">
              {t("pagination.pageOf", { page: currentPage, total: totalPages })}
            </span>
            <button
              aria-label={t("pagination.next")}
              className="flex size-9 items-center justify-center rounded-lg bg-surface-container-high text-on-surface-variant transition-opacity hover:opacity-80 disabled:opacity-40"
              disabled={!canNext || isRefreshing}
              onClick={() => goToPage(currentPage + 1)}
              type="button"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
      )}

      <UserFormModal
        initialUser={formState?.mode === "edit" ? formState.user : null}
        isPending={isMutating}
        mode={formState?.mode ?? "create"}
        onClose={() => setFormState(null)}
        onSubmit={
          formState?.mode === "edit" ? handleEditSubmit : handleCreateSubmit
        }
        open={formState !== null}
        plans={initialPlans}
      />

      <ConfirmDialog
        cancelLabel={tCommon("cancel")}
        confirmLabel={tCommon("confirm")}
        description={
          pendingRoleChange?.target === "admin"
            ? t("roleChange.promoteWarning")
            : t("roleChange.demoteWarning")
        }
        isPending={isMutating}
        onCancel={() => setPendingRoleChange(null)}
        onConfirm={() => {
          if (!pendingRoleChange) return;
          submitEdit(pendingRoleChange.id, pendingRoleChange.values);
        }}
        open={pendingRoleChange !== null}
        title={
          pendingRoleChange?.target === "admin"
            ? t("roleChange.promoteTitle")
            : t("roleChange.demoteTitle")
        }
        variant="danger"
      />
    </div>
  );
}

const FILTER_SELECT_CLASS =
  "h-10 w-full rounded-lg bg-surface-container-high px-3 text-sm text-on-surface outline-none focus:bg-surface-container-lowest focus:ring-1 focus:ring-primary/30";
