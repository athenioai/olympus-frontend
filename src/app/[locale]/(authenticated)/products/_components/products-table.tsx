"use client";

import { useState, useMemo, useTransition, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import { motion } from "motion/react";
import {
  Pencil,
  Trash2,
  ImageIcon,
  Search,
  Plus,
  MoreVertical,
} from "lucide-react";
import { BrlInput } from "@/components/ui/brl-input";
import { cn } from "@/lib/utils";
import { formatBRL } from "@/lib/format";
import { fadeInUp, staggerContainer } from "@/lib/motion";
import { deleteProduct, createProduct, updateProduct, toggleProductStatus } from "../actions";
import type { Product } from "@/lib/services";

const MAX_PRICE_CENTS = 99_999_999;

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ProductsTableProps {
  readonly products: readonly Product[];
}

// ---------------------------------------------------------------------------
// Product form modal
// ---------------------------------------------------------------------------

interface ProductFormModalProps {
  readonly product?: Product;
  readonly onClose: () => void;
  readonly onSubmit: (formData: FormData) => void;
  readonly isPending: boolean;
}

function ProductFormModal({
  product,
  onClose,
  onSubmit,
  isPending,
}: ProductFormModalProps) {
  const t = useTranslations("catalog");
  const tc = useTranslations("common");
  const [priceCents, setPriceCents] = useState(
    product ? Math.round(product.price * 100) : 0,
  );

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
        className="relative z-10 w-full max-w-lg rounded-xl bg-surface-container-lowest p-8 shadow-ambient-strong"
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      >
        <h2 className="mb-6 font-display text-xl font-bold tracking-tight text-on-surface">
          {product ? tc("edit") : t("newProduct")}
        </h2>
        <form action={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-on-surface" htmlFor="prod-name">
              {t("name")}
            </label>
            <input
              className="h-10 w-full rounded-xl bg-surface-container-high px-4 text-sm text-on-surface outline-none transition-colors focus:bg-surface-container-lowest focus:ring-1 focus:ring-primary/30"
              defaultValue={product?.name ?? ""}
              id="prod-name"
              maxLength={255}
              name="name"
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-on-surface" htmlFor="prod-desc">
              {t("description")}
            </label>
            <textarea
              className="min-h-[80px] w-full rounded-xl bg-surface-container-high px-4 py-3 text-sm text-on-surface outline-none transition-colors focus:bg-surface-container-lowest focus:ring-1 focus:ring-primary/30"
              defaultValue={product?.description ?? ""}
              id="prod-desc"
              maxLength={2000}
              name="description"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-on-surface" htmlFor="prod-price">
              {t("price")}
            </label>
            <BrlInput
              cents={priceCents}
              className="h-10 w-full rounded-xl bg-surface-container-high px-4 text-sm text-on-surface outline-none transition-colors focus:bg-surface-container-lowest focus:ring-1 focus:ring-primary/30"
              id="prod-price"
              max={MAX_PRICE_CENTS}
              onChange={setPriceCents}
              required
            />
            <input
              name="price"
              type="hidden"
              value={(priceCents / 100).toFixed(2)}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-on-surface" htmlFor="prod-instructions">
              {t("agentInstructions")}
            </label>
            <textarea
              className="min-h-[80px] w-full rounded-xl bg-surface-container-high px-4 py-3 text-sm text-on-surface outline-none transition-colors focus:bg-surface-container-lowest focus:ring-1 focus:ring-primary/30"
              defaultValue={product?.agentInstructions ?? ""}
              id="prod-instructions"
              maxLength={2000}
              name="agentInstructions"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-on-surface" htmlFor="prod-image">
              {t("image")}
            </label>
            <input
              accept="image/jpeg,image/png,image/webp"
              className="h-10 w-full rounded-xl bg-surface-container-high px-4 text-sm text-on-surface-variant file:mr-4 file:rounded-lg file:border-0 file:bg-primary/8 file:px-3 file:py-1 file:text-sm file:font-medium file:text-primary"
              id="prod-image"
              name="image"
              type="file"
            />
            <p className="text-xs text-on-surface-variant">{t("imageRequirements")}</p>
          </div>
          <div className="flex items-center justify-end gap-3 pt-4">
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

// ---------------------------------------------------------------------------
// Actions menu (three-dot dropdown)
// ---------------------------------------------------------------------------

interface ActionsMenuProps {
  readonly onEdit: () => void;
  readonly onDelete: () => void;
  readonly isPending: boolean;
}

function ActionsMenu({ onEdit, onDelete, isPending }: ActionsMenuProps) {
  const tc = useTranslations("common");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        className="flex h-9 w-9 items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface"
        onClick={() => setOpen((prev) => !prev)}
        type="button"
      >
        <MoreVertical className="h-5 w-5" />
      </button>
      {open && (
        <div className="absolute right-0 top-full z-20 mt-1 w-36 overflow-hidden rounded-xl bg-surface-container-lowest py-1 shadow-ambient-strong">
          <button
            className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-on-surface transition-colors hover:bg-surface-container-low"
            onClick={() => {
              onEdit();
              setOpen(false);
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
              onDelete();
              setOpen(false);
            }}
            type="button"
          >
            <Trash2 className="h-4 w-4" />
            {tc("delete")}
          </button>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Status toggle
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Product row
// ---------------------------------------------------------------------------

interface ProductRowProps {
  readonly product: Product;
  readonly onEdit: (product: Product) => void;
  readonly onDelete: (id: string) => void;
  readonly onToggleStatus: (id: string, active: boolean) => void;
  readonly isPending: boolean;
}

function ProductRow({ product, onEdit, onDelete, onToggleStatus, isPending }: ProductRowProps) {
  return (
    <motion.div
      className="grid items-center rounded-xl bg-surface-container-lowest px-5 py-4 transition-colors hover:bg-surface-container-low/50 sm:grid-cols-[2fr_1fr_1fr_48px]"
      variants={fadeInUp}
    >
      {/* Thumbnail + info */}
      <div className="flex min-w-0 items-center gap-4">
        <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-surface-container-high">
          {product.imageUrl ? (
            <img
              alt={product.name}
              className="h-full w-full object-cover"
              src={product.imageUrl}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <ImageIcon className="h-5 w-5 text-on-surface-variant/40" />
            </div>
          )}
        </div>
        <div className="min-w-0">
          <h3 className="truncate font-display text-[15px] font-bold tracking-tight text-on-surface">
            {product.name}
          </h3>
          {product.description && (
            <p className="mt-0.5 truncate text-[13px] text-on-surface-variant">
              {product.description}
            </p>
          )}
        </div>
      </div>

      {/* Price */}
      <div className="hidden justify-center sm:flex">
        <span className="font-display text-base font-extrabold tracking-tight text-on-surface">
          {formatBRL(product.price)}
        </span>
      </div>

      {/* Status */}
      <div className="hidden justify-center sm:flex">
        <StatusToggle
          active={product.active}
          disabled={isPending}
          onToggle={() => onToggleStatus(product.id, !product.active)}
        />
      </div>

      {/* Actions */}
      <div className="hidden justify-end sm:flex">
        <ActionsMenu
          isPending={isPending}
          onDelete={() => onDelete(product.id)}
          onEdit={() => onEdit(product)}
        />
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

type StatusFilter = "all" | "active" | "inactive";

export function ProductsTable({ products }: ProductsTableProps) {
  const t = useTranslations("catalog");
  const tc = useTranslations("common");
  const [isPending, startTransition] = useTransition();
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const filteredProducts = useMemo(() => {
    let result = [...products];
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((p) => p.name.toLowerCase().includes(query));
    }
    if (statusFilter !== "all") {
      const isActive = statusFilter === "active";
      result = result.filter((p) => p.active === isActive);
    }
    return result;
  }, [products, searchQuery, statusFilter]);

  function handleCreate(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await createProduct(formData);
      if (result.success) {
        setShowCreateModal(false);
      } else {
        setError(result.error ?? null);
      }
    });
  }

  function handleUpdate(formData: FormData) {
    if (!editingProduct) return;
    setError(null);
    startTransition(async () => {
      const result = await updateProduct(editingProduct.id, formData);
      if (result.success) {
        setEditingProduct(null);
      } else {
        setError(result.error ?? null);
      }
    });
  }

  function handleDelete(id: string) {
    if (!confirm(t("deleteConfirm"))) return;
    setError(null);
    startTransition(async () => {
      const result = await deleteProduct(id);
      if (!result.success) {
        setError(result.error ?? null);
      }
    });
  }

  function handleToggleStatus(id: string, active: boolean) {
    setError(null);
    startTransition(async () => {
      const result = await toggleProductStatus(id, active);
      if (!result.success) {
        setError(result.error ?? null);
      }
    });
  }

  return (
    <motion.div animate="visible" initial="hidden" variants={staggerContainer}>
      {/* Header */}
      <motion.div className="mb-8" variants={fadeInUp}>
        <div className="flex items-end justify-between">
          <div>
            <h1 className="font-display text-2xl font-extrabold tracking-tight text-on-surface">
              {t("products")}
            </h1>
            <p className="mt-1 text-sm text-on-surface-variant">
              {filteredProducts.length} {filteredProducts.length === 1 ? "item" : "itens"}
            </p>
          </div>
          <button
            className="flex h-10 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-on-primary transition-opacity hover:opacity-90"
            onClick={() => setShowCreateModal(true)}
            type="button"
          >
            <Plus className="h-4 w-4" />
            {t("newProduct")}
          </button>
        </div>
      </motion.div>

      {/* Filters */}
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

      {/* Error */}
      {error && (
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 rounded-xl bg-danger-muted px-5 py-3.5 text-sm text-danger"
          initial={{ opacity: 0, y: -8 }}
        >
          {error}
        </motion.div>
      )}

      {/* Column headers */}
      <motion.div
        className="mb-3 hidden grid-cols-[2fr_1fr_1fr_48px] items-center px-5 sm:grid"
        variants={fadeInUp}
      >
        <span className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">
          {t("name")}
        </span>
        <span className="text-center text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">
          {t("price")}
        </span>
        <span className="text-center text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">
          Status
        </span>
        <div />
      </motion.div>

      {/* List */}
      {filteredProducts.length === 0 ? (
        <motion.div
          className="flex min-h-[320px] flex-col items-center justify-center rounded-xl bg-surface-container-lowest p-8"
          variants={fadeInUp}
        >
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-container-high">
            <Search className="h-7 w-7 text-on-surface-variant/40" />
          </div>
          <p className="font-display text-sm font-semibold text-on-surface-variant">
            {tc("noResults")}
          </p>
        </motion.div>
      ) : (
        <motion.div className="space-y-2" variants={staggerContainer}>
          {filteredProducts.map((product) => (
            <ProductRow
              isPending={isPending}
              key={product.id}
              onDelete={handleDelete}
              onEdit={setEditingProduct}
              onToggleStatus={handleToggleStatus}
              product={product}
            />
          ))}
        </motion.div>
      )}

      {/* Modals */}
      {showCreateModal && (
        <ProductFormModal
          isPending={isPending}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreate}
        />
      )}
      {editingProduct && (
        <ProductFormModal
          isPending={isPending}
          onClose={() => setEditingProduct(null)}
          onSubmit={handleUpdate}
          product={editingProduct}
        />
      )}
    </motion.div>
  );
}
