"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  ChevronLeft,
  ChevronRight,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { BrlInput } from "@/components/ui/brl-input";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import type { PaginatedAdminPlans, PlanPublic } from "@/lib/services";
import { AdminHeader } from "../../_components/admin-header";
import { Modal } from "../../_components/modal";
import { formatBRL, formatDate } from "../../_lib/format";
import {
  createPlanAction,
  deletePlanAction,
  updatePlanAction,
} from "../actions";

const MAX_COST_CENTS = 99_999_999; // matches backend cap of 999999.99
const SEARCH_DEBOUNCE_MS = 300;

interface PlansViewFilters {
  readonly search: string;
}

interface PlansViewProps {
  readonly initialPage: PaginatedAdminPlans;
  readonly filters: PlansViewFilters;
  readonly errorMessage: string | null;
}

export function PlansView({
  initialPage,
  filters,
  errorMessage,
}: PlansViewProps) {
  const t = useTranslations("admin.plans");
  const tc = useTranslations("common");
  const tCommon = useTranslations("admin.common");

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [searchInput, setSearchInput] = useState(filters.search);
  const [formState, setFormState] = useState<
    { mode: "create" } | { mode: "edit"; plan: PlanPublic } | null
  >(null);
  const [toDelete, setToDelete] = useState<PlanPublic | null>(null);
  const [name, setName] = useState("");
  const [costCents, setCostCents] = useState(0);
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

  function goToPage(n: number) {
    pushParams((p) => {
      if (n <= 1) p.delete("page");
      else p.set("page", String(n));
    });
  }

  function openCreate() {
    setName("");
    setCostCents(0);
    setFormState({ mode: "create" });
  }

  function openEdit(plan: PlanPublic) {
    setName(plan.name);
    setCostCents(Math.round(plan.cost * 100));
    setFormState({ mode: "edit", plan });
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!formState) return;
    if (costCents <= 0) {
      toast.error(tCommon("loadError"));
      return;
    }
    const parsedCost = costCents / 100;

    startMutation(async () => {
      if (formState.mode === "create") {
        const result = await createPlanAction({
          name: name.trim(),
          cost: parsedCost,
        });
        if (!result.success || !result.data) {
          toast.error(result.error ?? tCommon("loadError"));
          return;
        }
        toast.success(t("created"));
      } else {
        const result = await updatePlanAction(formState.plan.id, {
          name: name.trim(),
          cost: parsedCost,
        });
        if (!result.success || !result.data) {
          toast.error(result.error ?? tCommon("loadError"));
          return;
        }
        toast.success(t("updated"));
      }
      setFormState(null);
      router.refresh();
    });
  }

  function confirmDelete() {
    if (!toDelete) return;
    const plan = toDelete;
    startMutation(async () => {
      const result = await deletePlanAction(plan.id);
      if (!result.success) {
        toast.error(result.error ?? tCommon("loadError"));
        return;
      }
      setToDelete(null);
      toast.success(t("deleted"));
      router.refresh();
    });
  }

  const plans = initialPage.items;
  const totalPages = Math.max(
    1,
    Math.ceil(initialPage.total / initialPage.limit),
  );
  const currentPage = Math.min(Math.max(1, initialPage.page), totalPages);
  const canPrev = currentPage > 1;
  const canNext = currentPage < totalPages;
  const rangeStart =
    plans.length === 0 ? 0 : (currentPage - 1) * initialPage.limit + 1;
  const rangeEnd = rangeStart + plans.length - (plans.length === 0 ? 0 : 1);
  const hasActiveFilters = Boolean(filters.search);

  const isPending = isMutating || isRefreshing;

  return (
    <div className="space-y-6">
      <AdminHeader
        actions={
          <button
            className="flex h-10 items-center gap-2 rounded-xl bg-gradient-to-br from-primary to-primary-dim px-4 text-sm font-bold text-on-primary shadow-lg shadow-primary/10 disabled:opacity-60"
            disabled={isPending}
            onClick={openCreate}
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

      <div className="rounded-xl bg-surface-container-lowest p-4">
        <label className="relative block">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-on-surface-variant" />
          <input
            className="h-10 w-full rounded-lg bg-surface-container-high pl-9 pr-3 text-sm text-on-surface outline-none placeholder:text-on-surface-variant focus:bg-surface-container-lowest focus:ring-1 focus:ring-primary/30"
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder={t("filters.searchPlaceholder")}
            type="search"
            value={searchInput}
          />
        </label>
      </div>

      {plans.length === 0 ? (
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
                <th className="px-5 py-3">{t("table.cost")}</th>
                <th className="px-5 py-3">{t("table.createdAt")}</th>
                <th className="px-5 py-3">{t("table.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {plans.map((plan) => (
                <tr
                  className="border-t border-surface-container-high"
                  key={plan.id}
                >
                  <td className="px-5 py-3 font-medium text-on-surface">
                    {plan.name}
                  </td>
                  <td className="px-5 py-3 text-on-surface-variant">
                    {formatBRL(plan.cost)}
                  </td>
                  <td className="px-5 py-3 text-on-surface-variant">
                    {formatDate(plan.createdAt)}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex gap-3">
                      <button
                        className="text-on-surface-variant hover:text-on-surface"
                        onClick={() => openEdit(plan)}
                        type="button"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        className="text-on-surface-variant hover:text-danger"
                        disabled={isPending}
                        onClick={() => setToDelete(plan)}
                        type="button"
                      >
                        <Trash2 className="h-4 w-4" />
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

      <Modal
        onClose={() => setFormState(null)}
        open={formState !== null}
        title={
          formState?.mode === "create"
            ? t("form.createTitle")
            : t("form.editTitle")
        }
      >
        <form className="space-y-4" onSubmit={handleSubmit}>
          <label className="block space-y-1">
            <span className="font-display text-xs font-semibold text-on-surface">
              {t("form.name")}
            </span>
            <input
              className="h-10 w-full rounded-lg bg-surface-container-high px-3 text-sm text-on-surface outline-none focus:bg-surface-container-lowest focus:ring-1 focus:ring-primary/30"
              onChange={(e) => setName(e.target.value)}
              required
              value={name}
            />
          </label>
          <label className="block space-y-1">
            <span className="font-display text-xs font-semibold text-on-surface">
              {t("form.cost")}
            </span>
            <BrlInput
              cents={costCents}
              className="h-10 w-full rounded-lg bg-surface-container-high px-3 text-sm text-on-surface outline-none focus:bg-surface-container-lowest focus:ring-1 focus:ring-primary/30"
              max={MAX_COST_CENTS}
              onChange={setCostCents}
              required
            />
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <button
              className="h-10 rounded-xl px-4 text-sm font-semibold text-on-surface-variant hover:text-on-surface"
              onClick={() => setFormState(null)}
              type="button"
            >
              {tc("cancel")}
            </button>
            <button
              className="h-10 rounded-xl bg-gradient-to-br from-primary to-primary-dim px-5 text-sm font-bold text-on-primary shadow-lg shadow-primary/10 disabled:opacity-60"
              disabled={isMutating}
              type="submit"
            >
              {tc("save")}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        cancelLabel={tc("cancel")}
        confirmLabel={tc("delete")}
        description={t("deleteConfirm")}
        isPending={isMutating}
        onCancel={() => setToDelete(null)}
        onConfirm={confirmDelete}
        open={toDelete !== null}
        title={tc("confirm")}
        variant="danger"
      />
    </div>
  );
}
