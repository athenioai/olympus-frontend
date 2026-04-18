"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

interface PromptDialogProps {
  readonly open: boolean;
  readonly title: string;
  readonly description?: string;
  readonly placeholder?: string;
  readonly initialValue?: string;
  readonly confirmLabel: string;
  readonly cancelLabel: string;
  readonly isPending?: boolean;
  readonly onConfirm: (value: string) => void;
  readonly onCancel: () => void;
}

/**
 * Localized, design-system styled replacement for window.prompt.
 * Submits on Enter, cancels on Escape.
 */
export function PromptDialog({
  open,
  title,
  description,
  placeholder,
  initialValue = "",
  confirmLabel,
  cancelLabel,
  isPending = false,
  onConfirm,
  onCancel,
}: PromptDialogProps) {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    if (open) setValue(initialValue);
  }, [open, initialValue]);

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onCancel();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  if (!open) return null;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onConfirm(value);
  }

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
          <div className="space-y-1">
            <h2 className="font-display text-base font-bold text-on-surface">
              {title}
            </h2>
            {description && (
              <p className="text-sm text-on-surface-variant">{description}</p>
            )}
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
        <form onSubmit={handleSubmit}>
          <input
            autoFocus
            className="h-11 w-full rounded-lg bg-surface-container-high px-3 text-sm text-on-surface outline-none focus:bg-surface-container-lowest focus:ring-1 focus:ring-primary/30"
            onChange={(e) => setValue(e.target.value)}
            placeholder={placeholder}
            type="text"
            value={value}
          />
          <div className="mt-4 flex justify-end gap-2">
            <button
              className="h-10 rounded-xl px-4 text-sm font-semibold text-on-surface-variant hover:text-on-surface disabled:opacity-60"
              disabled={isPending}
              onClick={onCancel}
              type="button"
            >
              {cancelLabel}
            </button>
            <button
              className="h-10 rounded-xl bg-gradient-to-br from-primary to-primary-dim px-5 text-sm font-bold text-on-primary shadow-lg shadow-primary/10 transition-all duration-200 active:scale-[0.98] disabled:opacity-60"
              disabled={isPending}
              type="submit"
            >
              {confirmLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
