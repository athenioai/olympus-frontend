"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { motion } from "motion/react";
import {
  Megaphone,
  MoreVertical,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { cn } from "@/lib/utils";
import { fadeInUp, staggerContainer } from "@/lib/motion";
import { createAd, deleteAd, toggleAdStatus, updateAd } from "../actions";
import type { Ad, Product, Service } from "@/lib/services";
import { AdFormModal } from "./ad-form-modal";

interface AdsTableProps {
  readonly ads: readonly Ad[];
  readonly services: readonly Service[];
  readonly products: readonly Product[];
}

type StatusFilter = "all" | "active" | "inactive";

export function AdsTable({ ads, services, products }: AdsTableProps) {
  const t = useTranslations("ads");
  const tc = useTranslations("common");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Ad | null>(null);
  const [adToDelete, setAdToDelete] = useState<Ad | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [optimisticActive, setOptimisticActive] = useState<
    Record<string, boolean>
  >({});

  function resolveActive(ad: Ad): boolean {
    const override = optimisticActive[ad.id];
    if (typeof override === "boolean") return override;
    return ad.active;
  }

  const filtered = useMemo(() => {
    let result = [...ads];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((a) => a.name.toLowerCase().includes(q));
    }
    if (statusFilter !== "all") {
      const wantActive = statusFilter === "active";
      result = result.filter((a) => resolveActive(a) === wantActive);
    }
    return result;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ads, searchQuery, statusFilter, optimisticActive]);

  function handleCreate(formData: FormData) {
    startTransition(async () => {
      const result = await createAd(formData);
      if (result.success) {
        setCreating(false);
        router.refresh();
      } else {
        toast.error(result.error ?? tc("error"));
      }
    });
  }

  function handleUpdate(formData: FormData) {
    if (!editing) return;
    startTransition(async () => {
      const result = await updateAd(editing.id, formData);
      if (result.success) {
        setEditing(null);
        router.refresh();
      } else {
        toast.error(result.error ?? tc("error"));
      }
    });
  }

  function handleConfirmDelete() {
    if (!adToDelete) return;
    const target = adToDelete;
    startTransition(async () => {
      const result = await deleteAd(target.id);
      if (result.success) {
        setAdToDelete(null);
        router.refresh();
      } else {
        toast.error(result.error ?? tc("error"));
      }
    });
  }

  function handleToggleStatus(id: string, active: boolean) {
    setOptimisticActive((prev) => ({ ...prev, [id]: active }));
    startTransition(async () => {
      const result = await toggleAdStatus(id, active);
      setOptimisticActive((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      if (!result.success) {
        toast.error(result.error ?? tc("error"));
        return;
      }
      router.refresh();
    });
  }

  return (
    <motion.div animate="visible" initial="hidden" variants={staggerContainer}>
      <motion.div className="mb-8" variants={fadeInUp}>
        <div className="flex items-end justify-between">
          <div>
            <h1 className="font-display text-2xl font-extrabold tracking-tight text-on-surface">
              {t("title")}
            </h1>
            <p className="mt-1 text-sm text-on-surface-variant">
              {t("subtitle")}
            </p>
          </div>
          <button
            className="flex h-10 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-on-primary transition-opacity hover:opacity-90"
            onClick={() => setCreating(true)}
            type="button"
          >
            <Plus className="h-4 w-4" />
            {t("newAd")}
          </button>
        </div>
      </motion.div>

      <motion.div
        className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center"
        variants={fadeInUp}
      >
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant/50" />
          <input
            className="h-10 w-full rounded-xl bg-surface-container-lowest pl-10 pr-4 text-sm text-on-surface shadow-[inset_0_0_0_1px_rgba(175,179,176,0.15)] outline-none transition-all placeholder:text-on-surface-variant/50 focus:shadow-[inset_0_0_0_1px_rgba(137,81,0,0.3)]"
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("searchPlaceholder")}
            type="text"
            value={searchQuery}
          />
        </div>
        <div className="flex items-center gap-1 rounded-xl bg-surface-container-lowest p-1 shadow-[inset_0_0_0_1px_rgba(175,179,176,0.15)]">
          {(["all", "active", "inactive"] as const).map((status) => (
            <button
              className={cn(
                "h-8 rounded-lg px-4 text-[13px] font-medium transition-all duration-200",
                statusFilter === status
                  ? "bg-primary/10 text-primary shadow-sm"
                  : "text-on-surface-variant hover:text-on-surface",
              )}
              key={status}
              onClick={() => setStatusFilter(status)}
              type="button"
            >
              {status === "all"
                ? t("allStatuses")
                : status === "active"
                  ? t("active")
                  : t("inactive")}
            </button>
          ))}
        </div>
      </motion.div>

      {filtered.length === 0 ? (
        <motion.div
          className="flex min-h-[320px] flex-col items-center justify-center rounded-xl bg-surface-container-lowest p-8"
          variants={fadeInUp}
        >
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-container-high">
            <Megaphone className="h-7 w-7 text-on-surface-variant/40" />
          </div>
          <p className="font-display text-sm font-semibold text-on-surface-variant">
            {ads.length === 0 ? t("empty") : tc("noResults")}
          </p>
        </motion.div>
      ) : (
        <motion.div className="space-y-2" variants={staggerContainer}>
          {filtered.map((ad) => (
            <AdRow
              active={resolveActive(ad)}
              ad={ad}
              isPending={isPending}
              key={ad.id}
              onDelete={() => setAdToDelete(ad)}
              onEdit={setEditing}
              onToggleStatus={handleToggleStatus}
            />
          ))}
        </motion.div>
      )}

      {creating && (
        <AdFormModal
          isPending={isPending}
          onClose={() => setCreating(false)}
          onSubmit={handleCreate}
          products={products}
          services={services}
        />
      )}
      {editing && (
        <AdFormModal
          ad={editing}
          isPending={isPending}
          onClose={() => setEditing(null)}
          onSubmit={handleUpdate}
          products={products}
          services={services}
        />
      )}
      <ConfirmDialog
        cancelLabel={tc("cancel")}
        confirmLabel={tc("delete")}
        description={t("deleteConfirm")}
        isPending={isPending}
        onCancel={() => setAdToDelete(null)}
        onConfirm={handleConfirmDelete}
        open={adToDelete !== null}
        title={tc("confirm")}
        variant="danger"
      />
    </motion.div>
  );
}

interface AdRowProps {
  readonly ad: Ad;
  readonly active: boolean;
  readonly onEdit: (ad: Ad) => void;
  readonly onDelete: () => void;
  readonly onToggleStatus: (id: string, active: boolean) => void;
  readonly isPending: boolean;
}

function AdRow({
  ad,
  active,
  onEdit,
  onDelete,
  onToggleStatus,
  isPending,
}: AdRowProps) {
  const t = useTranslations("ads");
  return (
    <motion.div
      className="grid items-center gap-4 rounded-xl bg-surface-container-lowest px-5 py-4 transition-colors hover:bg-surface-container-low/50 sm:grid-cols-[2fr_1fr_auto_48px]"
      variants={fadeInUp}
    >
      <div className="min-w-0">
        <h3 className="truncate font-display text-[15px] font-bold tracking-tight text-on-surface">
          {ad.name}
        </h3>
        <p className="mt-0.5 line-clamp-1 text-[13px] text-on-surface-variant">
          {ad.content}
        </p>
        <p className="mt-1 text-[12px] text-on-surface-variant/70">
          {ad.platform.charAt(0).toUpperCase() + ad.platform.slice(1)}
          {" · "}
          {ad.items.length === 0
            ? t("noItems")
            : t("itemsCount", { count: ad.items.length })}
        </p>
      </div>

      <div className="hidden justify-center sm:flex">
        <StatusToggle
          active={active}
          disabled={isPending}
          onToggle={() => onToggleStatus(ad.id, !active)}
        />
      </div>

      <div className="hidden text-[12px] font-medium text-on-surface-variant sm:block">
        {active ? t("active") : t("inactive")}
      </div>

      <div className="flex justify-end">
        <ActionsMenu
          isPending={isPending}
          onDelete={onDelete}
          onEdit={() => onEdit(ad)}
        />
      </div>
    </motion.div>
  );
}

interface StatusToggleProps {
  readonly active: boolean;
  readonly onToggle: () => void;
  readonly disabled?: boolean;
}

function StatusToggle({ active, onToggle, disabled }: StatusToggleProps) {
  return (
    <button
      className={cn(
        "relative h-7 w-12 rounded-full transition-colors duration-200",
        active ? "bg-primary" : "bg-surface-container-high",
        disabled && "opacity-50",
      )}
      disabled={disabled}
      onClick={onToggle}
      type="button"
    >
      <div
        className={cn(
          "absolute top-1 h-5 w-5 rounded-full bg-surface-container-lowest shadow-sm transition-transform duration-200",
          active ? "translate-x-6" : "translate-x-1",
        )}
      />
    </button>
  );
}

interface ActionsMenuProps {
  readonly onEdit: () => void;
  readonly onDelete: () => void;
  readonly isPending: boolean;
}

function ActionsMenu({ onEdit, onDelete, isPending }: ActionsMenuProps) {
  const tc = useTranslations("common");
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        className="flex h-9 w-9 items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface"
        onClick={() => setOpen((p) => !p)}
        type="button"
      >
        <MoreVertical className="h-5 w-5" />
      </button>
      {open && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
            onKeyDown={() => {}}
            role="presentation"
          />
          <div className="absolute right-0 top-full z-20 mt-1 w-36 overflow-hidden rounded-xl bg-surface-container-lowest py-1 shadow-ambient-strong">
            <button
              className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-on-surface transition-colors hover:bg-surface-container-low"
              onClick={() => {
                setOpen(false);
                onEdit();
              }}
              type="button"
            >
              <Pencil className="h-4 w-4 text-on-surface-variant" />
              {tc("edit")}
            </button>
            <button
              className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-danger transition-colors hover:bg-danger-muted"
              disabled={isPending}
              onClick={() => {
                setOpen(false);
                onDelete();
              }}
              type="button"
            >
              <Trash2 className="h-4 w-4" />
              {tc("delete")}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
