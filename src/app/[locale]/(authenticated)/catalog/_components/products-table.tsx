"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Pencil, Trash2, ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { deleteProduct, createProduct, updateProduct } from "../actions";
import type { Product } from "@/lib/services";

// ---------------------------------------------------------------------------
// BRL formatter
// ---------------------------------------------------------------------------

const BRL_FORMAT = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-on-surface/20 backdrop-blur-sm"
        onClick={onClose}
        onKeyDown={() => {}}
        role="presentation"
      />
      <div className="relative z-10 w-full max-w-lg rounded-xl bg-surface-container-lowest p-8 shadow-ambient-strong">
        <h2 className="mb-6 font-display text-xl font-bold tracking-tight text-on-surface">
          {product ? tc("edit") : t("newProduct")}
        </h2>
        <form
          action={onSubmit}
          className="space-y-4"
        >
          {/* Name */}
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

          {/* Description */}
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

          {/* Price */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-on-surface" htmlFor="prod-price">
              {t("price")}
            </label>
            <input
              className="h-10 w-full rounded-xl bg-surface-container-high px-4 text-sm text-on-surface outline-none transition-colors focus:bg-surface-container-lowest focus:ring-1 focus:ring-primary/30"
              defaultValue={product?.price ?? ""}
              id="prod-price"
              min={0}
              max={999999.99}
              name="price"
              required
              step="0.01"
              type="number"
            />
          </div>

          {/* Agent Instructions */}
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

          {/* Image */}
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

          {/* Actions */}
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
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main table component
// ---------------------------------------------------------------------------

export function ProductsTable({ products }: ProductsTableProps) {
  const t = useTranslations("catalog");
  const tc = useTranslations("common");
  const [isPending, startTransition] = useTransition();
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <div>
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-lg font-bold tracking-tight text-on-surface">
          {t("products")}
        </h2>
        <button
          className="h-9 rounded-xl bg-primary px-4 text-sm font-bold text-on-primary transition-opacity hover:opacity-90"
          onClick={() => setShowCreateModal(true)}
          type="button"
        >
          {t("newProduct")}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 rounded-lg bg-danger-muted px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}

      {/* Table */}
      {products.length === 0 ? (
        <div className="flex min-h-[200px] items-center justify-center rounded-xl bg-surface-container-lowest p-8">
          <p className="text-sm text-on-surface-variant">{tc("noResults")}</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl bg-surface-container-lowest">
          <table className="w-full">
            <thead>
              <tr className="text-left">
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                  {t("image")}
                </th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                  {t("name")}
                </th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                  {t("price")}
                </th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                  Status
                </th>
                <th className="px-6 py-4" />
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr
                  className="transition-colors hover:bg-surface-container-low"
                  key={product.id}
                >
                  <td className="px-6 py-4">
                    {product.imageUrl ? (
                      <img
                        alt={product.name}
                        className="h-10 w-10 rounded-lg object-cover"
                        src={product.imageUrl}
                      />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-container-high">
                        <ImageIcon className="h-4 w-4 text-on-surface-variant" />
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-on-surface">
                    {product.name}
                  </td>
                  <td className="px-6 py-4 text-sm text-on-surface">
                    {BRL_FORMAT.format(product.price)}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                        product.active
                          ? "bg-success-muted text-success"
                          : "bg-surface-container-high text-on-surface-variant",
                      )}
                    >
                      {product.active ? t("active") : t("inactive")}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        className="rounded-lg p-2 text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface"
                        onClick={() => setEditingProduct(product)}
                        type="button"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        className="rounded-lg p-2 text-on-surface-variant transition-colors hover:bg-danger-muted hover:text-danger"
                        disabled={isPending}
                        onClick={() => handleDelete(product.id)}
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

      {/* Create modal */}
      {showCreateModal && (
        <ProductFormModal
          isPending={isPending}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreate}
        />
      )}

      {/* Edit modal */}
      {editingProduct && (
        <ProductFormModal
          isPending={isPending}
          onClose={() => setEditingProduct(null)}
          onSubmit={handleUpdate}
          product={editingProduct}
        />
      )}
    </div>
  );
}
