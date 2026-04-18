"use client";

import { useEffect } from "react";
import { AlertTriangle, X } from "lucide-react";

interface ConfirmDialogProps {
  readonly open: boolean;
  readonly title: string;
  readonly description?: string;
  readonly confirmLabel: string;
  readonly cancelLabel: string;
  readonly variant?: "default" | "danger";
  readonly isPending?: boolean;
  readonly onConfirm: () => void;
  readonly onCancel: () => void;
}

/**
 * Localized, design-system styled replacement for window.confirm.
 * Returns control to the caller via onConfirm / onCancel.
 */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel,
  variant = "default",
  isPending = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onCancel();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  if (!open) return null;

  const confirmClass =
    variant === "danger"
      ? "bg-danger text-on-primary hover:opacity-95"
      : "bg-gradient-to-br from-primary to-primary-dim text-on-primary shadow-lg shadow-primary/10 hover:opacity-95";

  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-[60] flex items-center justify-center bg-on-surface/30 p-4 backdrop-blur-sm"
      onClick={onCancel}
      onKeyDown={() => {}}
      role="dialog"
    >
      <div
        className="w-full max-w-md rounded-2xl bg-surface-container-lowest p-6 shadow-ambient"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
        role="presentation"
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div className="flex gap-3">
            {variant === "danger" && (
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-danger-muted">
                <AlertTriangle className="h-5 w-5 text-danger" />
              </div>
            )}
            <div className="space-y-1">
              <h2 className="font-display text-base font-bold text-on-surface">
                {title}
              </h2>
              {description && (
                <p className="text-sm text-on-surface-variant">{description}</p>
              )}
            </div>
          </div>
          <button
            aria-label="close"
            className="rounded-lg p-1 text-on-surface-variant transition-colors hover:bg-surface-container-high"
            onClick={onCancel}
            type="button"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button
            className="h-10 rounded-xl px-4 text-sm font-semibold text-on-surface-variant hover:text-on-surface disabled:opacity-60"
            disabled={isPending}
            onClick={onCancel}
            type="button"
          >
            {cancelLabel}
          </button>
          <button
            autoFocus
            className={`h-10 rounded-xl px-5 text-sm font-bold transition-all duration-200 active:scale-[0.98] disabled:opacity-60 ${confirmClass}`}
            disabled={isPending}
            onClick={onConfirm}
            type="button"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
